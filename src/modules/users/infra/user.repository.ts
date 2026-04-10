import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateAvatar(id: string, avatar: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { avatar } });
  }

  async updateProfile(id: string, data: { firstName?: string; lastName?: string; phone?: string }): Promise<Omit<User, 'passwordHash'>> {
    const { passwordHash: _, ...rest } = await this.prisma.user.update({ where: { id }, data });
    return rest;
  }
}
