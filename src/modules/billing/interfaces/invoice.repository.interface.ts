import { InvoiceStatus, PaymentMethod, TenantInvoice } from '@prisma/client';

export interface UpdateInvoiceData {
  status?: InvoiceStatus;
  paidAt?: Date | null;
  paidById?: string | null;
  paymentMethod?: PaymentMethod;
}

export interface InvoicesListParams {
  status?: InvoiceStatus;
  q?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  dueFrom?: Date;
  dueTo?: Date;
  skip?: number;
  take?: number;
}

export interface IInvoiceRepository {
  findAllByTenant(tenantId: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  update(id: string, data: UpdateInvoiceData, tx?: any): Promise<TenantInvoice>;
  list(params: InvoicesListParams): Promise<any[]>;
  count(params: Omit<InvoicesListParams, 'skip' | 'take'>): Promise<number>;
}
