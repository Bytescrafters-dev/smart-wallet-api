import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JOBS, QUEUES } from 'src/common/queues/queues.constants';

const JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
} as const;

@Injectable()
export class BillingScheduler {
  private readonly logger = new Logger(BillingScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.BILLING) private readonly billingQueue: Queue,
  ) {}

  // ── Job 1: Trial expiry ────────────────────────────────────────────────────
  // Runs daily at 01:00. Finds TRIAL subscriptions whose trial has ended and
  // enqueues one job per subscription.

  @Cron('0 1 * * *')
  async handleTrialExpiry() {
    this.logger.log('Enqueueing trial expiry jobs');
    const now = new Date();

    const subscriptions = await this.prisma.tenantSubscription.findMany({
      where: {
        status: 'TRIAL',
        endedAt: null,
        tenant: { trialEndsAt: { lte: now } },
      },
      select: { id: true },
    });

    for (const sub of subscriptions) {
      await this.billingQueue.add(
        JOBS.TRIAL_EXPIRY,
        { subscriptionId: sub.id },
        { ...JOB_OPTIONS, jobId: `trial-expiry:${sub.id}` },
      );
    }

    this.logger.log(`Enqueued ${subscriptions.length} trial expiry jobs`);
  }

  // ── Job 2: Period end ──────────────────────────────────────────────────────
  // Runs daily at 02:00. Finds ACTIVE subscriptions whose billing period has
  // ended and enqueues one job per subscription.

  @Cron('0 2 * * *')
  async handlePeriodEnd() {
    this.logger.log('Enqueueing period end jobs');
    const now = new Date();

    const subscriptions = await this.prisma.tenantSubscription.findMany({
      where: {
        status: 'ACTIVE',
        endedAt: null,
        currentPeriodEnd: { lte: now },
      },
      select: { id: true },
    });

    for (const sub of subscriptions) {
      await this.billingQueue.add(
        JOBS.PERIOD_END,
        { subscriptionId: sub.id },
        { ...JOB_OPTIONS, jobId: `period-end:${sub.id}` },
      );
    }

    this.logger.log(`Enqueued ${subscriptions.length} period end jobs`);
  }

  // ── Job 3: Overdue invoices ────────────────────────────────────────────────
  // Runs daily at 03:00. Finds PENDING invoices past their due date and
  // enqueues one job per invoice.

  @Cron('0 3 * * *')
  async handleOverdue() {
    this.logger.log('Enqueueing overdue invoice jobs');
    const now = new Date();

    const invoices = await this.prisma.tenantInvoice.findMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      select: { id: true },
    });

    for (const invoice of invoices) {
      await this.billingQueue.add(
        JOBS.OVERDUE_INVOICE,
        { invoiceId: invoice.id },
        { ...JOB_OPTIONS, jobId: `overdue-invoice:${invoice.id}` },
      );
    }

    this.logger.log(`Enqueued ${invoices.length} overdue invoice jobs`);
  }
}
