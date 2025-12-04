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
}