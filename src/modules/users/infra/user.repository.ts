import { Injectable } from '@nestjs/common';
import { AdminRole, User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CreateUserData,
  IUserRepository,
} from '../interfaces/user.repository.interface';

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatar: true,
  role: true,
  status: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateAvatar(id: string, avatar: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { avatar } });
  }

  async updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<Omit<User, 'passwordHash'>> {
    const { passwordHash: _, ...rest } = await this.prisma.user.update({
      where: { id },
      data,
    });
    return rest;
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async createAdminStores(
    userId: string,
    storeIds: string[],
    role: AdminRole,
  ): Promise<void> {
    await this.prisma.adminStore.createMany({
      data: storeIds.map((storeId) => ({ userId, storeId, role })),
      skipDuplicates: true,
    });
  }

  async getAdminStoreIds(userId: string): Promise<string[]> {
    const records = await this.prisma.adminStore.findMany({
      where: { userId },
      select: { storeId: true },
    });
    return records.map((r) => r.storeId);
  }

  findByStore(storeId: string): Promise<any[]> {
    return this.prisma.user.findMany({
      where: { status: 'ACTIVE', adminStores: { some: { storeId } } },
      select: {
        ...USER_PUBLIC_SELECT,
        adminStores: {
          where: { storeId },
          select: { role: true },
        },
      },
    });
  }

  async findByStoreIds(params: {
    storeIds: string[];
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const { storeIds, q, page = 1, limit = 20 } = params;

    const where: any = {
      status: 'ACTIVE',
      adminStores: { some: { storeId: { in: storeIds } } },
    };

    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' as const } },
        { lastName: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
        { phone: { contains: q, mode: 'insensitive' as const } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          ...USER_PUBLIC_SELECT,
          adminStores: {
            where: { storeId: { in: storeIds } },
            select: {
              role: true,
              store: { select: { id: true, name: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  findUserWithStores(id: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_PUBLIC_SELECT,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        adminStores: {
          select: {
            role: true,
            store: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async updateUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: AdminRole;
    },
  ): Promise<any> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_PUBLIC_SELECT,
    });
  }

  async deactivateUser(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { status: 'INACTIVE' },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
    ]);
  }

  async removeStoreAccess(userId: string, storeId: string): Promise<void> {
    await this.prisma.adminStore.delete({
      where: { userId_storeId: { userId, storeId } },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { passwordHash, mustChangePassword: false },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
    ]);
  }
}
