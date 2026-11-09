import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

export interface ChatbotReply {
  answer: string;
  action: 'answer' | 'clarify' | 'handoff' | 'paused';
  reason: string;
  sources: string[];
  suggestions: string[];
  similarity: number;
}

@Injectable()
export class ChatbotService {
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {}

  async preview(message: string, humanActive = false): Promise<ChatbotReply> {
    const base = this.config.get<string>('CHATBOT_SERVICE_URL');
    const key = this.config.get<string>('CHATBOT_API_KEY');
    if (!base || !key || key.length < 32 || key.startsWith('replace')) {
      throw new ServiceUnavailableException('El servicio del chatbot todavía no está configurado');
    }
    try {
      const url = new URL(base);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if (url.username || url.password || url.search || url.hash ||
          (url.protocol !== 'https:' && !(url.protocol === 'http:' && local && this.config.get('NODE_ENV') !== 'production'))) {
        throw new Error('Invalid service URL');
      }
      const faqs = await this.prisma.faq.findMany({
        where: { isActive: true }, orderBy: { position: 'asc' }, take: 501,
        select: { id: true, question: true, answer: true },
      });
      if (faqs.length > 500 || faqs.some((faq) => !faq.question.trim() || faq.question.length > 500 ||
          !faq.answer.trim() || faq.answer.length > 4000)) {
        throw new Error('Knowledge base requires review');
      }
      const articles = faqs.map((faq) => ({ id: faq.id, title: faq.question.slice(0, 200),
        questions: [faq.question], answer: faq.answer }));
      const response = await fetch(`${base.replace(/\/$/, '')}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ message, human_active: humanActive, articles }),
        signal: AbortSignal.timeout(12_000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Service unavailable');
      const data = await response.json() as ChatbotReply;
      if (!['answer', 'clarify', 'handoff', 'paused'].includes(data.action) ||
          typeof data.answer !== 'string' || typeof data.reason !== 'string' ||
          !Array.isArray(data.sources) || !Array.isArray(data.suggestions) ||
          ![...data.sources, ...data.suggestions].every((value) => typeof value === 'string') ||
          typeof data.similarity !== 'number') {
        throw new Error('Invalid chatbot response');
      }
      return { answer: data.answer, action: data.action, reason: data.reason,
        sources: data.sources, suggestions: data.suggestions, similarity: data.similarity };
    } catch {
      throw new ServiceUnavailableException('El asistente no está disponible. Intenta nuevamente.');
    }
  }
}
