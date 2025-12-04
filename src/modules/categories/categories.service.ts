import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { ICategoryRepository, CategoryListParams } from './interfaces/category.repository.interface';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CategoryQueryDto } from './dtos/category-query.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(TOKENS.CategoryRepo)
    private readonly categoryRepo: ICategoryRepository,
    private readonly prisma: PrismaService,
  ) {}

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/['\"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }

  private async ensureUniqueSlug(storeId: string, baseSlug: string): Promise<string> {
    let candidate = baseSlug;
    let suffix = 2;

    const exists = await this.prisma.category.findFirst({
      where: { storeId, slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;

    while (true) {
      candidate = `${baseSlug}-${suffix++}`;
      const clash = await this.prisma.category.findFirst({
        where: { storeId, slug: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
  }

  async createCategory(dto: CreateCategoryDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    if (dto.parentId) {
      const parent = await this.categoryRepo.findById(dto.parentId);
      if (!parent) throw new NotFoundException('Parent category not found.');
      if (parent.storeId !== dto.storeId) {
        throw new BadRequestException('Parent category must belong to the same store.');
      }
    }

    const baseSlug = this.slugify(dto.slug ?? dto.name);
    const uniqueSlug = await this.ensureUniqueSlug(dto.storeId, baseSlug);

    return this.categoryRepo.create({
      storeId: dto.storeId,
      name: dto.name,
      slug: uniqueSlug,
      parentId: dto.parentId ?? null,
    });
  }

  async getCategories(storeId: string, query: CategoryQueryDto) {
    const params: CategoryListParams = {
      storeId,
      q: query.q,
      parentId: query.parentId,
      skip: query.skip || 0,
      take: query.take || 20,
    };
    return this.categoryRepo.list(params);
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    if (dto.parentId) {
      const parent = await this.categoryRepo.findById(dto.parentId);
      if (!parent) throw new NotFoundException('Parent category not found.');
      if (parent.storeId !== category.storeId) {
        throw new BadRequestException('Parent category must belong to the same store.');
      }
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.parentId !== undefined) updateData.parentId = dto.parentId;
    if (dto.slug) {
      const uniqueSlug = await this.ensureUniqueSlug(category.storeId, dto.slug);
      updateData.slug = uniqueSlug;
    }

    return this.categoryRepo.update(id, updateData);
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    await this.categoryRepo.remove(id);
  }
}