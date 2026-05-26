import { IsEnum, IsOptional, IsString } from 'class-validator';

export class StorefrontCheckoutDto {
  @IsString()
  cartId!: string;

  @IsEnum(['UNPAID', 'COD'])
  paymentStatus!: 'UNPAID' | 'COD';

  @IsOptional()
  @IsString()
  shippingAddressId?: string;

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
  shippingOptionId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
