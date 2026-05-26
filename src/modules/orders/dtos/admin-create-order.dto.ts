import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

export class AdminOrderItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class AdminCreateOrderDto {
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminOrderItemDto)
  items!: AdminOrderItemDto[];

  @IsOptional()
  @IsString()
  storeUserId?: string;

  @IsOptional()
  @IsString()
  shippingAddress1?: string;

  @IsOptional()
  @IsString()
  shippingAddress2?: string;

  @IsOptional()
  @IsString()
  shippingCity?: string;

  @IsOptional()
  @IsString()
  shippingState?: string;

  @IsOptional()
  @IsString()
  shippingPostalCode?: string;

  @IsOptional()
  @IsString()
  shippingCountry?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  shippingOptionId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
