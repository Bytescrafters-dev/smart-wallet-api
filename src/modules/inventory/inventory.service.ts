import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  InventoryMovementActorType,
  InventoryMovementRefType,
  InventoryMovementType,
} from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TOKENS } from 'src/common/constants/tokens';
import { IInventoryRepository } from './interfaces/inventory.repository.interface';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(TOKENS.InventoryRepo)
    private readonly inventoryRepo: IInventoryRepository,
    private readonly prisma: PrismaService,
  ) {}

  // Called on order placement — locks the row, checks availability, reserves stock
  async reserve(
    variantId: string,
    qty: number,
    orderId: string,
    actorId: string | null = null,
    tx?: any,
  ): Promise<void> {
    const run = async (client: any) => {
      const inventory = await this.inventoryRepo.lockAndGetInventory(
        variantId,
        client,
      );
      if (!inventory || inventory.quantity - inventory.reserved < qty) {
        throw new BadRequestException(
          `Insufficient stock for variant ${variantId}`,
        );
      }
      await this.inventoryRepo.createMovement(
        {
          variantId,
          type: InventoryMovementType.RESERVED,
          delta: qty,
          refType: InventoryMovementRefType.ORDER,
          refId: orderId,
          actorType: InventoryMovementActorType.SYSTEM,
          actorId,
        },
        client,
      );
      await this.inventoryRepo.incrementReserved(variantId, qty, client);
    };

    tx ? await run(tx) : await this.prisma.$transaction(run);
  }

  // Called on order cancellation — releases the reservation back to available
  async unreserve(
    variantId: string,
    qty: number,
    orderId: string,
    actorId: string | null = null,
    tx?: any,
  ): Promise<void> {
    const run = async (client: any) => {
      await this.inventoryRepo.createMovement(
        {
          variantId,
          type: InventoryMovementType.UNRESERVED,
          delta: qty,
          refType: InventoryMovementRefType.ORDER,
          refId: orderId,
          actorType: actorId
            ? InventoryMovementActorType.ADMIN
            : InventoryMovementActorType.SYSTEM,
          actorId,
        },
        client,
      );
      await this.inventoryRepo.decrementReserved(variantId, qty, client);
    };

    tx ? await run(tx) : await this.prisma.$transaction(run);
  }

  // Called on order fulfilment — permanently deducts quantity and clears reservation
  async sell(
    variantId: string,
    qty: number,
    orderId: string,
    actorId: string,
    tx?: any,
  ): Promise<void> {
    const run = async (client: any) => {
      await this.inventoryRepo.createMovement(
        {
          variantId,
          type: InventoryMovementType.SALE,
          delta: qty,
          refType: InventoryMovementRefType.ORDER,
          refId: orderId,
          actorType: InventoryMovementActorType.ADMIN,
          actorId,
        },
        client,
      );
      await this.inventoryRepo.decrementQuantity(variantId, qty, client);
      await this.inventoryRepo.decrementReserved(variantId, qty, client);
    };

    tx ? await run(tx) : await this.prisma.$transaction(run);
  }

  // Called when a stock order line is received — adds physical stock
  async stockIn(
    variantId: string,
    qty: number,
    stockOrderId: string,
    actorId: string,
    tx?: any,
  ): Promise<void> {
    const run = async (client: any) => {
      await this.inventoryRepo.createMovement(
        {
          variantId,
          type: InventoryMovementType.STOCK_IN,
          delta: qty,
          refType: InventoryMovementRefType.STOCK_ORDER,
          refId: stockOrderId,
          actorType: InventoryMovementActorType.ADMIN,
          actorId,
        },
        client,
      );
      await this.inventoryRepo.incrementQuantity(variantId, qty, client);
    };

    tx ? await run(tx) : await this.prisma.$transaction(run);
  }

  // Called when a direct stock receipt is created — adds physical stock without a PO
  async receiptIn(
    variantId: string,
    qty: number,
    receiptId: string,
    actorId: string,
    tx?: any,
  ): Promise<void> {
    const run = async (client: any) => {
      await this.inventoryRepo.createMovement(
        {
          variantId,
          type: InventoryMovementType.RECEIPT_IN,
          delta: qty,
          refType: InventoryMovementRefType.STOCK_RECEIPT,
          refId: receiptId,
          actorType: InventoryMovementActorType.ADMIN,
          actorId,
        },
        client,
      );
      await this.inventoryRepo.incrementQuantity(variantId, qty, client);
    };

    tx ? await run(tx) : await this.prisma.$transaction(run);
  }

  // Called for manual stock adjustments — delta is signed (positive adds, negative removes)
  async adjust(
    variantId: string,
    delta: number,
    adjustmentId: string,
    actorId: string,
    tx?: any,
  ): Promise<void> {
    const run = async (client: any) => {
      await this.inventoryRepo.createMovement(
        {
          variantId,
          type: InventoryMovementType.ADJUSTMENT,
          delta,
          refType: InventoryMovementRefType.STOCK_ADJUSTMENT,
          refId: adjustmentId,
          actorType: InventoryMovementActorType.ADMIN,
          actorId,
        },
        client,
      );
      await this.inventoryRepo.adjustQuantity(variantId, delta, client);
    };

    tx ? await run(tx) : await this.prisma.$transaction(run);
  }
}
