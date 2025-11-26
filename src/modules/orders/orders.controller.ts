import { Body, Controller, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private svc: OrdersService) {}

  // Add item to cart (guest or user). Pass existing cartId to continue a cart.
  @Post('cart/items')
  addToCart(@Body() b: any) {
    return this.svc.addToCart(b.cartId ?? null, {
      userId: b.userId ?? undefined,
      currency: b.currency,
      productId: b.productId,
      variantId: b.variantId,
      quantity: b.quantity,
    });
  }

  // Create order (PENDING) + reserve stock
  @Post('checkout')
  checkout(@Body() b: any) {
    return this.svc.checkout(
      b.storeId,
      b.cartId,
      b.addressTo,
      b.shippingOptionId,
    );
  }

  // Simulate payment success (replace with Stripe webhook)
  @Post('orders/:id/confirm')
  confirm(@Param('id') id: string) {
    return this.svc.confirm(id);
  }
}
