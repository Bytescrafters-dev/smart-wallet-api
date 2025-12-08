import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class VariantPriceDto {
  @IsString()
  currency: string;

  @IsNumber()
  amount: number; // in cents

  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @IsOptional()
  @IsDateString()
  validTo?: Date;
}