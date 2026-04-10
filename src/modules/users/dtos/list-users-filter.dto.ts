import { IsOptional, IsString } from 'class-validator';

export class ListUsersFilterDto {
  @IsOptional()
  @IsString()
  q?: string;
}
