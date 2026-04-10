import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserRepository } from './interfaces/user.repository.interface';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    @Inject(TOKENS.UserRepo)
    private readonly userRepo: IUserRepository,
  ) {}

  async getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.userRepo.findById(userId);
    if (!user) return null;
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async updateAvatar(userId: string, avatar: string): Promise<void> {
    await this.userRepo.updateAvatar(userId, avatar);
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }): Promise<Omit<User, 'passwordHash'>> {
    return this.userRepo.updateProfile(userId, data);
  }
}
