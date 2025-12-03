import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ICategoryRepo, CategoryListParams } from '../interfaces/category.repo';
import { Category, Prisma } from '@prisma/client';

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

  async list(params: CategoryListParams) {
    const { storeId, q, parentId, skip = 0, take = 20 } = params;
    const where: Prisma.CategoryWhereInput = {
      storeId,
      parentId: parentId === undefined ? undefined : parentId,
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
    };
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
