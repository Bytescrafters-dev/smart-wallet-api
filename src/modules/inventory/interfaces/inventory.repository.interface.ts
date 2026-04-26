import {
  InventoryMovementActorType,
  InventoryMovementRefType,
  InventoryMovementType,
  VariantInventory,
} from '@prisma/client';

export interface CreateMovementData {
  variantId: string;
  type: InventoryMovementType;
  delta: number;
  refType: InventoryMovementRefType;
  refId: string;
  actorType: InventoryMovementActorType;
  actorId?: string | null;
  note?: string | null;
}

export interface IInventoryRepository {
  findInventory(variantId: string, tx?: any): Promise<VariantInventory | null>;
  lockAndGetInventory(variantId: string, tx: any): Promise<VariantInventory | null>;
  createMovement(data: CreateMovementData, tx?: any): Promise<void>;
  incrementReserved(variantId: string, delta: number, tx?: any): Promise<void>;
  decrementReserved(variantId: string, delta: number, tx?: any): Promise<void>;
  incrementQuantity(variantId: string, delta: number, tx?: any): Promise<void>;
  decrementQuantity(variantId: string, delta: number, tx?: any): Promise<void>;
  adjustQuantity(variantId: string, delta: number, tx?: any): Promise<void>;
}
