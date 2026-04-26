import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { SupplierService } from './suppliers.service';
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import { SuppliersQueryDto } from './dtos/suppliers-query.dto';

@Controller('suppliers')
@UseGuards(AdminGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get('/all/:storeId')
  getAllSuppliers(
    @Param('storeId') storeId: string,
    @Query() query: SuppliersQueryDto,
  ) {
    return this.supplierService.getSuppliers(storeId, query);
  }

  @Get('/:id')
  getSupplier(@Param('id') id: string) {
    return this.supplierService.getSupplier(id);
  }

  @Post()
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.supplierService.createSupplier(dto);
  }

  @Patch('/:id')
  updateSupplier(@Param('id') id: string, @Body() dto: CreateSupplierDto) {
    return this.supplierService.updateSupplier(id, dto);
  }

  @Delete('/:id')
  deleteSupplier(@Param('id') id: string) {
    return this.supplierService.deleteSupplier(id);
  }
}
