import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IProductRepository } from './interfaces/product.repository.interface';
import { IStoreRepository } from '../stores/interfaces/store.repository.interface';
import { ICategoryRepository } from '../categories/interfaces/category.repository.interface';
import { CreateProductDto } from './dtos/create-product.dto';
import { AddOptionDto } from './dtos/add-option.dto';
import { AddVariantDto } from './dtos/add-variant.dto';
import { CreateVariantsDto } from './dtos/create-variants.dto';
import { UpdateVariantDto } from './dtos/update-variant.dto';
import { UpdateProductVariantDto } from './dtos/update-product-variant.dto';
import { ProductVariantDto } from './dtos/product-variant.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateProductImageDto } from './dtos/update-product-image.dto';

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
    private readonly uploadsService: UploadsService,
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

  private async ensureUniqueSlug(
    storeId: string,
    baseSlug: string,
  ): Promise<string> {
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
        throw new BadRequestException(
          'Category must belong to the same store.',
        );
      }
    }

    if (dto.profileId) {
      const profile = await this.storeRepo.findShippingProfileById(
        dto.profileId,
      );
      if (!profile) throw new NotFoundException('Shipping profile not found.');
      if (profile.storeId !== dto.storeId) {
        throw new BadRequestException(
          'Shipping profile must belong to the same store.',
        );
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
          ...(filters.title || filters.slug
            ? {
                title: {
                  contains: filters.title || filters.slug,
                  mode: 'insensitive',
                },
              }
            : {}),
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

  async getAllProductOptionsByProductId(productId: string) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const options = await this.productRepo.findOptionsByProductId(productId);

    return options.map((option) => ({
      id: option.id,
      name: option.name,
      position: option.position,
      values: option.values.map((value) => ({
        id: value.id,
        value: value.value,
        position: value.position,
      })),
    }));
  }

  async getProductOptionById(productId: string, optionId: string) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const option = await this.productRepo.findOptionByProductAndId(
      productId,
      optionId,
    );
    if (!option) throw new NotFoundException('Option not found');

    return {
      id: option.id,
      name: option.name,
      position: option.position,
      values: option.values.map((value) => ({
        id: value.id,
        value: value.value,
        position: value.position,
      })),
    };
  }

  async deleteProductOptionById(productId: string, optionId: string) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const option = await this.productRepo.findOptionByProductAndId(
      productId,
      optionId,
    );
    if (!option) throw new NotFoundException('Option not found');

    // Check if option is used by existing variants
    const variantCount = await this.prisma.productVariantOptionValue.count({
      where: {
        optionValue: {
          optionId: optionId,
        },
      },
    });

    if (variantCount > 0) {
      throw new BadRequestException(
        'Cannot delete option that is used by existing variants',
      );
    }

    await this.productRepo.deleteOptionById(optionId);
  }

  async getProductById(id: string) {
    const product = await this.productRepo.findByIdWithRelations(id);
    if (!product) throw new NotFoundException('Product not found');

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      active: product.active,
      storeId: product.storeId,
      categoryId: product.categoryId,
      profileId: product.profileId,
      category: product.category,
      profile: product.profile,
      images: product.images,
      options: product.options.map((option) => ({
        id: option.id,
        name: option.name,
        position: option.position,
        values: option.values.map((value) => ({
          id: value.id,
          value: value.value,
          position: value.position,
        })),
      })),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        title: variant.title,
        active: variant.active,
        weightGrams: variant.weightGrams,
        lengthCm: variant.lengthCm,
        widthCm: variant.widthCm,
        heightCm: variant.heightCm,
        prices: variant.prices,
        inventory: variant.inventory,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async getBySlug(storeSlug: string, productSlug: string, currency?: string) {
    const store = await this.storeRepo.findBySlug(storeSlug);
    if (!store) throw new NotFoundException('Store not found slug');

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

  async getProductVariants(productId: string) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const variants = await this.productRepo.findVariantsByProductId(productId);

    return variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      barcode: variant.barcode,
      title: variant.title,
      weightGrams: variant.weightGrams,
      lengthCm: variant.lengthCm,
      widthCm: variant.widthCm,
      heightCm: variant.heightCm,
      active: variant.active,
      optionValueIds: variant.optionValues.map((ov) => ov.optionValueId),
      prices: variant.prices,
      inventory: variant.inventory,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    }));
  }

  async createVariantsBulk(productId: string, dto: CreateVariantsDto) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    // Check for duplicate SKUs within the batch
    const skus = dto.variants.map((v) => v.sku);
    const duplicateSkus = skus.filter(
      (sku, index) => skus.indexOf(sku) !== index,
    );
    if (duplicateSkus.length > 0) {
      throw new BadRequestException(
        `Duplicate SKUs in batch: ${duplicateSkus.join(', ')}`,
      );
    }

    // Check if SKUs already exist in database
    const existingVariants = await this.productRepo.findVariantsBySkus(skus);
    if (existingVariants.length > 0) {
      const existingSkus = existingVariants.map((v) => v.sku);
      throw new BadRequestException(
        `SKUs already exist: ${existingSkus.join(', ')}`,
      );
    }

    // Validate all option value IDs exist and belong to the product
    const allOptionValueIds = [
      ...new Set(dto.variants.flatMap((v) => v.optionValueIds)),
    ];
    const optionValues =
      await this.productRepo.findOptionValuesByIds(allOptionValueIds);

    const validOptionValueIds = optionValues
      .filter((ov) => ov.option.productId === productId)
      .map((ov) => ov.id);

    const invalidIds = allOptionValueIds.filter(
      (id) => !validOptionValueIds.includes(id),
    );
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid option value IDs: ${invalidIds.join(', ')}`,
      );
    }

    // Create variants in transaction
    return this.prisma.$transaction(async (tx) => {
      const createdVariants: any[] = [];

      for (const variantData of dto.variants) {
        // Create variant
        const variant = await tx.productVariant.create({
          data: {
            productId,
            sku: variantData.sku,
            barcode: variantData.barcode,
            title: variantData.title,
            weightGrams: variantData.weightGrams,
            lengthCm: variantData.lengthCm,
            widthCm: variantData.widthCm,
            heightCm: variantData.heightCm,
            active: variantData.active,
          },
        });

        // Create prices
        for (const price of variantData.prices) {
          await tx.productVariantPrice.create({
            data: {
              variantId: variant.id,
              currency: price.currency,
              amount: price.amount,
              validFrom: price.validFrom || new Date(),
              validTo: price.validTo,
            },
          });
        }

        // Create inventory
        await tx.variantInventory.create({
          data: {
            variantId: variant.id,
            quantity: variantData.inventory.quantity,
            reserved: variantData.inventory.reserved,
            lowStockThreshold: variantData.inventory.lowStockThreshold,
          },
        });

        // Create option value mappings
        for (const optionValueId of variantData.optionValueIds) {
          await tx.productVariantOptionValue.create({
            data: {
              variantId: variant.id,
              optionValueId,
            },
          });
        }

        createdVariants.push(variant);
      }

      return createdVariants;
    });
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const variant = await this.productRepo.findVariantById(variantId);
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Variant not found');
    }

    const updateData: any = {};
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.barcode !== undefined) updateData.barcode = dto.barcode;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.weightGrams !== undefined) updateData.weightGrams = dto.weightGrams;
    if (dto.lengthCm !== undefined) updateData.lengthCm = dto.lengthCm;
    if (dto.widthCm !== undefined) updateData.widthCm = dto.widthCm;
    if (dto.heightCm !== undefined) updateData.heightCm = dto.heightCm;
    if (dto.active !== undefined) updateData.active = dto.active;

    return this.prisma.$transaction(async (tx) => {
      // Update variant basic data
      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: updateData,
      });

      // Update option values if provided
      if (dto.optionValueIds) {
        await tx.productVariantOptionValue.deleteMany({
          where: { variantId },
        });

        for (const optionValueId of dto.optionValueIds) {
          await tx.productVariantOptionValue.create({
            data: { variantId, optionValueId },
          });
        }
      }

      // Update inventory if provided
      if (dto.inventory) {
        await tx.variantInventory.upsert({
          where: { variantId },
          update: dto.inventory,
          create: {
            variantId,
            ...dto.inventory,
          },
        });
      }

      // Update prices if provided
      if (dto.prices) {
        await tx.productVariantPrice.deleteMany({
          where: { variantId },
        });

        for (const price of dto.prices) {
          await tx.productVariantPrice.create({
            data: {
              variantId,
              currency: price.currency!,
              amount: price.amount!,
              validFrom: price.validFrom || new Date(),
              validTo: price.validTo,
            },
          });
        }
      }

      return updatedVariant;
    });
  }

  async deleteVariant(productId: string, variantId: string) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const variant = await this.productRepo.findVariantById(variantId);
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Variant not found');
    }

    await this.productRepo.deleteVariant(variantId);
  }

  async bulkUpdateVariants(productId: string, variants: ProductVariantDto[]) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.$transaction(async (tx) => {
      const updatedVariants: any[] = [];

      for (const variantData of variants) {
        if (!variantData.sku) continue;

        const existingVariant = await tx.productVariant.findFirst({
          where: { sku: variantData.sku, productId },
        });

        if (!existingVariant) continue;

        const updatedVariant = await tx.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            barcode: variantData.barcode,
            title: variantData.title,
            weightGrams: variantData.weightGrams,
            lengthCm: variantData.lengthCm,
            widthCm: variantData.widthCm,
            heightCm: variantData.heightCm,
            active: variantData.active,
          },
        });

        updatedVariants.push(updatedVariant);
      }

      return updatedVariants;
    });
  }

  async addProductImage(
    productId: string,
    imageData: {
      storageKey: string;
      url: string;
      alt?: string;
      isPrimary?: boolean;
      sortOrder?: number;
      width?: number;
      height?: number;
      mimeType?: string;
      bytes?: number;
      checksum?: string;
    },
  ) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    if (imageData.isPrimary) {
      await this.productRepo.setPrimaryImage(productId, '');
    }

    return this.productRepo.addImage({
      productId,
      storageKey: imageData.storageKey,
      url: imageData.url,
      alt: imageData.alt ?? null,
      isPrimary: imageData.isPrimary ?? false,
      sortOrder: imageData.sortOrder ?? 0,
      width: imageData.width ?? null,
      height: imageData.height ?? null,
      mimeType: imageData.mimeType ?? null,
      bytes: imageData.bytes ?? null,
      checksum: imageData.checksum ?? null,
    });
  }

  async deleteProductImage(productId: string, imageId: string) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const image = await this.productRepo.findImageById(imageId);

    if (!image || image.productId !== productId) {
      throw new NotFoundException('Image not found');
    }

    // Delete from S3 first
    try {
      await this.uploadsService.deleteFile(image.storageKey);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
    }

    // Delete from database
    await this.productRepo.deleteImage(imageId);

    // If deleted image was primary, set another image as primary
    if (image.isPrimary) {
      const nextImage = await this.productRepo.findNextPrimaryImage(productId);
      if (nextImage) {
        await this.productRepo.setPrimaryImage(productId, nextImage.id);
      }
    }

    return { success: true, message: 'Image deleted successfully' };
  }

  async updateProductImage(
    productId: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const image = await this.productRepo.findImageById(imageId);

    if (!image || image.productId !== productId) {
      throw new NotFoundException('Image not found');
    }

    if (dto.isPrimary) {
      await this.productRepo.setPrimaryImage(productId, imageId);
    }

    const updateData: any = {};
    if (dto.alt !== undefined) updateData.alt = dto.alt;
    if (dto.isPrimary !== undefined) updateData.isPrimary = dto.isPrimary;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    return this.productRepo.updateImage(imageId, updateData);
  }

  async reorderProductImages(
    productId: string,
    imageOrders: { id: string; sortOrder: number }[],
  ) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    // Validate all images belong to the product
    for (const { id } of imageOrders) {
      const image = await this.productRepo.findImageById(id);
      if (!image || image.productId !== productId) {
        throw new NotFoundException(`Image ${id} not found`);
      }
    }

    await this.productRepo.updateImageSortOrders(imageOrders);

    return { success: true, message: 'Images reordered successfully' };
  }

  async getProductImages(productId: string) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    return this.productRepo.findImagesByProductId(productId);
  }
}
