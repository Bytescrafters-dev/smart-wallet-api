import { IsString, IsArray, IsOptional, IsNumber } from 'class-validator';

export class AddVariantDto {
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsArray()
  @IsString({ each: true })
  optionValueIds: string[];

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNumber()
  priceCents: number;

  @IsOptional()
  @IsNumber()
  initialQty?: number;
}