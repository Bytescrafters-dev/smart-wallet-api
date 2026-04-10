import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IStoreUserRepository } from './interfaces/store-user.repository.interface';
import { StoreUser } from '@prisma/client';

@Injectable()
export class StoreUsersService {
  constructor(
    @Inject(TOKENS.StoreUserRepo)
    private readonly storeUsersRepo: IStoreUserRepository,
  ) {}

  async getStoreUserById(
    userId: string,
  ): Promise<Omit<StoreUser, 'passwordHash'> | null> {
    const user = await this.storeUsersRepo.findById(userId);
    if (!user) return null;
    const { passwordHash: _, ...rest } = user;
    return rest;
  }
}
