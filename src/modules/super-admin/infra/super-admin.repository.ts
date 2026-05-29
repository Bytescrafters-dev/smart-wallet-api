import { Injectable } from '@nestjs/common';
import { SuperAdmin } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CreateSuperAdminData,
  ISuperAdminRepository,
} from '../interfaces/super-admin.repository.interface';

@Injectable()
export class SuperAdminRepository implements ISuperAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<SuperAdmin | null> {
    return this.prisma.superAdmin.findUnique({ where: { email } });
  }

  findById(id: string): Promise<SuperAdmin | null> {
    return this.prisma.superAdmin.findUnique({ where: { id } });
  }

  async updateAvatar(id: string, avatar: string): Promise<void> {
    await this.prisma.superAdmin.update({ where: { id }, data: { avatar } });
  }

  async updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<Omit<SuperAdmin, 'passwordHash'>> {
    const { passwordHash: _, ...rest } = await this.prisma.superAdmin.update({
      where: { id },
      data,
    });

    return rest;
  }

  create(data: CreateSuperAdminData): Promise<SuperAdmin> {
    const { createdById, ...rest } = data;
    return this.prisma.superAdmin.create({
      data: {
        ...rest,
        ...(createdById ? { createdBy: { connect: { id: createdById } } } : {}),
      },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.superAdmin.update({
      where: { id },
      data: { passwordHash, mustChangePassword: false },
    });
  }
}
