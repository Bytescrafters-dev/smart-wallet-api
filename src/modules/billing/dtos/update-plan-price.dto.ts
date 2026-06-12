import { IsBoolean, IsInt, IsObject, IsOptional, Min } from 'class-validator';

export class UpdatePlanPriceDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
