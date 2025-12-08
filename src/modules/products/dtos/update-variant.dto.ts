import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { ProductVariantDto } from './product-variant.dto';

class PartialProductVariantDto extends PartialType(ProductVariantDto) {}

export class UpdateVariantDto {
  @IsString()
  variantId: string;

  @ValidateNested()
  @Type(() => PartialProductVariantDto)
  data: PartialProductVariantDto;
}