import { PartialType } from '@nestjs/mapped-types';
import { VariantInventoryDto } from './variant-inventory.dto';

export class UpdateVariantInventoryDto extends PartialType(VariantInventoryDto) {}