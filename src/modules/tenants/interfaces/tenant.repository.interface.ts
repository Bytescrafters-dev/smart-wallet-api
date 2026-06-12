import { Tenant, TenantStatus } from '@prisma/client';

export interface CreateTenantData {
  companyName?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  status: TenantStatus;
  currentPlanName?: string | null;
  trialEndsAt?: Date | null;
  notes?: string;
  createdById?: string;
}

export interface UpdateTenantData {
  companyName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: TenantStatus;
  trialEndsAt?: Date | null;
  notes?: string;
}

export interface ListTenantsParams {
  status?: TenantStatus;
  currentPlanName?: string;
  q?: string;
  skip: number;
  take: number;
}

export interface ITenantRepository {
  create(data: CreateTenantData, tx?: any): Promise<Tenant>;
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<Tenant | null>;
  findStatusById(id: string): Promise<{ status: TenantStatus } | null>;
  list(params: ListTenantsParams): Promise<any[]>;
  count(params: Omit<ListTenantsParams, 'skip' | 'take'>): Promise<number>;
  update(id: string, data: UpdateTenantData): Promise<any>;
}
