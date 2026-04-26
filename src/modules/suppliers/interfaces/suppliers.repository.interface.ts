import { Supplier } from '@prisma/client';

export type SuppliersListParams = {
  storeId: string;
  q?: string;
  skip?: number;
  take?: number;
};

export type SuppliersListResponse = {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
};

export interface ISupplierRepository {
  findById(id: string): Promise<Supplier | null>;
  create(data: {
    storeId: string;
    name: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address1?: string;
    city?: string;
    country?: string;
    notes?: string;
  }): Promise<Supplier>;
  updateById(id, data: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;
  listAllSupplierByStoreId(
    query: SuppliersListParams,
  ): Promise<SuppliersListResponse>;
}
