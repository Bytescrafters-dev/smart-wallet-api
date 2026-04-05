import { Cart, CartItem } from '@prisma/client';

export type CartWithItems = Cart & { items: CartItem[] };

export type CartItemDetail = CartItem & {
  product: {
    id: string;
    title: string;
    slug: string;
    images: { url: string; alt: string | null }[];
  };
  variant: {
    id: string;
    sku: string;
    title: string | null;
    optionValues: {
      optionValue: {
        value: string;
        option: { name: string };
      };
    }[];
  };
};

export type CartWithItemDetails = Cart & { items: CartItemDetail[] };

export interface ICartRepository {
  findByUserId(
    storeId: string,
    userId: string,
  ): Promise<CartWithItemDetails | null>;
  findBySessionId(
    storeId: string,
    sessionId: string,
  ): Promise<CartWithItemDetails | null>;
  findById(cartId: string): Promise<CartWithItemDetails | null>;
  createForUser(
    storeId: string,
    userId: string,
    currency: string,
  ): Promise<Cart>;
  createForSession(
    storeId: string,
    sessionId: string,
    currency: string,
  ): Promise<Cart>;
  upsertItem(
    cartId: string,
    productId: string,
    variantId: string,
    unitPrice: number,
    quantity: number,
  ): Promise<CartItem>;
  removeItem(cartId: string, itemId: string): Promise<void>;
  updateItem(cartId: string, itemId: string, quantity: number): Promise<void>;
  clearItems(cartId: string): Promise<void>;
  deleteCart(cartId: string): Promise<void>;
  mergeGuestIntoUser(guestCartId: string, userCartId: string): Promise<void>;
}
