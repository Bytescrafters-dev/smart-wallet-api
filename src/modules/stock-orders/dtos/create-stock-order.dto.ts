import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockOrderLineDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  orderedQty!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  costPerUnit?: number;
}

export class CreateStockOrderDto {
  @IsString()
  storeId!: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  invoiceRef?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateStockOrderLineDto)
  lines!: CreateStockOrderLineDto[];
}
