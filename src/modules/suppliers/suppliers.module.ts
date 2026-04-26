import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TOKENS } from 'src/common/constants/tokens';
import { PlatformJwtModule } from '../auth/jwt.module';
import { SupplierController } from './suppliers.controller';
import { SupplierService } from './suppliers.service';
import { StoreRepository } from '../stores/infra/store.repository';
import { SupplierRepository } from './infra/supplier.repository';

@Module({
  imports: [ConfigModule, PlatformJwtModule],
  controllers: [SupplierController],
  providers: [
    SupplierService,
    { provide: TOKENS.StoreRepo, useClass: StoreRepository },
    { provide: TOKENS.SupplierRepo, useClass: SupplierRepository },
  ],
  exports: [TOKENS.StoreRepo, TOKENS.SupplierRepo, SupplierService],
})
export class SuppliersModule {}
