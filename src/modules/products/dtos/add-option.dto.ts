import { IsString, IsArray, IsOptional, IsNumber } from 'class-validator';

export class AddOptionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];
}