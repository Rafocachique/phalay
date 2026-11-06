import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AuthModule } from '../auth/auth.module';

import { CulqiService } from './culqi.service';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, CulqiService],
  exports: [OrdersService, CulqiService],
})
export class OrdersModule {}
