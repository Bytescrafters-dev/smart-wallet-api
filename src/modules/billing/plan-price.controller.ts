import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from 'src/common/guards/super-admin.guard';
import { PlanPriceService } from './plan-price.service';
import { CreatePlanPriceDto } from './dtos/create-plan-price.dto';
import { UpdatePlanPriceDto } from './dtos/update-plan-price.dto';
import { ListPlanPricesQueryDto } from './dtos/list-plan-prices-query.dto';

@Controller('super-admin/plan-prices')
@UseGuards(SuperAdminGuard)
export class PlanPriceController {
  constructor(private readonly planPriceService: PlanPriceService) {}

  @Post()
  create(@Body() dto: CreatePlanPriceDto) {
    return this.planPriceService.create(dto);
  }

  @Get()
  list(@Query() query: ListPlanPricesQueryDto) {
    return this.planPriceService.list(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanPriceDto) {
    return this.planPriceService.update(id, dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.planPriceService.getById(id);
  }
}
