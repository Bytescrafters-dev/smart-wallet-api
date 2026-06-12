import { BillingCycle, SubscriptionStatus, TenantSubscription } from '@prisma/client';

export interface CreateSubscriptionData {
  tenantId: string;
  planPriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  daysUntilDue?: number;
  createdById?: string | null;
}

export interface UpdateSubscriptionData {
  status?: SubscriptionStatus;
  planPriceId?: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  endedAt?: Date | null;
  cancelAtPeriodEnd?: boolean;
  daysUntilDue?: number;
}

export interface ISubscriptionRepository {
  findCurrent(tenantId: string): Promise<any | null>;
  findAllByTenant(tenantId: string): Promise<any[]>;
  create(data: CreateSubscriptionData, tx?: any): Promise<TenantSubscription>;
  update(id: string, data: UpdateSubscriptionData, tx?: any): Promise<TenantSubscription>;
}
