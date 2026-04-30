import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { StockOrdersService } from './stock-orders.service';
import { CreateStockOrderDto } from './dtos/create-stock-order.dto';
import { UpdateStockOrderDto } from './dtos/update-stock-order.dto';
import { ReceiveStockOrderDto } from './dtos/receive-stock-order.dto';
import { StockOrdersQueryDto } from './dtos/stock-orders-query.dto';

@Controller('stock-orders')
@UseGuards(AdminGuard)
export class StockOrdersController {
  constructor(private readonly stockOrdersService: StockOrdersService) {}

  @Post()
  create(@Body() dto: CreateStockOrderDto, @Req() req: any) {
    return this.stockOrdersService.create(dto, req.user.sub);
  }

  @Get('/store/:storeId')
  list(@Param('storeId') storeId: string, @Query() query: StockOrdersQueryDto) {
    return this.stockOrdersService.list(storeId, query);
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.stockOrdersService.findOne(id);
  }

  @Patch('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateStockOrderDto) {
    return this.stockOrdersService.update(id, dto);
  }

  @Patch('/:id/receive')
  receive(
    @Param('id') id: string,
    @Body() dto: ReceiveStockOrderDto,
    @Req() req: any,
  ) {
    return this.stockOrdersService.receive(id, dto, req.user.sub);
  }

  @Patch('/:id/reject')
  reject(@Param('id') id: string, @Req() req: any) {
    return this.stockOrdersService.reject(id, req.user.sub);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.stockOrdersService.remove(id);
  }
}
