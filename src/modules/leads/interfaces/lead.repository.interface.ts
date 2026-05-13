import { Lead, LeadSource, LeadStatus } from '@prisma/client';

export interface CreateLeadData {
  storeId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  source: LeadSource;
  productSKUs?: string[];
  note?: string | null;
  followUpDate?: Date | null;
  assignedToId?: string | null;
}

export interface LeadListParams {
  storeId: string;
  status?: LeadStatus;
  source?: LeadSource;
  q?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  followupFrom?: Date;
  followupTo?: Date;
  skip?: number;
  take?: number;
}

export interface UpdateLeadData {
  fullName?: string;
  phone?: string;
  email?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  source?: LeadSource;
  productSKUs?: string[];
  status?: LeadStatus;
  note?: string | null;
  followUpDate?: Date | null;
  assignedToId?: string | null;
}

export interface ILeadRepository {
  create(data: CreateLeadData): Promise<Lead>;
  createMany(data: CreateLeadData[]): Promise<number>;
  findById(id: string): Promise<any | null>;
  list(params: LeadListParams): Promise<any[]>;
  count(params: Omit<LeadListParams, 'skip' | 'take'>): Promise<number>;
  update(id: string, data: UpdateLeadData): Promise<Lead>;
  delete(id: string): Promise<void>;
}
