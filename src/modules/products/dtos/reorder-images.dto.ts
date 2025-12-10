import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImageOrder {
  @IsString()
  id: string;

  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageOrder)
  images: ImageOrder[];
}
