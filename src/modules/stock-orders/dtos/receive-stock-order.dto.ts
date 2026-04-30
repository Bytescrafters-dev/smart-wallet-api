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

export class ReceiveStockOrderLineDto {
  @IsString()
  lineId!: string;

  @IsInt()
  @Min(1)
  receivedQty!: number;

  @IsInt()
  @Min(0)
  costPerUnit!: number;
}

export class ReceiveStockOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReceiveStockOrderLineDto)
  lines!: ReceiveStockOrderLineDto[];

  @IsOptional()
  @IsString()
  invoiceRef?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  currency!: string;
}
