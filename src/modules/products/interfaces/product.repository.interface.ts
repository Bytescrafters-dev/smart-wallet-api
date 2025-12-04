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
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, data: Partial<Omit<Product, 'id' | 'storeId'>>): Promise<Product>;
  remove(id: string): Promise<void>;
  addImage(img: Omit<ProductImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductImage>;
  setPrimaryImage(productId: string, imageId: string): Promise<void>;
  deleteImage(imageId: string): Promise<void>;
}