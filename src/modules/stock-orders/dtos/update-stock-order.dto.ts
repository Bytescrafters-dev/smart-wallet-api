import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStockOrderLineDto } from './create-stock-order.dto';

export class UpdateStockOrderLineDto {
  @IsString()
  lineId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  orderedQty?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  costPerUnit?: number;
}

export class UpdateStockOrderDto {
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
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateStockOrderLineDto)
  updateLines?: UpdateStockOrderLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockOrderLineDto)
  addLines?: CreateStockOrderLineDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeLineIds?: string[];
}
