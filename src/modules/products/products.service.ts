import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IProductRepository } from './interfaces/product.repository.interface';
import { IStoreRepository } from '../stores/interfaces/store.repository.interface';
import { ICategoryRepository } from '../categories/interfaces/category.repository.interface';
import { CreateProductDto } from './dtos/create-product.dto';
import { AddOptionDto } from './dtos/add-option.dto';
import { AddVariantDto } from './dtos/add-variant.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(TOKENS.ProductRepo)
    private readonly productRepo: IProductRepository,
    @Inject(TOKENS.StoreRepo)
    private readonly storeRepo: IStoreRepository,
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

    const exists = await this.productRepo.findBySlug(storeId, candidate);
    if (!exists) return candidate;

    while (true) {
      candidate = `${baseSlug}-${suffix++}`;
      const clash = await this.productRepo.findBySlug(storeId, candidate);
      if (!clash) return candidate;
    }
  }

  async createProduct(dto: CreateProductDto) {
    const store = await this.storeRepo.findById(dto.storeId);
    if (!store) throw new NotFoundException('Store not found.');

    if (dto.categoryId) {
      const category = await this.categoryRepo.findById(dto.categoryId);
      if (!category) throw new NotFoundException('Category not found.');
      if (category.storeId !== dto.storeId) {
        throw new BadRequestException('Category must belong to the same store.');
      }
    }

    if (dto.profileId) {
      const profile = await this.storeRepo.findShippingProfileById(dto.profileId);
      if (!profile) throw new NotFoundException('Shipping profile not found.');
      if (profile.storeId !== dto.storeId) {
        throw new BadRequestException('Shipping profile must belong to the same store.');
      }
    }

    const baseSlug = this.slugify(dto.slug ?? dto.title);
    const uniqueSlug = await this.ensureUniqueSlug(dto.storeId, baseSlug);

    return this.productRepo.create({
      storeId: dto.storeId,
      title: dto.title,
      slug: uniqueSlug,
      description: dto.description ?? null,
      active: dto.active ?? true,
      categoryId: dto.categoryId ?? null,
      profileId: dto.profileId ?? null,
    });
  }

  async addOption(productId: string, dto: AddOptionDto) {
    return this.prisma.$transaction(async (tx) => {
      const opt = await tx.productOption.create({
        data: { productId, name: dto.name, position: dto.position ?? 0 },
      });
      for (const [i, val] of (dto.values ?? []).entries()) {
        await tx.productOptionValue.create({
          data: { optionId: opt.id, value: val, position: i },
        });
      }
      return opt;
    });
  }

  async addVariant(productId: string, dto: AddVariantDto) {
    return this.prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.create({
        data: { productId, sku: dto.sku, title: dto.title ?? null },
      });
      for (const ovId of dto.optionValueIds) {
        await tx.productVariantOptionValue.create({
          data: { variantId: v.id, optionValueId: ovId },
        });
      }
      await tx.productVariantPrice.create({
        data: {
          variantId: v.id,
          currency: dto.currency ?? 'AUD',
          amount: dto.priceCents,
        },
      });
      await tx.variantInventory.create({
        data: { variantId: v.id, quantity: dto.initialQty ?? 0 },
      });
      return v;
    });
  }

  async getAllProducts(
    storeId: string,
    filters: {
      title?: string;
      slug?: string;
      categoryId?: string;
      profileId?: string;
      active?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productRepo.list({
        storeId,
        q: filters.title || filters.slug,
        categoryId: filters.categoryId,
        active: filters.active,
        skip,
        take: limit,
        orderBy: { field: 'createdAt', dir: 'desc' },
      }),
      this.prisma.product.count({
        where: {
          storeId,
          ...(filters.title || filters.slug ? { title: { contains: filters.title || filters.slug, mode: 'insensitive' } } : {}),
          ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
          ...(filters.active !== undefined ? { active: filters.active } : {}),
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getBySlug(storeSlug: string, productSlug: string, currency?: string) {
    const store = await this.storeRepo.findBySlug(storeSlug);
    if (!store) throw new NotFoundException('Store not found');

    const p = await this.productRepo.findBySlug(store.id, productSlug);
    if (!p) throw new NotFoundException('Product not found');

    const [images, options, variants] = await Promise.all([
      this.prisma.productImage.findMany({ where: { productId: p.id } }),
      this.prisma.productOption.findMany({
        where: { productId: p.id },
        include: { values: true },
        orderBy: { position: 'asc' },
      }),
      this.prisma.productVariant.findMany({
        where: { productId: p.id },
        include: {
          optionValues: {
            include: { optionValue: { include: { option: true } } },
          },
          prices: true,
          inventory: true,
        },
      }),
    ]);

    const mappedOptions = options.map((o) => ({
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

    const mappedVariants = variants.map((v) => ({
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
      images,
      options: mappedOptions,
      variants: mappedVariants,
    };
  }
}