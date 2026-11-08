import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /** Registro público, con validación y límite global de solicitudes. */
  @Post('subscribe')
  subscribe(@Body() body: { email?: string; website?: string; consent?: boolean }) {
    return this.newsletterService.subscribe(body);
  }

  /** La lista de correos nunca se publica: sólo Super Admin puede verla. */
  @Get('subscribers')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['SUPER_ADMIN'])
  @ApiBearerAuth()
  list() {
    return this.newsletterService.list();
  }
}
