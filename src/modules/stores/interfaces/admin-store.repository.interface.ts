import { Store } from '@prisma/client';

export interface IAdminStoreRepository {
  findStoresByUserId(userId: string): Promise<Store[]>;
}
