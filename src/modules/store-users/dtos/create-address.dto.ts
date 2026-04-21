import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  address1!: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsString()
  postalCode!: string;

  @IsString()
  country!: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault: boolean = false;
}
