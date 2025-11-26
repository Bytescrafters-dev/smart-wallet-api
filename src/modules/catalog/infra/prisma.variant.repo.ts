import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { IVariantRepo } from '../interfaces/variant.repo';
import {
  ProductVariant,
  ProductVariantPrice,
  VariantInventory,
} from '@prisma/client';

@Injectable()
export class PrismaVariantRepo implements IVariantRepo {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.productVariant.findUnique({ where: { id } });
  }

  listByProduct(productId: string) {
    return this.prisma.productVariant.findMany({ where: { productId } });
  }

  async createVariantWithPricingAndInventory(args: {
    productId: string;
    sku: string;
    optionValueIds: string[];
    priceCents: number;
    currency: string;
    initialQty?: number;
  }): Promise<ProductVariant> {
    const {
      productId,
      sku,
      optionValueIds,
      priceCents,
      currency,
      initialQty = 0,
    } = args;

    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: { productId, sku },
      });

      await Promise.all(
        optionValueIds.map((optionValueId) =>
          tx.productVariantOptionValue.create({
            data: { variantId: variant.id, optionValueId },
          }),
        ),
      );

      await tx.productVariantPrice.create({
        data: { variantId: variant.id, currency, amount: priceCents },
      });

      await tx.variantInventory.create({
        data: { variantId: variant.id, quantity: initialQty, reserved: 0 },
      });

      return variant;
    });
  }

  upsertPrice(
    variantId: string,
    currency: string,
    amount: number,
  ): Promise<ProductVariantPrice> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.productVariantPrice.updateMany({
        where: { variantId, currency, validTo: null },
        data: { validTo: now },
      });
      return tx.productVariantPrice.create({
        data: { variantId, currency, amount, validFrom: now },
      });
    });
  }

  async adjustInventory(
    variantId: string,
    delta: number,
  ): Promise<VariantInventory> {
    const inv = await this.prisma.variantInventory.update({
      where: { variantId },
      data: { quantity: { increment: delta } },
    });
    if (inv.quantity < 0) {
      await this.prisma.variantInventory.update({
        where: { variantId },
        data: { quantity: { decrement: delta } },
      });
      throw new NotFoundException('Insufficient stock');
    }
    return inv;
  }

  setInventory(variantId: string, quantity: number) {
    return this.prisma.variantInventory.update({
      where: { variantId },
      data: { quantity },
    });
  }

  async delete(variantId: string) {
    await this.prisma.productVariant.delete({ where: { id: variantId } });
  }
}
