import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from 'src/common/auth';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles('ADMIN')
  createStore(@Body() data: CreateStoreDto) {
    return this.storesService.createStore(data);
  }

  @Get()
  @Roles('ADMIN')
  getAllStores() {
    console.log('came here');
    return this.storesService.getAllStores();
  }

  @Get(':id')
  getStoreById(@Param('id') id: string) {
    return this.storesService.getStoreById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  updateStore(@Param('id') id: string, @Body() data: UpdateStoreDto) {
    return this.storesService.updateStore(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  deleteStore(@Param('id') id: string) {
    return this.storesService.deleteStore(id);
  }
}
