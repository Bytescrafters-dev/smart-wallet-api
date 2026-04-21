import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IStoreUserRepository } from './interfaces/store-user.repository.interface';
import { Address, StoreUser } from '@prisma/client';
import { CreateAddressDto } from './dtos/create-address.dto';
import { IAddressRepository } from './interfaces/address.repository.interface';

@Injectable()
export class StoreUsersService {
  constructor(
    @Inject(TOKENS.StoreUserRepo)
    private readonly storeUsersRepo: IStoreUserRepository,
    @Inject(TOKENS.AddressRepo)
    private readonly addressRepo: IAddressRepository,
  ) {}

  async getStoreUserById(
    userId: string,
  ): Promise<Omit<StoreUser, 'passwordHash'> | null> {
    const user = await this.storeUsersRepo.findById(userId);
    if (!user) return null;
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async updateStoreUserProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<Omit<StoreUser, 'passwordHash'>> {
    return this.storeUsersRepo.updateStoreUserProfile(userId, data);
  }

  async addAddress(storeUserId, dto: CreateAddressDto): Promise<Address> {
    return this.addressRepo.create({ ...dto, storeUserId });
  }

  async listAddresses(storeUserId: string): Promise<Address[]> {
    return this.addressRepo.listByStoreUserId(storeUserId);
  }

  async getAddressById(id: string): Promise<Address | null> {
    return this.addressRepo.findById(id);
  }

  async updateAddress(
    id: string,
    dto: Partial<CreateAddressDto>,
  ): Promise<Address> {
    return this.addressRepo.update(id, dto);
  }

  async deleteAddress(id: string): Promise<void> {
    await this.addressRepo.delete(id);
  }
}
