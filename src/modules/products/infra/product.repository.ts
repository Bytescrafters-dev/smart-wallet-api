import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IProductRepository, ProductListParams } from '../interfaces/product.repository.interface';
import { Product, ProductImage } from '@prisma/client';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findBySlug(storeId: string, slug: string) {
    return this.prisma.product.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
  }

  list(params: ProductListParams) {
    const { storeId, q, categoryId, active, skip = 0, take = 20, orderBy } = params;
    return this.prisma.product.findMany({
      where: {
        storeId,
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(active === undefined ? {} : { active }),
      },
      orderBy: orderBy ? { [orderBy.field]: orderBy.dir } : { createdAt: 'desc' },
      skip,
      take,
    });
  }

  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.product.create({ data });
  }

  update(id: string, data: Partial<Omit<Product, 'id' | 'storeId'>>) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.product.delete({ where: { id } });
  }

  addImage(img: Omit<ProductImage, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.productImage.create({ data: img });
  }

  async setPrimaryImage(productId: string, imageId: string) {
    await this.prisma.$transaction([
      this.prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      }),
      this.prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);
  }

  async deleteImage(imageId: string) {
    await this.prisma.productImage.delete({ where: { id: imageId } });
  }

  findOptionsByProductId(productId: string) {
    return this.prisma.productOption.findMany({
      where: { productId },
      include: {
        values: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  findOptionByProductAndId(productId: string, optionId: string) {
    return this.prisma.productOption.findFirst({
      where: { id: optionId, productId },
      include: {
        values: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async deleteOptionById(optionId: string) {
    await this.prisma.productOption.delete({
      where: { id: optionId },
    });
  }

  findByIdWithRelations(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        options: {
          include: { values: { orderBy: { position: 'asc' } } },
          orderBy: { position: 'asc' },
        },
        variants: {
          include: {
            prices: true,
            inventory: true,
          },
        },
        category: { select: { id: true, name: true } },
        profile: { select: { id: true, name: true } },
      },
    });
  }

  findVariantsByProductId(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      include: {
        prices: true,
        inventory: true,
        optionValues: {
          include: {
            optionValue: {
              include: { option: true },
            },
          },
        },
      },
    });
  }

  createVariant(data: any) {
    return this.prisma.productVariant.create({ data });
  }

  updateVariant(variantId: string, data: any) {
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  }

  async deleteVariant(variantId: string) {
    await this.prisma.productVariant.delete({
      where: { id: variantId },
    });
  }

  findVariantById(variantId: string) {
    return this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        prices: true,
        inventory: true,
        optionValues: {
          include: {
            optionValue: {
              include: { option: true },
            },
          },
        },
      },
    });
  }

  createVariantPrice(data: any) {
    return this.prisma.productVariantPrice.create({ data });
  }

  createVariantInventory(data: any) {
    return this.prisma.variantInventory.create({ data });
  }

  async createVariantOptionValues(variantId: string, optionValueIds: string[]) {
    await this.prisma.productVariantOptionValue.createMany({
      data: optionValueIds.map(optionValueId => ({
        variantId,
        optionValueId,
      })),
    });
  }

  async updateVariantOptionValues(variantId: string, optionValueIds: string[]) {
    await this.prisma.$transaction([
      this.prisma.productVariantOptionValue.deleteMany({
        where: { variantId },
      }),
      this.prisma.productVariantOptionValue.createMany({
        data: optionValueIds.map(optionValueId => ({
          variantId,
          optionValueId,
        })),
      }),
    ]);
  }

  findOptionValuesByIds(optionValueIds: string[]) {
    return this.prisma.productOptionValue.findMany({
      where: { id: { in: optionValueIds } },
      include: { option: true },
    });
  }

  findVariantsBySkus(skus: string[]) {
    return this.prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });
  }
}