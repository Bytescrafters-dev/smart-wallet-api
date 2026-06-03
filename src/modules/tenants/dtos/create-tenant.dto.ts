import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { TenantPlan, TenantStatus } from '@prisma/client';

export class CreateTenantDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(TenantPlan)
  plan!: TenantPlan;

  @IsEnum(TenantStatus)
  status!: TenantStatus;

  @ValidateIf((o) => o.plan === TenantPlan.TRIAL)
  @IsNotEmpty({ message: 'trialEndsAt is required for TRIAL plan' })
  @IsDateString()
  trialEndsAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
