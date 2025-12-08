import { IsNumber, Min } from 'class-validator';

export class VariantInventoryDto {
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  reserved: number;

  @IsNumber()
  @Min(0)
  lowStockThreshold: number;
}