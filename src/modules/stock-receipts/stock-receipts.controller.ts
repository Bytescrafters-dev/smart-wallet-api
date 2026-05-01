import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { StockReceiptsService } from './stock-receipts.service';
import { CreateStockReceiptDto } from './dtos/create-stock-receipt.dto';
import { StockReceiptsQueryDto } from './dtos/stock-receipts-query.dto';

@Controller('stock-receipts')
@UseGuards(AdminGuard)
export class StockReceiptsController {
  constructor(private readonly stockReceiptsService: StockReceiptsService) {}

  @Post()
  create(@Body() dto: CreateStockReceiptDto, @Req() req: any) {
    return this.stockReceiptsService.create(dto, req.user.sub);
  }

  @Get('/store/:storeId')
  list(
    @Param('storeId') storeId: string,
    @Query() query: StockReceiptsQueryDto,
  ) {
    return this.stockReceiptsService.list(storeId, query);
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.stockReceiptsService.findOne(id);
  }
}
