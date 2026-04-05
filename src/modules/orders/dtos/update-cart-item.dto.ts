import { IsInt, IsString, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsString()
  cartId!: string;

  @IsString()
  itemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
