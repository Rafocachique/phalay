// =========================================
// Módulo de Base de Datos - Prisma
// Singleton Pattern para conexión
// =========================================

import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
