import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [OrdersModule, DatabaseModule],
  controllers: [PaymentsController],
  providers: [],
})
export class PaymentsModule {}
