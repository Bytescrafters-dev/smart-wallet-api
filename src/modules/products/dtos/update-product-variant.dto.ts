import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateVariantPriceDto } from './update-variant-price.dto';
import { UpdateVariantInventoryDto } from './update-variant-inventory.dto';

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  id?: string; // For frontend compatibility

  @IsOptional()
  @IsString()
  sku?: string;

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

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionValueIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantPriceDto)
  prices?: UpdateVariantPriceDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateVariantInventoryDto)
  inventory?: UpdateVariantInventoryDto;
}