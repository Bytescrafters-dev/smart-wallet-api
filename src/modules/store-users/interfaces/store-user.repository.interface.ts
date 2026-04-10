import { StoreUser } from '@prisma/client';

export interface IStoreUserRepository {
  findByStoreAndEmail(storeId: string, email: string): Promise<StoreUser | null>;
  findById(id: string): Promise<StoreUser | null>;
  create(data: {
    storeId: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }): Promise<StoreUser>;
  updateAvatar(id: string, avatar: string): Promise<void>;
}
