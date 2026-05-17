import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AssignStoresDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  storeIds!: string[];
}
