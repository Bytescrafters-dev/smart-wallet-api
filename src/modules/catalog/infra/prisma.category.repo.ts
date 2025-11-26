import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ICategoryRepo, CategoryListParams } from '../interfaces/category.repo';
import { Category } from '@prisma/client';

@Injectable()
export class PrismaCategoryRepo implements ICategoryRepo {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findBySlug(storeId: string, slug: string) {
    return this.prisma.category.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
  }

  list(params: CategoryListParams) {
    const { storeId, q, parentId, skip = 0, take = 20 } = params;
    return this.prisma.category.findMany({
      where: {
        storeId,
        parentId: parentId === undefined ? undefined : parentId,
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Partial<Omit<Category, 'id' | 'storeId'>>) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }
}
