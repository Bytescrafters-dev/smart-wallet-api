import { Injectable } from '@nestjs/common';
import { Prisma, TenantSubscription } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CreateSubscriptionData,
  ISubscriptionRepository,
  UpdateSubscriptionData,
} from '../interfaces/subscription.repository.interface';

const SUBSCRIPTION_INCLUDE = {
  planPrice: {
    select: {
      id: true,
      planName: true,
      billingCycle: true,
      currency: true,
      amount: true,
      features: true,
    },
  },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCurrent(tenantId: string): Promise<any | null> {
    return this.prisma.tenantSubscription.findFirst({
      where: { tenantId, endedAt: null },
      include: SUBSCRIPTION_INCLUDE,
    });
  }

  findAllByTenant(tenantId: string): Promise<any[]> {
    return this.prisma.tenantSubscription.findMany({
      where: { tenantId },
      include: SUBSCRIPTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(
    data: CreateSubscriptionData,
    tx?: Prisma.TransactionClient,
  ): Promise<TenantSubscription> {
    const client = tx ?? this.prisma;
    return client.tenantSubscription.create({ data });
  }

  update(
    id: string,
    data: UpdateSubscriptionData,
    tx?: Prisma.TransactionClient,
  ): Promise<TenantSubscription> {
    const client = tx ?? this.prisma;
    return client.tenantSubscription.update({ where: { id }, data });
  }
}
