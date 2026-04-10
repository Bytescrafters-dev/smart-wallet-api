import { Injectable } from '@nestjs/common';
import { Cart, CartItem, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CartWithItemDetails,
  CartWithItems,
  ICartRepository,
} from '../interfaces/cart.repository.interface';

const CART_INCLUDE = { items: true } as const;

type RawCartWithItems = Cart & { items: CartItem[] };

async function enrichCart(
  prisma: PrismaService,
  raw: RawCartWithItems | null,
): Promise<CartWithItemDetails | null> {
  if (!raw) return null;

  const items = await Promise.all(
    raw.items.map(async (item) => {
      const [product, variant] = await Promise.all([
        prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            title: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, alt: true },
            },
          },
        }),
        prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: {
            id: true,
            sku: true,
            title: true,
            optionValues: {
              include: {
                optionValue: {
                  select: {
                    value: true,
                    option: { select: { name: true } },
                  },
                },
              },
            },
          },
        }),
      ]);

      return { ...item, product: product!, variant: variant! };
    }),
  );

  return { ...raw, items };
}

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByStoreUserId(
    storeId: string,
    storeUserId: string,
  ): Promise<CartWithItemDetails | null> {
    const raw = await this.prisma.cart.findFirst({
      where: { storeId, storeUserId },
      include: CART_INCLUDE,
    });
    return enrichCart(this.prisma, raw);
  }

  async findBySessionId(
    storeId: string,
    sessionId: string,
  ): Promise<CartWithItemDetails | null> {
    const raw = await this.prisma.cart.findFirst({
      where: { storeId, sessionId },
      include: CART_INCLUDE,
    });
    return enrichCart(this.prisma, raw);
  }

  async findById(cartId: string): Promise<CartWithItemDetails | null> {
    const raw = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: CART_INCLUDE,
    });
    return enrichCart(this.prisma, raw);
  }

  createForStoreUser(
    storeId: string,
    storeUserId: string,
    currency: string,
  ): Promise<Cart> {
    return this.prisma.cart.create({ data: { storeId, storeUserId, currency } });
  }

  createForSession(
    storeId: string,
    sessionId: string,
    currency: string,
  ): Promise<Cart> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return this.prisma.cart.create({
      data: { storeId, sessionId, currency, expiresAt },
    });
  }

  async upsertItem(
    cartId: string,
    productId: string,
    variantId: string,
    unitPrice: number,
    quantity: number,
  ): Promise<CartItem> {
    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId, variantId },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity, unitPrice },
      });
    }

    return this.prisma.cartItem.create({
      data: { cartId, productId, variantId, unitPrice, quantity },
    });
  }

  async removeItem(cartId: string, itemId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
  }

  async updateItem(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<void> {
    await this.prisma.cartItem.update({
      where: { id: itemId, cartId },
      data: { quantity },
    });
  }

  async clearItems(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  async deleteCart(cartId: string): Promise<void> {
    await this.prisma.cart.delete({ where: { id: cartId } });
  }

  async mergeGuestIntoUser(
    guestCartId: string,
    userCartId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const guestItems = await tx.cartItem.findMany({
        where: { cartId: guestCartId },
      });

      for (const item of guestItems) {
        const existing = await tx.cartItem.findFirst({
          where: { cartId: userCartId, variantId: item.variantId },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userCartId,
              productId: item.productId,
              variantId: item.variantId,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
            },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: guestCartId } });
      await tx.cart.delete({ where: { id: guestCartId } });
    });
  }
}
