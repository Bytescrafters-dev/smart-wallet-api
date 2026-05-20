import { AdminRole } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  @IsIn([AdminRole.MANAGER, AdminRole.VIEWER])
  role?: AdminRole;
}
