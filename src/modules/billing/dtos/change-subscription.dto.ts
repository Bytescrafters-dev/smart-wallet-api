import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planPriceId!: string;
}
