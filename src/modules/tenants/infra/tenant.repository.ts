import { Injectable } from '@nestjs/common';
import { Prisma, Tenant } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CreateTenantData,
  ITenantRepository,
  ListTenantsParams,
  UpdateTenantData,
} from '../interfaces/tenant.repository.interface';

const TENANT_SUMMARY_INCLUDE = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

const TENANT_DETAIL_INCLUDE = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  users: {
    where: { role: 'OWNER' as const },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      mustChangePassword: true,
      createdAt: true,
    },
  },
} as const;

@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateTenantData, tx?: Prisma.TransactionClient): Promise<Tenant> {
    const client = tx ?? this.prisma;
    return client.tenant.create({ data });
  }

  findById(id: string): Promise<any | null> {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: TENANT_DETAIL_INCLUDE,
    });
  }

  findByEmail(email: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { email } });
  }

  list(params: ListTenantsParams): Promise<any[]> {
    const { status, plan, q, skip, take } = params;

    return this.prisma.tenant.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(plan ? { plan } : {}),
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' as const } },
                { firstName: { contains: q, mode: 'insensitive' as const } },
                { lastName: { contains: q, mode: 'insensitive' as const } },
                { companyName: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: TENANT_SUMMARY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  count(params: Omit<ListTenantsParams, 'skip' | 'take'>): Promise<number> {
    const { status, plan, q } = params;

    return this.prisma.tenant.count({
      where: {
        ...(status ? { status } : {}),
        ...(plan ? { plan } : {}),
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' as const } },
                { firstName: { contains: q, mode: 'insensitive' as const } },
                { lastName: { contains: q, mode: 'insensitive' as const } },
                { companyName: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
    });
  }

  update(id: string, data: UpdateTenantData): Promise<any> {
    return this.prisma.tenant.update({
      where: { id },
      data,
      include: TENANT_DETAIL_INCLUDE,
    });
  }
}
