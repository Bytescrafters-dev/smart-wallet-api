import { BillingCycle, PlanPrice } from '@prisma/client';

export interface CreatePlanPriceData {
  planName: string;
  billingCycle: BillingCycle;
  currency: string;
  amount: number;
  features?: Record<string, any> | null;
}

export interface UpdatePlanPriceData {
  amount?: number;
  features?: Record<string, any> | null;
  isActive?: boolean;
}

export interface ListPlanPricesParams {
  planName?: string;
  billingCycle?: BillingCycle;
  currency?: string;
  isActive?: boolean;
}

export interface IPlanPriceRepository {
  create(data: CreatePlanPriceData): Promise<PlanPrice>;
  findById(id: string): Promise<PlanPrice | null>;
  findByUnique(
    planName: string,
    billingCycle: BillingCycle,
    currency: string,
  ): Promise<PlanPrice | null>;
  list(params: ListPlanPricesParams): Promise<PlanPrice[]>;
  update(id: string, data: UpdatePlanPriceData): Promise<PlanPrice>;
}
