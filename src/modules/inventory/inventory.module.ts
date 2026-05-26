import { Module } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './infra/inventory.repository';
import { ProductRepository } from '../products/infra/product.repository';

@Module({
  providers: [
    InventoryService,
    { provide: TOKENS.InventoryRepo, useClass: InventoryRepository },
    { provide: TOKENS.ProductRepo, useClass: ProductRepository },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
