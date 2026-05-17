import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { AdminRole } from '@prisma/client';

export class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(AdminRole)
  @IsIn([AdminRole.MANAGER, AdminRole.VIEWER])
  role!: AdminRole;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  storeIds!: string[];
}
