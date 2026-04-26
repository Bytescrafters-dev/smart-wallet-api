import { Module } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './infra/inventory.repository';

@Module({
  providers: [
    InventoryService,
    { provide: TOKENS.InventoryRepo, useClass: InventoryRepository },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
