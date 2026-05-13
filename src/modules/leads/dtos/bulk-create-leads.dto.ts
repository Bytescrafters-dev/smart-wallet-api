import { IsArray, ArrayNotEmpty } from 'class-validator';

export class BulkCreateLeadsDto {
  @IsArray()
  @ArrayNotEmpty()
  leads!: any[];
}
