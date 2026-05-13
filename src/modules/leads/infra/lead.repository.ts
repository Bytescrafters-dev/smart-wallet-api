import { Injectable } from '@nestjs/common';
import { Lead } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CreateLeadData,
  ILeadRepository,
  LeadListParams,
  UpdateLeadData,
} from '../interfaces/lead.repository.interface';

@Injectable()
export class LeadRepository implements ILeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateLeadData): Promise<Lead> {
    return this.prisma.lead.create({ data });
  }

  async createMany(data: CreateLeadData[]): Promise<number> {
    const result = await this.prisma.lead.createMany({ data });
    return result.count;
  }

  findById(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  list(params: LeadListParams) {
    const { skip = 0, take = 20 } = params;
    return this.prisma.lead.findMany({
      where: this.buildWhere(params),
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  count(params: Omit<LeadListParams, 'skip' | 'take'>): Promise<number> {
    return this.prisma.lead.count({ where: this.buildWhere(params) });
  }

  private buildWhere(params: Omit<LeadListParams, 'skip' | 'take'>) {
    const { storeId, status, source, q, createdAtFrom, createdAtTo, followupFrom, followupTo } = params;
    return {
      storeId,
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q } },
              { email: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(createdAtFrom || createdAtTo
        ? {
            createdAt: {
              ...(createdAtFrom ? { gte: createdAtFrom } : {}),
              ...(createdAtTo ? { lte: createdAtTo } : {}),
            },
          }
        : {}),
      ...(followupFrom || followupTo
        ? {
            followUpDate: {
              ...(followupFrom ? { gte: followupFrom } : {}),
              ...(followupTo ? { lte: followupTo } : {}),
            },
          }
        : {}),
    };
  }

  update(id: string, data: UpdateLeadData): Promise<Lead> {
    return this.prisma.lead.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lead.delete({ where: { id } });
  }
}
