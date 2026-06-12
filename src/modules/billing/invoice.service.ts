import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { TOKENS } from 'src/common/constants/tokens';
import { IInvoiceRepository } from './interfaces/invoice.repository.interface';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(TOKENS.InvoiceRepo)
    private readonly invoiceRepo: IInvoiceRepository,
  ) {}

  listByTenant(tenantId: string) {
    return this.invoiceRepo.findAllByTenant(tenantId);
  }

  async findOne(id: string) {
    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async markPaid(id: string, superAdminId: string) {
    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.status !== InvoiceStatus.PENDING) {
      throw new BadRequestException(
        `Cannot mark a ${invoice.status.toLowerCase()} invoice as paid`,
      );
    }

    return this.invoiceRepo.update(id, {
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
      paidById: superAdminId,
      paymentMethod: PaymentMethod.MANUAL,
    });
  }

  async voidInvoice(id: string) {
    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.status !== InvoiceStatus.PENDING) {
      throw new BadRequestException(
        `Cannot void a ${invoice.status.toLowerCase()} invoice`,
      );
    }

    return this.invoiceRepo.update(id, { status: InvoiceStatus.VOID });
  }
}
