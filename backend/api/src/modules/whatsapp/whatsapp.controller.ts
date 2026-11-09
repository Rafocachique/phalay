import { Body, Controller, ForbiddenException, Get, Headers, HttpCode, Param, ParseUUIDPipe, Post, Query, RawBodyRequest, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { WhatsappService } from './whatsapp.service';
import { equalSecret } from './whatsapp.security';

class ModeDto {
  @IsIn(['BOT', 'HUMAN'])
  mode!: 'BOT' | 'HUMAN';
}
class ReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  @Matches(/\S/)
  message!: string;
}
type UserRequest = Request & { user: { id: string } };

@Controller('whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly whatsapp: WhatsappService, private readonly config: ConfigService) {}

  @Get('webhook')
  verify(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string, @Res() response: Response) {
    response.type('text/plain').send(this.whatsapp.verify(mode, token, challenge));
  }

  @Post('webhook')
  @HttpCode(200)
  receive(@Req() request: RawBodyRequest<Request>, @Headers('x-hub-signature-256') signature: string) {
    return this.whatsapp.receive(request.rawBody, signature, request.body);
  }

  @Get('process')
  @SkipThrottle()
  process(@Headers('authorization') authorization: string) {
    const secret = this.config.get<string>('CRON_SECRET');
    if (!secret || secret.length < 32 || !equalSecret(authorization, `Bearer ${secret}`)) throw new ForbiddenException();
    return this.whatsapp.processQueue();
  }
}

@Controller('whatsapp')
@UseGuards(JwtGuard, RolesGuard)
export class WhatsappInboxController {
  constructor(private readonly whatsapp: WhatsappService) {}

  @Get('status')
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  status() { return this.whatsapp.status(); }

  @Get('conversations')
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  list() { return this.whatsapp.list(); }

  @Get('conversations/:id/messages')
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  history(@Param('id', ParseUUIDPipe) id: string) { return this.whatsapp.history(id); }

  @Post('conversations/:id/mode')
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  mode(@Param('id', ParseUUIDPipe) id: string, @Body() body: ModeDto, @Req() request: UserRequest) {
    return this.whatsapp.setMode(id, body.mode, request.user.id);
  }

  @Post('conversations/:id/reply')
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  reply(@Param('id', ParseUUIDPipe) id: string, @Body() body: ReplyDto, @Req() request: UserRequest) {
    return this.whatsapp.manualReply(id, body.message, request.user.id);
  }

  @Post('process')
  @Roles(['SUPER_ADMIN'])
  process() { return this.whatsapp.processQueue(); }
}
