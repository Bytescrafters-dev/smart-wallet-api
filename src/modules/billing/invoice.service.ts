import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TOKENS } from 'src/common/constants/tokens';
import { IInvoiceRepository } from './interfaces/invoice.repository.interface';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(TOKENS.InvoiceRepo)
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly prisma: PrismaService,
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

    if (
      invoice.status !== InvoiceStatus.PENDING &&
      invoice.status !== InvoiceStatus.PAST_DUE
    ) {
      throw new BadRequestException(
        `Cannot mark a ${invoice.status.toLowerCase()} invoice as paid`,
      );
    }

    const paymentData = {
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
      paidById: superAdminId,
      paymentMethod: PaymentMethod.MANUAL,
    };

    if (invoice.status === InvoiceStatus.PENDING) {
      return this.invoiceRepo.update(id, paymentData);
    }

    // PAST_DUE — re-activate subscription and tenant in a single transaction
    return this.prisma.$transaction(async (tx) => {
      const paid = await this.invoiceRepo.update(id, paymentData, tx);

      await tx.tenantSubscription.updateMany({
        where: { id: invoice.subscriptionId, status: 'PAST_DUE' },
        data: { status: 'ACTIVE' },
      });

      await tx.tenant.update({
        where: { id: invoice.tenantId },
        data: { status: 'ACTIVE' },
      });

      return paid;
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
