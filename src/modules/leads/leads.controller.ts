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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dtos/create-lead.dto';
import { UpdateLeadDto } from './dtos/update-lead.dto';
import { BulkCreateLeadsDto } from './dtos/bulk-create-leads.dto';
import { LeadsQueryDto } from './dtos/leads-query.dto';

@Controller('leads')
@UseGuards(AdminGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('/store/:storeSlug')
  create(@Param('storeSlug') storeSlug: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(storeSlug, dto);
  }

  @Post('/store/:storeSlug/bulk')
  bulkCreate(
    @Param('storeSlug') storeSlug: string,
    @Body() dto: BulkCreateLeadsDto,
  ) {
    return this.leadsService.bulkCreate(storeSlug, dto);
  }

  @Get('/store/:storeSlug')
  list(@Param('storeSlug') storeSlug: string, @Query() query: LeadsQueryDto) {
    return this.leadsService.list(storeSlug, query);
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}
