import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';
import { Roles, RolesGuard } from 'src/common/auth';
import { AdminRole } from '@prisma/client';

@Controller('stores')
@UseGuards(AdminGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @UseGuards(RolesGuard)
  @Roles(AdminRole.OWNER)
  @Post()
  createStore(@Body() data: CreateStoreDto, @Req() req: any) {
    return this.storesService.createStore(data, req.user.sub);
  }

  @Get()
  getAllStores(@Req() req: any) {
    return this.storesService.getAllStores(req.user?.sub);
  }

  @Get(':id')
  getStoreById(@Param('id') id: string) {
    return this.storesService.getStoreById(id);
  }

  @Patch(':id')
  updateStore(@Param('id') id: string, @Body() data: UpdateStoreDto) {
    return this.storesService.updateStore(id, data);
  }

  @Delete(':id')
  deleteStore(@Param('id') id: string) {
    return this.storesService.deleteStore(id);
  }
}
