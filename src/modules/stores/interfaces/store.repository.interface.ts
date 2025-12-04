import { Store, ShippingProfile } from '@prisma/client';

export interface IStoreRepository {
  create(data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store>;
  findById(id: string): Promise<Store | null>;
  findBySlug(slug: string): Promise<Store | null>;
  findAll(): Promise<Store[]>;
  updateById(id: string, data: Partial<Omit<Store, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Store>;
  deleteById(id: string): Promise<void>;
  findShippingProfileById(profileId: string): Promise<Pick<ShippingProfile, 'id' | 'storeId'> | null>;
}