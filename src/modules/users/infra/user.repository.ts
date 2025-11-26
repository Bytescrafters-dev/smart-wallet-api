import { Injectable } from '@nestjs/common';

import { IUserRepository } from '../interfaces/user.repository.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { User } from '@prisma/client';
import { ListUsersOffsetParams, ListUsersOffsetResult } from '../types/users';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data,
      });

      if (!user) throw new Error('Failed to create user!');

      return user;
    } catch {
      throw new Error('Failed to create user!');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    return user;
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) throw new Error('Failed to find user!');

      return user;
    } catch {
      throw new Error('Failed to find user!');
    }
  }

  async listUsers(
    params: ListUsersOffsetParams,
  ): Promise<ListUsersOffsetResult> {
    const pageSize = Math.min(Math.max(params.pageSize ?? 10, 1), 100);
    const page = Math.max(params.page ?? 0, 0);

    const where: any = {
      ...(params.role ? { role: params.role } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.q
        ? {
            OR: [
              { email: { contains: params.q, mode: 'insensitive' } },
              { fistName: { contains: params.q, mode: 'insensitive' } },
              { lastName: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    try {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: page * pageSize,
          take: pageSize,
        }),
        this.prisma.user.count({ where }),
      ]);

      return { items, total, page, pageSize };
    } catch {
      throw new Error('Failed to list user!');
    }
  }

  async updateById(id: string, data: any): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new Error('Failed to update user!');

    return user;
  }
}
