import { Module } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CartService } from './cart.service';
import { CartRepository } from './infra/cart.repository';
import { StoreRepository } from '../stores/infra/store.repository';
import { PlatformJwtModule } from '../auth/jwt.module';
import { ProductRepository } from '../products/infra/product.repository';

@Module({
  imports: [PlatformJwtModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    CartService,
    { provide: TOKENS.CartRepo, useClass: CartRepository },
    { provide: TOKENS.StoreRepo, useClass: StoreRepository },
    { provide: TOKENS.ProductRepo, useClass: ProductRepository },
  ],
  exports: [CartService],
})
export class OrdersModule {}
