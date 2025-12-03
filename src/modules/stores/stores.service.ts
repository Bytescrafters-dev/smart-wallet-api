import { Inject, Injectable } from '@nestjs/common';
import { Store } from '@prisma/client';
import { TOKENS } from 'src/common/constants/tokens';
import { IStoreRepository } from './interfaces/store.repository.interface';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @Inject(TOKENS.StoreRepo)
    private readonly storeRepo: IStoreRepository,
  ) {}

  async createStore(data: CreateStoreDto): Promise<Store> {
    const storeData = {
      ...data,
      domain: data.domain ?? null,
      timezone: data.timezone ?? null,
      supportEmail: data.supportEmail ?? null,
      logoUrl: data.logoUrl ?? null,
    };
    return this.storeRepo.create(storeData);
  }

  async getStoreById(id: string): Promise<Store | null> {
    return this.storeRepo.findById(id);
  }

  async getStoreBySlug(slug: string): Promise<Store | null> {
    return this.storeRepo.findBySlug(slug);
  }

  async getAllStores(): Promise<Store[]> {
    return this.storeRepo.findAll();
  }

  async updateStore(id: string, data: UpdateStoreDto): Promise<Store> {
    const updateData = {
      ...data,
      ...(data.domain !== undefined && { domain: data.domain ?? null }),
      ...(data.timezone !== undefined && { timezone: data.timezone ?? null }),
      ...(data.supportEmail !== undefined && { supportEmail: data.supportEmail ?? null }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl ?? null }),
    };
    return this.storeRepo.updateById(id, updateData);
  }

  async deleteStore(id: string): Promise<void> {
    return this.storeRepo.deleteById(id);
  }
}