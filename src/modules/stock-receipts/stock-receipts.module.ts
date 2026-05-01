import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TOKENS } from 'src/common/constants/tokens';
import { PlatformJwtModule } from '../auth/jwt.module';
import { InventoryModule } from '../inventory/inventory.module';
import { StoreRepository } from '../stores/infra/store.repository';
import { StockReceiptsController } from './stock-receipts.controller';
import { StockReceiptsService } from './stock-receipts.service';
import { StockReceiptRepository } from './infra/stock-receipt.repository';

@Module({
  imports: [ConfigModule, PlatformJwtModule, InventoryModule],
  controllers: [StockReceiptsController],
  providers: [
    StockReceiptsService,
    { provide: TOKENS.StockReceiptRepo, useClass: StockReceiptRepository },
    { provide: TOKENS.StoreRepo, useClass: StoreRepository },
  ],
})
export class StockReceiptsModule {}
