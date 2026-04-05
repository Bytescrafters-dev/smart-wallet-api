import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  storeSlug!: string;

  @IsString()
  variantId!: string;

  @IsString()
  productId!: string;

  @IsString()
  currency!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
