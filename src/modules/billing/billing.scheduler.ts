import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  addBillingCycle,
  calcDueDate,
  generateInvoiceNumber,
} from './utils/billing.utils';

@Injectable()
export class BillingScheduler {
  private readonly logger = new Logger(BillingScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Job 1: Trial expiry ────────────────────────────────────────────────────
  // Runs daily at 01:00. Finds TRIAL subscriptions whose tenant trial has
  // ended, activates them, and generates the first invoice.

  @Cron('0 1 * * *')
  async handleTrialExpiry() {
    this.logger.log('Running trial expiry check');
    const now = new Date();

    const subscriptions = await this.prisma.tenantSubscription.findMany({
      where: {
        status: 'TRIAL',
        endedAt: null,
        tenant: { trialEndsAt: { lte: now } },
      },
      include: {
        planPrice: true,
      },
    });

    for (const sub of subscriptions) {
      try {
        const periodStart = now;
        const periodEnd = addBillingCycle(
          periodStart,
          sub.planPrice.billingCycle,
        );
        const dueDate = calcDueDate(periodEnd, sub.daysUntilDue);

        await this.prisma.$transaction(async (tx) => {
          await tx.tenantSubscription.update({
            where: { id: sub.id },
            data: {
              status: 'ACTIVE',
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
            },
          });

          await tx.tenant.update({
            where: { id: sub.tenantId },
            data: {
              currentPlanName: sub.planPrice.planName,
              status: 'ACTIVE',
              trialEndsAt: null,
            },
          });

          const count = await tx.tenantInvoice.count();
          await tx.tenantInvoice.create({
            data: {
              tenantId: sub.tenantId,
              subscriptionId: sub.id,
              invoiceNumber: generateInvoiceNumber(count),
              amount: sub.planPrice.amount,
              currency: sub.planPrice.currency,
              dueDate,
            },
          });
        });

        this.logger.log(
          `Activated trial subscription ${sub.id} for tenant ${sub.tenantId}`,
        );
      } catch (err) {
        this.logger.error(`Failed to activate subscription ${sub.id}: ${err}`);
      }
    }
  }

  // ── Job 2: Period end ──────────────────────────────────────────────────────
  // Runs daily at 02:00. Finds ACTIVE subscriptions whose billing period has
  // ended, advances the period, and generates the next invoice.

  @Cron('0 2 * * *')
  async handlePeriodEnd() {
    this.logger.log('Running period end check');
    const now = new Date();

    const subscriptions = await this.prisma.tenantSubscription.findMany({
      where: {
        status: 'ACTIVE',
        endedAt: null,
        currentPeriodEnd: { lte: now },
      },
      include: { planPrice: true },
    });

    for (const sub of subscriptions) {
      try {
        if (sub.cancelAtPeriodEnd) {
          await this.prisma.$transaction(async (tx) => {
            await tx.tenantSubscription.update({
              where: { id: sub.id },
              data: { status: 'CANCELED', endedAt: now },
            });
            await tx.tenant.update({
              where: { id: sub.tenantId },
              data: { status: 'CANCELED' },
            });
          });
          this.logger.log(
            `Canceled subscription ${sub.id} for tenant ${sub.tenantId} at period end`,
          );
          continue;
        }

        // Idempotency: skip if a PENDING invoice already exists
        const pendingExists = await this.prisma.tenantInvoice.findFirst({
          where: { subscriptionId: sub.id, status: 'PENDING' },
          select: { id: true },
        });
        if (pendingExists) continue;

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

          const count = await tx.tenantInvoice.count();
          await tx.tenantInvoice.create({
            data: {
              tenantId: sub.tenantId,
              subscriptionId: sub.id,
              invoiceNumber: generateInvoiceNumber(count),
              amount: sub.planPrice.amount,
              currency: sub.planPrice.currency,
              dueDate,
            },
          });
        });

        this.logger.log(`Generated invoice for subscription ${sub.id}`);
      } catch (err) {
        this.logger.error(`Failed to renew subscription ${sub.id}: ${err}`);
      }
    }
  }

  // ── Job 3: Overdue invoices ────────────────────────────────────────────────
  // Runs daily at 03:00. Finds PENDING invoices past their due date, marks
  // them PAST_DUE, suspends the tenant, and revokes all refresh tokens.

  @Cron('0 3 * * *')
  async handleOverdue() {
    this.logger.log('Running overdue invoice check');
    const now = new Date();

    const overdueInvoices = await this.prisma.tenantInvoice.findMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      select: { id: true, tenantId: true },
    });

    for (const invoice of overdueInvoices) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.tenantInvoice.update({
            where: { id: invoice.id },
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
        });

        this.logger.log(
          `Suspended tenant ${invoice.tenantId} for overdue invoice ${invoice.id}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to process overdue invoice ${invoice.id}: ${err}`,
        );
      }
    }
  }
}
