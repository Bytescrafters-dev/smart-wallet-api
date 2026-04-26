import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import {
  ISupplierRepository,
  SuppliersListParams,
} from './interfaces/suppliers.repository.interface';
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import { SuppliersQueryDto } from './dtos/suppliers-query.dto';

@Injectable()
export class SupplierService {
  constructor(
    @Inject(TOKENS.SupplierRepo)
    private readonly supplierRepo: ISupplierRepository,
    @Inject(TOKENS.StoreRepo)
    private readonly storeRepo: any,
  ) {}

  async getSuppliers(storeId: string, query: SuppliersQueryDto) {
    const params: SuppliersListParams = {
      storeId,
      q: query.q,
      skip: query.skip || 0,
      take: query.take || 20,
    };
    return this.supplierRepo.listAllSupplierByStoreId(params);
  }

  async deleteSupplier(id: string) {
    await this.supplierRepo.deleteSupplier(id);
    return { message: 'Supplier deleted successfully' };
  }

  async createSupplier(dto: CreateSupplierDto) {
    const store = await this.storeRepo.findById(dto.storeId);
    if (!store) throw new Error('Store not found.');

    return this.supplierRepo.create(dto);
  }

  async updateSupplier(id: string, dto: Partial<CreateSupplierDto>) {
    return this.supplierRepo.updateById(id, dto);
  }

  async getSupplier(id: string) {
    return this.supplierRepo.findById(id);
  }
}
