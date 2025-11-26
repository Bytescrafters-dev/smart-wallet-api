import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('stores/:storeSlug/products')
export class CatalogController {
  constructor(private svc: CatalogService) {}

  @Get(':productSlug')
  get(
    @Param('storeSlug') storeSlug: string,
    @Param('productSlug') productSlug: string,
    @Query('currency') currency?: string,
  ) {
    return this.svc.getBySlug(storeSlug, productSlug, currency);
  }
}
