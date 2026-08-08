// =========================================
// Módulo Principal de la Aplicación
// =========================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductsModule } from './modules/products/products.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DatabaseModule } from './database/database.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    CacheModule.register({
      isGlobal: true,
      // Si estamos en producción (en vivo), la caché dura 1 minuto. Si estamos programando, dura 1 milisegundo (apagada).
      ttl: process.env.NODE_ENV === 'production' ? 60000 : 1, 
      max: 100, // máximo 100 elementos en caché
    }),

    // Rate Limiting global - Protección DDoS / Brute Force
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 segundo
        limit: 10,   // 10 requests
      },
      {
        name: 'medium',
        ttl: 10000,  // 10 segundos
        limit: 50,   // 50 requests
      },
      {
        name: 'long',
        ttl: 60000,  // 1 minuto
        limit: 100,  // 100 requests
      },
    ]),

    // Módulos del sistema
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    StoresModule,
    ProductsModule,
    PaymentsModule,
    CollectionsModule,
    OrdersModule,
    CategoriesModule,
    ShippingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
