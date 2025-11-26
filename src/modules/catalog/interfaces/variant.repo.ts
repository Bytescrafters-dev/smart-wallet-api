import {
  ProductVariant,
  ProductVariantPrice,
  VariantInventory,
} from '@prisma/client';

export interface IVariantRepo {
  findById(id: string): Promise<ProductVariant | null>;
  listByProduct(productId: string): Promise<ProductVariant[]>;
  createVariantWithPricingAndInventory(args: {
    productId: string;
    sku: string;
    optionValueIds: string[];
    priceCents: number;
    currency: string;
    initialQty?: number;
  }): Promise<ProductVariant>;

  upsertPrice(
    variantId: string,
    currency: string,
    amount: number,
  ): Promise<ProductVariantPrice>;
  adjustInventory(variantId: string, delta: number): Promise<VariantInventory>;
  setInventory(variantId: string, quantity: number): Promise<VariantInventory>;
  delete(variantId: string): Promise<void>;
}
