import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async addToCart(
    cartId: string | null,
    input: {
      userId?: string;
      currency: string;
      productId: string;
      variantId: string;
      quantity: number;
    },
  ) {
    const { userId, currency, productId, variantId, quantity } = input;

    // resolve price (current active price)
    const now = new Date();
    const priceRow = await this.prisma.productVariantPrice.findFirst({
      where: {
        variantId,
        currency,
        OR: [{ validTo: null }, { validTo: { gt: now } }],
      },
      orderBy: { validFrom: 'asc' },
    });
    if (!priceRow)
      throw new BadRequestException(
        'No price for variant in requested currency',
      );

    let cart = cartId
      ? await this.prisma.cart.findUnique({ where: { id: cartId } })
      : null;
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId: userId ?? null, currency },
      });
    }

    const item = await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId,
        quantity,
        unitPrice: priceRow.amount,
      },
    });
    return { cartId: cart.id, item };
  }

  async checkout(
    storeId: string,
    cartId: string,
    addressTo: any,
    shippingOptionId?: string,
  ) {
    // Pull cart with items + variant/product snapshots
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true, user: true },
    });
    if (!cart || cart.items.length === 0)
      throw new BadRequestException('Cart empty');

    // (Optional) validate shipping option belongs to store & is compatible
    let shippingCents = 0;
    if (shippingOptionId) {
      const opt = await this.prisma.shippingOption.findUnique({
        where: { id: shippingOptionId },
      });
      if (!opt) throw new BadRequestException('Invalid shipping option');
      shippingCents = opt.amount ?? 0;
    }

    // Build order with price snapshots + reserve stock
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
        // Fetch product/variant details for snapshot
        const variant = await tx.productVariant.findUnique({
          where: { id: it.variantId },
          include: {
            product: true,
            optionValues: {
              include: { optionValue: { include: { option: true } } },
            },
          },
        });
        if (!variant)
          throw new NotFoundException('Variant missing during checkout');

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

        // Reserve stock (reserved += qty)
        await tx.variantInventory.update({
          where: { variantId: it.variantId },
          data: { reserved: { increment: it.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });

      // TODO: create Stripe PaymentIntent via PaymentPort and attach to order.paymentId
      return order;
    });
  }

  async confirm(orderId: string) {
    // On payment success webhook, convert reservation → decrement inventory
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
      return tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });
    });
  }
}
