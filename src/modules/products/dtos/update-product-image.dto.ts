import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProductImageDto {
  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
