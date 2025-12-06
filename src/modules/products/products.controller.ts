import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from 'src/common/auth';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { AddOptionDto } from './dtos/add-option.dto';
import { AddVariantDto } from './dtos/add-variant.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('ADMIN')
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Get(':id')
  @Roles('ADMIN')
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Get('store/:storeId')
  @Roles('ADMIN')
  getAllProducts(
    @Param('storeId') storeId: string,
    @Query('title') title?: string,
    @Query('slug') slug?: string,
    @Query('categoryId') categoryId?: string,
    @Query('profileId') profileId?: string,
    @Query('active') active?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.getAllProducts(storeId, {
      title,
      slug,
      categoryId,
      profileId,
      active: active ? active === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get(':storeSlug/:productSlug')
  getBySlug(
    @Param('storeSlug') storeSlug: string,
    @Param('productSlug') productSlug: string,
    @Query('currency') currency?: string,
  ) {
    return this.productsService.getBySlug(storeSlug, productSlug, currency);
  }

  @Post('product-options/:id/options')
  @Roles('ADMIN')
  addOption(@Param('id') productId: string, @Body() dto: AddOptionDto) {
    return this.productsService.addOption(productId, dto);
  }

  @Get('product-options/:productId/options')
  @Roles('ADMIN')
  getAllProductOptionsByProductId(@Param('productId') productId: string) {
    return this.productsService.getAllProductOptionsByProductId(productId);
  }

  @Get('product-options/:productId/options/:optionId')
  @Roles('ADMIN')
  getProductOptionById(
    @Param('productId') productId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.productsService.getProductOptionById(productId, optionId);
  }

  @Delete('product-options/:productId/options/:optionId')
  @Roles('ADMIN')
  deleteProductOptionById(
    @Param('productId') productId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.productsService.deleteProductOptionById(productId, optionId);
  }

  @Post(':id/variants')
  @Roles('ADMIN')
  addVariant(@Param('id') productId: string, @Body() dto: AddVariantDto) {
    return this.productsService.addVariant(productId, dto);
  }
}
