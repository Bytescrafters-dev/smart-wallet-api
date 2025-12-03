import { IsString, IsOptional } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  supportEmail?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}