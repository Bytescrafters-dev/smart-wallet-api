import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JOBS, QUEUES } from 'src/common/queues/queues.constants';
import {
  addBillingCycle,
  calcDueDate,
  nextInvoiceNumber,
} from '../utils/billing.utils';

@Processor(QUEUES.BILLING)
export class BillingProcessor extends WorkerHost {
  private readonly logger = new Logger(BillingProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOBS.TRIAL_EXPIRY:
        return this.handleTrialExpiry(job.data);
      case JOBS.PERIOD_END:
        return this.handlePeriodEnd(job.data);
      case JOBS.OVERDUE_INVOICE:
        return this.handleOverdueInvoice(job.data);
      default:
        this.logger.warn(`Unknown billing job: ${job.name}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Billing job ${job.name} [${job.id}] failed: ${error.message}`,
    );
  }

  private async handleTrialExpiry({
    subscriptionId,
  }: {
    subscriptionId: string;
  }) {
    const sub = await this.prisma.tenantSubscription.findUnique({
      where: { id: subscriptionId },
      include: { planPrice: true },
    });
    if (!sub) return;

    const now = new Date();
    const periodEnd = addBillingCycle(now, sub.planPrice.billingCycle);
    const dueDate = calcDueDate(periodEnd, sub.daysUntilDue);

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.tenantSubscription.updateMany({
        where: { id: sub.id, status: 'TRIAL' },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
      if (count === 0) return;

      await tx.tenant.update({
        where: { id: sub.tenantId },
        data: {
          currentPlanName: sub.planPrice.planName,
          status: 'ACTIVE',
          trialEndsAt: null,
        },
      });

      await tx.tenantInvoice.create({
        data: {
          tenantId: sub.tenantId,
          subscriptionId: sub.id,
          invoiceNumber: await nextInvoiceNumber(tx),
          amount: sub.planPrice.amount,
          currency: sub.planPrice.currency,
          dueDate,
        },
      });
    });

    this.logger.log(`Activated trial subscription ${subscriptionId}`);
  }

  private async handlePeriodEnd({
    subscriptionId,
  }: {
    subscriptionId: string;
  }) {
    const sub = await this.prisma.tenantSubscription.findUnique({
      where: { id: subscriptionId },
      include: { planPrice: true },
    });
    if (!sub) return;

    if (sub.cancelAtPeriodEnd) {
      await this.prisma.$transaction(async (tx) => {
        await tx.tenantSubscription.update({
          where: { id: sub.id },
          data: { status: 'CANCELED', endedAt: new Date() },
        });
        await tx.tenant.update({
          where: { id: sub.tenantId },
          data: { status: 'CANCELED' },
        });
      });
      this.logger.log(`Canceled subscription ${subscriptionId} at period end`);
      return;
    }

    const pendingExists = await this.prisma.tenantInvoice.findFirst({
      where: { subscriptionId: sub.id, status: 'PENDING' },
      select: { id: true },
    });
    if (pendingExists) return;

    const newPeriodStart = sub.currentPeriodEnd!;
    const newPeriodEnd = addBillingCycle(
      newPeriodStart,
      sub.planPrice.billingCycle,
    );
    const dueDate = calcDueDate(newPeriodEnd, sub.daysUntilDue);

    await this.prisma.$transaction(async (tx) => {
      await tx.tenantSubscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
        },
      });

      await tx.tenantInvoice.create({
        data: {
          tenantId: sub.tenantId,
          subscriptionId: sub.id,
          invoiceNumber: await nextInvoiceNumber(tx),
          amount: sub.planPrice.amount,
          currency: sub.planPrice.currency,
          dueDate,
        },
      });
    });

    this.logger.log(`Generated invoice for subscription ${subscriptionId}`);
  }

  private async handleOverdueInvoice({ invoiceId }: { invoiceId: string }) {
    const invoice = await this.prisma.tenantInvoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, tenantId: true, subscriptionId: true },
    });
    if (!invoice) return;

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.tenantInvoice.updateMany({
        where: { id: invoice.id, status: 'PENDING' },
        data: { status: 'PAST_DUE' },
      });
      if (count === 0) return;

      await tx.tenantSubscription.updateMany({
        where: { id: invoice.subscriptionId, status: 'ACTIVE' },
        data: { status: 'PAST_DUE' },
      });

      await tx.tenant.update({
        where: { id: invoice.tenantId },
        data: { status: 'SUSPENDED' },
      });

      await tx.refreshToken.updateMany({
        where: { user: { tenantId: invoice.tenantId }, revokedAt: null },
        data: { revokedAt: now },
      });

      const tenantStores = await tx.adminStore.findMany({
        where: { user: { tenantId: invoice.tenantId } },
        select: { storeId: true },
      });
      await tx.storeUserRefreshToken.updateMany({
        where: {
          storeUser: {
            storeId: { in: tenantStores.map((s) => s.storeId) },
          },
          revokedAt: null,
        },
        data: { revokedAt: now },
      });
    });

    this.logger.log(`Processed overdue invoice ${invoiceId}`);
  }
}
