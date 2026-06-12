import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSubscriptionSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  daysUntilDue?: number;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;
}
