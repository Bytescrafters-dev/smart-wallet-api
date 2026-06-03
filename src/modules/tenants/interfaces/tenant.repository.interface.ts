import { Tenant, TenantPlan, TenantStatus } from '@prisma/client';

export interface CreateTenantData {
  companyName?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  plan: TenantPlan;
  status: TenantStatus;
  trialEndsAt?: Date | null;
  notes?: string;
  createdById?: string;
}

export interface UpdateTenantData {
  companyName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  plan?: TenantPlan;
  status?: TenantStatus;
  trialEndsAt?: Date | null;
  notes?: string;
}

export interface ListTenantsParams {
  status?: TenantStatus;
  plan?: TenantPlan;
  q?: string;
  skip: number;
  take: number;
}

export interface ITenantRepository {
  create(data: CreateTenantData, tx?: any): Promise<Tenant>;
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<Tenant | null>;
  list(params: ListTenantsParams): Promise<any[]>;
  count(params: Omit<ListTenantsParams, 'skip' | 'take'>): Promise<number>;
  update(id: string, data: UpdateTenantData): Promise<any>;
}
