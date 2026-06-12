import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TenantStatus } from '@prisma/client';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
