import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { VariantInventory } from '@prisma/client';
import {
  CreateMovementData,
  IInventoryRepository,
} from '../interfaces/inventory.repository.interface';

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findInventory(variantId: string, tx?: any): Promise<VariantInventory | null> {
    const client = tx ?? this.prisma;
    return client.variantInventory.findUnique({ where: { variantId } });
  }

  async lockAndGetInventory(
    variantId: string,
    tx: any,
  ): Promise<VariantInventory | null> {
    const rows = await tx.$queryRaw<VariantInventory[]>`
      SELECT * FROM "VariantInventory" WHERE "variantId" = ${variantId} FOR UPDATE
    `;
    return rows[0] ?? null;
  }

  async createMovement(data: CreateMovementData, tx?: any): Promise<void> {
    const client = tx ?? this.prisma;
    await client.inventoryMovement.create({ data });
  }

  async incrementReserved(
    variantId: string,
    delta: number,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.variantInventory.update({
      where: { variantId },
      data: { reserved: { increment: delta } },
    });
  }

  async decrementReserved(
    variantId: string,
    delta: number,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.variantInventory.update({
      where: { variantId },
      data: { reserved: { decrement: delta } },
    });
  }

  async incrementQuantity(
    variantId: string,
    delta: number,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.variantInventory.update({
      where: { variantId },
      data: { quantity: { increment: delta } },
    });
  }

  async decrementQuantity(
    variantId: string,
    delta: number,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.variantInventory.update({
      where: { variantId },
      data: { quantity: { decrement: delta } },
    });
  }

  async adjustQuantity(
    variantId: string,
    delta: number,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.variantInventory.update({
      where: { variantId },
      data: { quantity: { increment: delta } },
    });
  }
}
