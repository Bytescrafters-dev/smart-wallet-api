import { Injectable } from '@nestjs/common';
import {
  ISupplierRepository,
  SuppliersListParams,
  SuppliersListResponse,
} from '../interfaces/suppliers.repository.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Supplier, Prisma } from '@prisma/client';

@Injectable()
export class SupplierRepository implements ISupplierRepository {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.supplier.findUnique({ where: { id } });
  }

  create(data: {
    storeId: string;
    name: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address1?: string;
    city?: string;
    country?: string;
    notes?: string;
  }) {
    return this.prisma.supplier.create({ data });
  }

  updateById(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.prisma.supplier.delete({ where: { id } });
  }

  async listAllSupplierByStoreId(
    params: SuppliersListParams,
  ): Promise<SuppliersListResponse> {
    const { storeId, q, skip = 0, take = 20 } = params;
    const where: Prisma.SupplierWhereInput = {
      storeId,
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return {
      data,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
    };
  }
}
