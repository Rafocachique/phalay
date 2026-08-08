// =========================================
// PHALAY API - Punto de Entrada Principal
// =========================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ── Aumento del tamaño de payload ──
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // ── Seguridad ──
  app.use(helmet());

  // En producción sólo se permiten los orígenes listados en CORS_ALLOWED_ORIGINS
  // (separados por coma). En desarrollo se permite cualquier origen para evitar
  // fricción con distintos hostnames/IPs locales.
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: isProduction ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // ── Prefijo global y versionado ──
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Validación global de DTOs ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Swagger / OpenAPI ──
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PHALAY API')
      .setDescription('API Enterprise de la plataforma PHALAY - E-commerce de Moda Femenina')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticación y Sesiones')
      .addTag('users', 'Gestión de Usuarios')
      .addTag('products', 'Catálogo de Productos')
      .addTag('categories', 'Categorías de Productos')
      .addTag('collections', 'Colecciones Especiales')
      .addTag('orders', 'Gestión de Pedidos')
      .addTag('payments', 'Procesamiento de Pagos')
      .addTag('admin', 'Administración')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.API_PORT || 4000;
  await app.listen(port, '0.0.0.0');

  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🚀 PHALAY API está corriendo               ║
  ║   📍 http://localhost:${port}/api/v1           ║
  ║   📚 Swagger: http://localhost:${port}/api/docs ║
  ╚══════════════════════════════════════════════╝
  `);
}

bootstrap();
