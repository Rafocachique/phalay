import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [OrdersModule, DatabaseModule, AuthModule],
  controllers: [PaymentsController],
  providers: [],
})
export class PaymentsModule {}
