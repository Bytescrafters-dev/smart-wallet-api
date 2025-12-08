import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { VariantPriceDto } from './variant-price.dto';
import { VariantInventoryDto } from './variant-inventory.dto';

export class ProductVariantDto {
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  weightGrams?: number;

  @IsOptional()
  @IsNumber()
  lengthCm?: number;

  @IsOptional()
  @IsNumber()
  widthCm?: number;

  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @IsBoolean()
  active: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  optionValueIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantPriceDto)
  prices: VariantPriceDto[];

  @ValidateNested()
  @Type(() => VariantInventoryDto)
  inventory: VariantInventoryDto;
}