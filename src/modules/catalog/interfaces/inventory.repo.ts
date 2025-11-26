import { VariantInventory } from '@prisma/client';

export interface IInventoryRepo {
  get(variantId: string): Promise<VariantInventory | null>;
  adjust(variantId: string, delta: number): Promise<VariantInventory>;
  reserve(variantId: string, qty: number): Promise<VariantInventory>;
  confirm(variantId: string, qty: number): Promise<VariantInventory>;
  release(variantId: string, qty: number): Promise<VariantInventory>;
}
