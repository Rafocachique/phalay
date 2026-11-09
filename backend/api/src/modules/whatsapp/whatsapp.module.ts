import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { WhatsappService } from './whatsapp.service';
import { WhatsappInboxController, WhatsappWebhookController } from './whatsapp.controller';

@Module({ imports: [AuthModule, ChatbotModule], controllers: [WhatsappWebhookController, WhatsappInboxController],
  providers: [WhatsappService] })
export class WhatsappModule {}
