import { Category } from '@prisma/client';

export type CategoryListParams = {
  storeId: string;
  q?: string;
  parentId?: string | null;
  skip?: number;
  take?: number;
};

export interface ICategoryRepo {
  findById(id: string): Promise<Category | null>;
  findBySlug(storeId: string, slug: string): Promise<Category | null>;
  list(params: CategoryListParams): Promise<Category[]>;
  create(
    data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Category>;
  update(
    id: string,
    data: Partial<Omit<Category, 'id' | 'storeId'>>,
  ): Promise<Category>;
  remove(id: string): Promise<void>;
}
