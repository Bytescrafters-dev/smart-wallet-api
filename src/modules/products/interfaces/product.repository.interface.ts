import { Product, ProductImage } from '@prisma/client';

export type ProductListParams = {
  storeId: string;
  q?: string;
  categoryId?: string;
  active?: boolean;
  skip?: number;
  take?: number;
  orderBy?: { field: 'createdAt' | 'title'; dir: 'asc' | 'desc' };
};

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(storeId: string, slug: string): Promise<Product | null>;
  list(params: ProductListParams): Promise<Product[]>;
  count(params: Omit<ProductListParams, 'skip' | 'take' | 'orderBy'>): Promise<number>;
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, data: Partial<Omit<Product, 'id' | 'storeId'>>): Promise<Product>;
  remove(id: string): Promise<void>;
  addImage(img: Omit<ProductImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductImage>;
  setPrimaryImage(productId: string, imageId: string): Promise<void>;
  deleteImage(imageId: string): Promise<void>;
  findImageById(imageId: string): Promise<ProductImage | null>;
  findImagesByProductId(productId: string): Promise<ProductImage[]>;
  updateImage(imageId: string, data: Partial<Omit<ProductImage, 'id' | 'productId' | 'storageKey' | 'url' | 'createdAt' | 'updatedAt'>>): Promise<ProductImage>;
  updateImageSortOrders(imageOrders: { id: string; sortOrder: number }[]): Promise<void>;
  findNextPrimaryImage(productId: string): Promise<ProductImage | null>;
  findOptionsByProductId(productId: string): Promise<any[]>;
  findOptionByProductAndId(productId: string, optionId: string): Promise<any | null>;
  deleteOptionById(optionId: string): Promise<void>;
  findByIdWithRelations(id: string): Promise<any | null>;
  findVariantsByProductId(productId: string): Promise<any[]>;
  createVariant(data: any): Promise<any>;
  updateVariant(variantId: string, data: any): Promise<any>;
  deleteVariant(variantId: string): Promise<void>;
  findVariantById(variantId: string): Promise<any | null>;
  createVariantPrice(data: any): Promise<any>;
  createVariantInventory(data: any): Promise<any>;
  createVariantOptionValues(variantId: string, optionValueIds: string[]): Promise<void>;
  updateVariantOptionValues(variantId: string, optionValueIds: string[]): Promise<void>;
  findOptionValuesByIds(optionValueIds: string[]): Promise<any[]>;
  findVariantsBySkus(skus: string[]): Promise<any[]>;
}