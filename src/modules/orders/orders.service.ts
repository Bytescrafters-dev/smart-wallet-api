import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async checkout(
    storeId: string,
    cartId: string,
    addressTo: any,
    shippingOptionId?: string,
  ) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true, user: true },
    });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart empty');

    let shippingCents = 0;
    if (shippingOptionId) {
      const opt = await this.prisma.shippingOption.findUnique({ where: { id: shippingOptionId } });
      if (!opt) throw new BadRequestException('Invalid shipping option');
      shippingCents = opt.amount ?? 0;
    }

    return this.prisma.$transaction(async (tx) => {
      const addr = await tx.address.create({ data: addressTo });

      let subtotal = 0;
      for (const it of cart.items) subtotal += it.unitPrice * it.quantity;

      const order = await tx.order.create({
        data: {
          storeId,
          userId: cart.userId ?? null,
          status: 'PENDING',
          currency: cart.currency,
          subtotal,
          shipping: shippingCents,
          discount: 0,
          tax: 0,
          total: subtotal + shippingCents,
          addressToId: addr.id,
          shippingOptionId: shippingOptionId ?? null,
        },
      });

      for (const it of cart.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: it.variantId },
          include: {
            product: true,
            optionValues: { include: { optionValue: { include: { option: true } } } },
          },
        });
        if (!variant) throw new NotFoundException('Variant missing during checkout');

        const title = [
          variant.product.title,
          ...variant.optionValues.map(
            (ov) => `${ov.optionValue.option.name}: ${ov.optionValue.value}`,
          ),
        ].join(' / ');

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: it.productId,
            variantId: it.variantId,
            sku: variant.sku,
            title,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            options: {},
          },
        });

        await tx.variantInventory.update({
          where: { variantId: it.variantId },
          data: { reserved: { increment: it.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });

      // TODO: create Stripe PaymentIntent and attach to order.paymentId
      return order;
    });
  }

  async confirm(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== 'PENDING') return order;

      for (const it of order.items) {
        await tx.variantInventory.update({
          where: { variantId: it.variantId },
          data: {
            reserved: { decrement: it.quantity },
            quantity: { decrement: it.quantity },
          },
        });
      }

      return tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
    });
  }
}
