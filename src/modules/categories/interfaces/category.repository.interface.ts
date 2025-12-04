import { Category } from '@prisma/client';

export type CategoryListParams = {
  storeId: string;
  q?: string;
  parentId?: string | null;
  skip?: number;
  take?: number;
};

export type CategoryListResponse = {
  data: Category[];
  total: number;
  page: number;
  limit: number;
};

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(storeId: string, slug: string): Promise<Category | null>;
  list(params: CategoryListParams): Promise<CategoryListResponse>;
  create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
  update(id: string, data: Partial<Omit<Category, 'id' | 'storeId'>>): Promise<Category>;
  remove(id: string): Promise<void>;
}