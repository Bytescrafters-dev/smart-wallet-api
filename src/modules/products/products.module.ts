import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TOKENS } from 'src/common/constants/tokens';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductRepository } from './infra/product.repository';
import { StoreRepository } from '../stores/infra/store.repository';
import { CategoryRepository } from '../categories/infra/category.repository';
import { PlatformJwtModule } from '../auth/jwt.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [ConfigModule, PlatformJwtModule, forwardRef(() => UploadsModule)],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    { provide: TOKENS.ProductRepo, useClass: ProductRepository },
    { provide: TOKENS.StoreRepo, useClass: StoreRepository },
    { provide: TOKENS.CategoryRepo, useClass: CategoryRepository },
  ],
  exports: [TOKENS.ProductRepo, ProductsService],
})
export class ProductsModule {}