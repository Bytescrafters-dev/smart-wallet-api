import { Injectable } from '@nestjs/common';
import { Prisma, TenantInvoice } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  IInvoiceRepository,
  UpdateInvoiceData,
} from '../interfaces/invoice.repository.interface';

const PAID_BY_SELECT = {
  select: { id: true, firstName: true, lastName: true },
} as const;

const SUBSCRIPTION_SELECT = {
  select: {
    id: true,
    status: true,
    currentPeriodStart: true,
    currentPeriodEnd: true,
    planPrice: {
      select: {
        planName: true,
        billingCycle: true,
        currency: true,
        amount: true,
      },
    },
  },
} as const;

@Injectable()
export class InvoiceRepository implements IInvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string): Promise<any[]> {
    return this.prisma.tenantInvoice.findMany({
      where: { tenantId },
      include: {
        subscription: SUBSCRIPTION_SELECT,
        paidBy: PAID_BY_SELECT,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<any | null> {
    return this.prisma.tenantInvoice.findUnique({
      where: { id },
      include: {
        subscription: SUBSCRIPTION_SELECT,
        paidBy: PAID_BY_SELECT,
      },
    });
  }

  update(
    id: string,
    data: UpdateInvoiceData,
    tx?: Prisma.TransactionClient,
  ): Promise<TenantInvoice> {
    const client = tx ?? this.prisma;
    return client.tenantInvoice.update({ where: { id }, data });
  }
}
