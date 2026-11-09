import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ChatbotService } from './chatbot.service';

class PreviewChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Matches(/\S/)
  message!: string;

  @IsOptional()
  @IsBoolean()
  humanActive?: boolean;
}

@Controller('chatbot')
@UseGuards(JwtGuard, RolesGuard)
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  @Post('preview')
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  preview(@Body() body: PreviewChatDto) {
    return this.chatbot.preview(body.message, body.humanActive);
  }
}
