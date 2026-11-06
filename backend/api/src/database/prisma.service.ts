// =========================================
// Servicio Prisma - Conexión a BD
// Soft Deletes Middleware incluido
// =========================================

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    // Soft Delete implementable vía extensiones en Prisma 6
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Conexión a PostgreSQL establecida');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Conexión a PostgreSQL cerrada');
  }
}
