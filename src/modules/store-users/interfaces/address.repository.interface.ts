import { Address } from '@prisma/client';

export interface IAddressRepository {
  listByStoreUserId(storeId: string): Promise<Address[]>;
  findById(id: string): Promise<Address | null>;
  create(data: {
    storeUserId: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    label?: string;
    isDefault: boolean;
  }): Promise<Address>;
  update(id: string, data: Partial<Address>): Promise<Address>;
  delete(id: string): Promise<void>;
}
