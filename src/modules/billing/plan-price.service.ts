import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IPlanPriceRepository } from './interfaces/plan-price.repository.interface';
import { CreatePlanPriceDto } from './dtos/create-plan-price.dto';
import { UpdatePlanPriceDto } from './dtos/update-plan-price.dto';
import { ListPlanPricesQueryDto } from './dtos/list-plan-prices-query.dto';

@Injectable()
export class PlanPriceService {
  constructor(
    @Inject(TOKENS.PlanPriceRepo)
    private readonly planPriceRepo: IPlanPriceRepository,
  ) {}

  async create(dto: CreatePlanPriceDto) {
    const existing = await this.planPriceRepo.findByUnique(
      dto.planName,
      dto.billingCycle,
      dto.currency,
    );
    if (existing) {
      throw new ConflictException(
        `A price for ${dto.planName} / ${dto.billingCycle} / ${dto.currency} already exists`,
      );
    }

    return this.planPriceRepo.create({
      planName: dto.planName,
      billingCycle: dto.billingCycle,
      currency: dto.currency,
      amount: dto.amount,
      features: dto.features ?? null,
    });
  }

  list(query: ListPlanPricesQueryDto) {
    return this.planPriceRepo.list({
      planName: query.planName,
      billingCycle: query.billingCycle,
      currency: query.currency,
      isActive: query.isActive,
    });
  }

  async update(id: string, dto: UpdatePlanPriceDto) {
    const existing = await this.planPriceRepo.findById(id);
    if (!existing) throw new NotFoundException('Plan price not found');

    return this.planPriceRepo.update(id, {
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.features !== undefined ? { features: dto.features } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
  }

  getById(id: string) {
    return this.planPriceRepo.findById(id);
  }
}
