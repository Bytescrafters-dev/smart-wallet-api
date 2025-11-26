// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  // Optional: auto-generate from title if omitted
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be kebab-case (e.g., "ultra-soft-tee").',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  // Optional relations; empty string -> undefined
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  profileId?: string;
}
