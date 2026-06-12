import { Injectable } from '@nestjs/common';
import { BillingCycle, PlanPrice, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CreatePlanPriceData,
  IPlanPriceRepository,
  ListPlanPricesParams,
  UpdatePlanPriceData,
} from '../interfaces/plan-price.repository.interface';

@Injectable()
export class PlanPriceRepository implements IPlanPriceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreatePlanPriceData): Promise<PlanPrice> {
    return this.prisma.planPrice.create({
      data: {
        ...data,
        features: data.features ?? Prisma.JsonNull,
      },
    });
  }

  findById(id: string): Promise<PlanPrice | null> {
    return this.prisma.planPrice.findUnique({ where: { id } });
  }

  findByUnique(
    planName: string,
    billingCycle: BillingCycle,
    currency: string,
  ): Promise<PlanPrice | null> {
    return this.prisma.planPrice.findUnique({
      where: { planName_billingCycle_currency: { planName, billingCycle, currency } },
    });
  }

  list(params: ListPlanPricesParams): Promise<PlanPrice[]> {
    const { planName, billingCycle, currency, isActive } = params;

    return this.prisma.planPrice.findMany({
      where: {
        ...(planName ? { planName: { contains: planName, mode: 'insensitive' as const } } : {}),
        ...(billingCycle ? { billingCycle } : {}),
        ...(currency ? { currency } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: [{ planName: 'asc' }, { billingCycle: 'asc' }, { currency: 'asc' }],
    });
  }

  update(id: string, data: UpdatePlanPriceData): Promise<PlanPrice> {
    const { features, ...rest } = data;
    return this.prisma.planPrice.update({
      where: { id },
      data: {
        ...rest,
        ...(features !== undefined
          ? { features: features ?? Prisma.JsonNull }
          : {}),
      },
    });
  }
}
