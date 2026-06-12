import { InvoiceStatus, PaymentMethod, TenantInvoice } from '@prisma/client';

export interface UpdateInvoiceData {
  status?: InvoiceStatus;
  paidAt?: Date | null;
  paidById?: string | null;
  paymentMethod?: PaymentMethod;
}

export interface IInvoiceRepository {
  findAllByTenant(tenantId: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  update(id: string, data: UpdateInvoiceData, tx?: any): Promise<TenantInvoice>;
}
