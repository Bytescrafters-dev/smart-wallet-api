import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TOKENS } from 'src/common/constants/tokens';
import { ISubscriptionRepository } from './interfaces/subscription.repository.interface';
import { ChangeSubscriptionDto } from './dtos/change-subscription.dto';
import { UpdateSubscriptionSettingsDto } from './dtos/update-subscription-settings.dto';
import {
  addBillingCycle,
  calcDueDate,
  nextInvoiceNumber,
} from './utils/billing.utils';

@Injectable()
export class SubscriptionService {
  constructor(
    @Inject(TOKENS.SubscriptionRepo)
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async activate(tenantId: string, superAdminId: string) {
    const current = await this.subscriptionRepo.findCurrent(tenantId);
    if (!current) throw new NotFoundException('No active subscription found');
    if (current.status !== SubscriptionStatus.TRIAL) {
      throw new BadRequestException(
        'Only TRIAL subscriptions can be activated',
      );
    }

    const { planPrice } = current;
    const now = new Date();
    const periodEnd = addBillingCycle(now, planPrice.billingCycle);
    const dueDate = calcDueDate(periodEnd, current.daysUntilDue);

    return this.prisma.$transaction(async (tx) => {
      const subscription = await this.subscriptionRepo.update(
        current.id,
        {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        tx,
      );

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          currentPlanName: planPrice.planName,
          status: 'ACTIVE',
          trialEndsAt: null,
        },
      });

      await tx.tenantInvoice.create({
        data: {
          tenantId,
          subscriptionId: current.id,
          invoiceNumber: await nextInvoiceNumber(tx),
          amount: planPrice.amount,
          currency: planPrice.currency,
          dueDate,
        },
      });

      return subscription;
    });
  }

  getCurrent(tenantId: string) {
    return this.subscriptionRepo.findCurrent(tenantId);
  }

  async updateSettings(tenantId: string, dto: UpdateSubscriptionSettingsDto) {
    const current = await this.subscriptionRepo.findCurrent(tenantId);
    if (!current) throw new NotFoundException('No active subscription found');

    return this.subscriptionRepo.update(current.id, {
      ...(dto.daysUntilDue !== undefined ? { daysUntilDue: dto.daysUntilDue } : {}),
      ...(dto.cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd: dto.cancelAtPeriodEnd } : {}),
    });
  }

  getHistory(tenantId: string) {
    return this.subscriptionRepo.findAllByTenant(tenantId);
  }

  async changePlan(
    tenantId: string,
    dto: ChangeSubscriptionDto,
    superAdminId: string,
  ) {
    const current = await this.subscriptionRepo.findCurrent(tenantId);
    if (!current) throw new NotFoundException('No active subscription found');

    const planPrice = await this.prisma.planPrice.findUnique({
      where: { id: dto.planPriceId },
      select: {
        id: true,
        isActive: true,
        planName: true,
        billingCycle: true,
        currency: true,
        amount: true,
      },
    });
    if (!planPrice) throw new NotFoundException('Plan price not found');
    if (!planPrice.isActive) {
      throw new BadRequestException('Selected plan price is no longer active');
    }

    // During trial — just swap the planPriceId, no billing cycle change
    if (current.status === SubscriptionStatus.TRIAL) {
      return this.subscriptionRepo.update(current.id, {
        planPriceId: dto.planPriceId,
      });
    }

    // Active subscription — end current, create new, generate invoice
    const now = new Date();
    const periodEnd = addBillingCycle(now, planPrice.billingCycle);
    const dueDate = calcDueDate(periodEnd, current.daysUntilDue);

    return this.prisma.$transaction(async (tx) => {
      // End current subscription
      await this.subscriptionRepo.update(current.id, { endedAt: now }, tx);

      // Void any pending invoices on the old subscription
      await tx.tenantInvoice.updateMany({
        where: { subscriptionId: current.id, status: 'PENDING' },
        data: { status: 'VOID' },
      });

      // Create new subscription
      const newSubscription = await this.subscriptionRepo.create(
        {
          tenantId,
          planPriceId: dto.planPriceId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          daysUntilDue: current.daysUntilDue,
          createdById: superAdminId,
        },
        tx,
      );

      // Update tenant plan
      await tx.tenant.update({
        where: { id: tenantId },
        data: { currentPlanName: planPrice.planName },
      });

      // Generate first invoice
      await tx.tenantInvoice.create({
        data: {
          tenantId,
          subscriptionId: newSubscription.id,
          invoiceNumber: await nextInvoiceNumber(tx),
          amount: planPrice.amount,
          currency: planPrice.currency,
          dueDate,
        },
      });

      return newSubscription;
    });
  }
}
