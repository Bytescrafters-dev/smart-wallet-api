import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { BillingCycle } from '@prisma/client';

export class ListPlanPricesQueryDto {
  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsString()
  @IsIn(['LKR', 'AUD', 'USD'])
  currency?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
