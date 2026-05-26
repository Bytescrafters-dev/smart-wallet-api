import { Module } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CartService } from './cart.service';
import { CartRepository } from './infra/cart.repository';
import { OrderRepository } from './infra/order.repository';
import { StoreRepository } from '../stores/infra/store.repository';
import { PlatformJwtModule } from '../auth/jwt.module';
import { ProductRepository } from '../products/infra/product.repository';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PlatformJwtModule, InventoryModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    CartService,
    { provide: TOKENS.CartRepo, useClass: CartRepository },
    { provide: TOKENS.OrderRepo, useClass: OrderRepository },
    { provide: TOKENS.StoreRepo, useClass: StoreRepository },
    { provide: TOKENS.ProductRepo, useClass: ProductRepository },
  ],
  exports: [CartService],
})
export class OrdersModule {}
