import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class PresignProductImageDto {
  @IsString()
  productId: string;

  @IsString()
  fileName: string;

  @IsString()
  @IsIn(['image/jpeg', 'image/jpg', 'image/png'])
  mimeType: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
