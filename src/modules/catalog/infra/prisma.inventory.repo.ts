import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { IInventoryRepo } from '../interfaces/inventory.repo';

@Injectable()
export class PrismaInventoryRepo implements IInventoryRepo {
  constructor(private prisma: PrismaService) {}

  get(variantId: string) {
    return this.prisma.variantInventory.findUnique({ where: { variantId } });
  }

  adjust(variantId: string, delta: number) {
    return this.prisma.$transaction(async (tx) => {
      const inv = await tx.variantInventory.update({
        where: { variantId },
        data: { quantity: { increment: delta } },
      });
      if (inv.quantity < 0) throw new BadRequestException('Insufficient stock');
      return inv;
    });
  }

  reserve(variantId: string, qty: number) {
    return this.prisma.$transaction(async (tx) => {
      const inv = await tx.variantInventory.update({
        where: { variantId },
        data: { reserved: { increment: qty } },
      });
      if (inv.quantity - inv.reserved < 0)
        throw new BadRequestException('Not enough free stock to reserve');
      return inv;
    });
  }

  confirm(variantId: string, qty: number) {
    return this.prisma.$transaction(async (tx) => {
      return tx.variantInventory.update({
        where: { variantId },
        data: { reserved: { decrement: qty }, quantity: { decrement: qty } },
      });
    });
  }

  release(variantId: string, qty: number) {
    return this.prisma.variantInventory.update({
      where: { variantId },
      data: { reserved: { decrement: qty } },
    });
  }
}
