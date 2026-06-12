import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class CreatePlanPriceDto {
  @IsString()
  @IsNotEmpty()
  planName!: string;

  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @IsString()
  @IsIn(['LKR', 'AUD', 'USD'])
  currency!: string;

  @IsInt()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;
}
