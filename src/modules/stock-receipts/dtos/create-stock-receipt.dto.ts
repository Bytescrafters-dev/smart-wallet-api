import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockReceiptLineDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  qty!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  costPerUnit?: number;
}

export class CreateStockReceiptDto {
  @IsString()
  storeId!: string;

  @IsOptional()
  @IsString()
  invoiceRef?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateStockReceiptLineDto)
  lines!: CreateStockReceiptLineDto[];
}
