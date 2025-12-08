import { IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { VariantPriceDto } from './variant-price.dto';

export class UpdateVariantPriceDto extends PartialType(VariantPriceDto) {
  @IsOptional()
  @IsString()
  id?: string; // For frontend compatibility
}