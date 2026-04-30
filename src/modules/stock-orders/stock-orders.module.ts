import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TOKENS } from 'src/common/constants/tokens';
import { PlatformJwtModule } from '../auth/jwt.module';
import { InventoryModule } from '../inventory/inventory.module';
import { StoreRepository } from '../stores/infra/store.repository';
import { StockOrdersController } from './stock-orders.controller';
import { StockOrdersService } from './stock-orders.service';
import { StockOrderRepository } from './infra/stock-order.repository';

@Module({
  imports: [ConfigModule, PlatformJwtModule, InventoryModule],
  controllers: [StockOrdersController],
  providers: [
    StockOrdersService,
    { provide: TOKENS.StockOrderRepo, useClass: StockOrderRepository },
    { provide: TOKENS.StoreRepo, useClass: StoreRepository },
  ],
  exports: [StockOrdersService],
})
export class StockOrdersModule {}
