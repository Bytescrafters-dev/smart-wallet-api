import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStoreDto } from './dtos/store.dto';
import { Prisma } from '@prisma/client';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dtos/category.dto';
import { CreateProductDto } from './dtos/product.dto';
import { ICategoryRepo, CategoryListParams } from './interfaces/category.repo';
import { TOKENS } from '../../common/constants/tokens';

@Injectable()
export class CatalogService {
  constructor(
    @Inject()
    private prisma: PrismaService,
    @Inject(TOKENS.CategoryRepo)
    private categoryRepo: ICategoryRepo,
  ) {}

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '') // remove quotes
      .replace(/[^a-z0-9]+/g, '-') // non-alnum -> dash
      .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
      .replace(/-+/g, '-'); // collapse multiple dashes
  }

  private async ensureUniqueSlug(
    storeId: string,
    baseSlug: string,
  ): Promise<string> {
    let candidate = baseSlug;
    let suffix = 2;

    // Quick happy-path: if none exists, use it
    const exists = await this.prisma.category.findFirst({
      where: { storeId, slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;

    // Otherwise iterate
    // Example: mens-shirts -> mens-shirts-2, mens-shirts-3, ...
    while (true) {
      candidate = `${baseSlug}-${suffix++}`;
      const clash = await this.prisma.category.findFirst({
        where: { storeId, slug: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
  }

  private async ensureUniqueSlugProduct(
    storeId: string,
    baseSlug: string,
  ): Promise<string> {
    let candidate = baseSlug;
    let suffix = 2;

    const exists = await this.prisma.product.findFirst({
      where: { storeId, slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;

    while (true) {
      candidate = `${baseSlug}-${suffix++}`;
      const clash = await this.prisma.product.findFirst({
        where: { storeId, slug: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
  }

  async createStore(createStore: CreateStoreDto) {
    const normalizedSlug = createStore.slug.trim().toLowerCase();
    const data: Prisma.StoreCreateInput = {
      name: createStore.name,
      slug: normalizedSlug,
      defaultCurrency: createStore.defaultCurrency,
      domain: createStore.domain,
      timezone: createStore.timezone,
      supportEmail: createStore.supportEmail,
      logoUrl: createStore.logoUrl,
    };

    return this.prisma.store.create({
      data,
    });
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
        throw new BadRequestException(
          'Parent category must belong to the same store.',
        );
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
        throw new BadRequestException(
          'Parent category must belong to the same store.',
        );
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

  async createProduct(dto: CreateProductDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Store not found.');

    let categoryConnect: Prisma.CategoryWhereUniqueInput | undefined;
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true, storeId: true },
      });
      if (!category) throw new NotFoundException('Category not found.');
      if (category.storeId !== dto.storeId) {
        throw new BadRequestException(
          'Category must belong to the same store.',
        );
      }
      categoryConnect = { id: category.id };
    }

    let profileConnect: Prisma.ShippingProfileWhereUniqueInput | undefined;
    if (dto.profileId) {
      const profile = await this.prisma.shippingProfile.findUnique({
        where: { id: dto.profileId },
        select: { id: true, storeId: true },
      });
      if (!profile) throw new NotFoundException('Shipping profile not found.');
      if (profile.storeId !== dto.storeId) {
        throw new BadRequestException(
          'Shipping profile must belong to the same store.',
        );
      }
      profileConnect = { id: profile.id };
    }

    const baseSlug = this.slugify(dto.slug ?? dto.title);
    const uniqueSlug = await this.ensureUniqueSlugProduct(
      dto.storeId,
      baseSlug,
    );

    return this.prisma.product.create({
      data: {
        title: dto.title,
        slug: uniqueSlug,
        description: dto.description,
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        store: { connect: { id: dto.storeId } },
        ...(categoryConnect ? { category: { connect: categoryConnect } } : {}),
        ...(profileConnect ? { profile: { connect: profileConnect } } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        active: true,
        storeId: true,
        categoryId: true,
        profileId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async addOption(productId: string, b: any) {
    return this.prisma.$transaction(async (tx) => {
      const opt = await tx.productOption.create({
        data: { productId, name: b.name, position: b.position ?? 0 },
      });
      for (const [i, val] of (b.values ?? []).entries()) {
        await tx.productOptionValue.create({
          data: { optionId: opt.id, value: val, position: i },
        });
      }
      return opt;
    });
  }

  async addVariant(productId: string, b: any) {
    return this.prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.create({
        data: { productId, sku: b.sku, title: b.title ?? null },
      });
      for (const ovId of b.optionValueIds as string[]) {
        await tx.productVariantOptionValue.create({
          data: { variantId: v.id, optionValueId: ovId },
        });
      }
      await tx.productVariantPrice.create({
        data: {
          variantId: v.id,
          currency: b.currency ?? 'AUD',
          amount: b.priceCents,
        },
      });
      await tx.variantInventory.create({
        data: { variantId: v.id, quantity: b.initialQty ?? 0 },
      });
      return v;
    });
  }

  // Public product detail in a client-friendly shape
  async getBySlug(storeSlug: string, productSlug: string, currency?: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
    });
    if (!store) throw new NotFoundException('Store not found');

    const p = await this.prisma.product.findUnique({
      where: { storeId_slug: { storeId: store.id, slug: productSlug } },
      include: {
        images: true,
        options: { include: { values: true }, orderBy: { position: 'asc' } },
        variants: {
          include: {
            optionValues: {
              include: { optionValue: { include: { option: true } } },
            },
            prices: true,
            inventory: true,
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Product not found');

    const options = p.options.map((o) => ({
      id: o.id,
      name: o.name,
      values: o.values
        .sort((a, b) => a.position - b.position)
        .map((v) => ({ id: v.id, value: v.value })),
    }));

    const resolvePrice = (prices: any[]) => {
      const cur = currency ?? store.defaultCurrency;
      const now = new Date();
      const rows = prices.filter(
        (x) => x.currency === cur && (!x.validTo || x.validTo > now),
      );
      if (!rows.length) return null;
      rows.sort((a, b) => a.validFrom.getTime() - b.validFrom.getTime());
      return rows.at(-1)?.amount ?? null;
    };

    const variants = p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: resolvePrice(v.prices),
      inStock: (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) > 0,
      optionValueMap: Object.fromEntries(
        v.optionValues.map((ov) => [
          ov.optionValue.option.name,
          ov.optionValue.value,
        ]),
      ),
    }));

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      images: p.images,
      options,
      variants,
    };
  }
}
