import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsNotEmpty()
  defaultCurrency: string;

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