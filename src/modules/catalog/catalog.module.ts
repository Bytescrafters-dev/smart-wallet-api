import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.public.controller';
import { CatalogAdminController } from './catalog.admin.controller';
import { CatalogService } from './catalog.service';
import { TOKENS } from '../../common/constants/tokens';
import { PrismaCategoryRepo } from './infra/prisma.category.repo';
import { PrismaProductRepo } from './infra/prisma.product.repo';
import { PrismaVariantRepo } from './infra/prisma.variant.repo';
import { PrismaInventoryRepo } from './infra/prisma.inventory.repo';

@Module({
  controllers: [CatalogController, CatalogAdminController],
  providers: [
    CatalogService,
    { provide: TOKENS.CategoryRepo, useClass: PrismaCategoryRepo },
    { provide: TOKENS.ProductRepo, useClass: PrismaProductRepo },
    { provide: TOKENS.VariantRepo, useClass: PrismaVariantRepo },
    { provide: TOKENS.InventoryRepo, useClass: PrismaInventoryRepo },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
