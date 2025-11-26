import { Optional } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @Optional()
  phone?: string;

  @IsString()
  @Optional()
  avatar: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
