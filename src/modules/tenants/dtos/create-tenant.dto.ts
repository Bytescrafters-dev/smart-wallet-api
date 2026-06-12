import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TenantStatus } from '@prisma/client';

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

  @IsEnum(TenantStatus)
  status!: TenantStatus;

  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;

  @IsString()
  @IsNotEmpty()
  planPriceId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
