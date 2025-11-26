import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  defaultCurrency: string = 'AUD';

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  timezone?: string = 'Australia/Melbourne';

  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
