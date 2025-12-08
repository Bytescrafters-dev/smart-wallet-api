import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from 'src/common/auth';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { AddOptionDto } from './dtos/add-option.dto';
import { AddVariantDto } from './dtos/add-variant.dto';
import { CreateVariantsDto } from './dtos/create-variants.dto';
import { UpdateVariantDto } from './dtos/update-variant.dto';
import { UpdateProductVariantDto } from './dtos/update-product-variant.dto';
import { ProductVariantDto } from './dtos/product-variant.dto';

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

  @Get('product-variants/:productId/variants')
  @Roles('ADMIN')
  getProductVariants(@Param('productId') productId: string) {
    return this.productsService.getProductVariants(productId);
  }

  @Post('product-variants/:productId/variants/bulk')
  @Roles('ADMIN')
  createVariantsBulk(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantsDto,
  ) {
    return this.productsService.createVariantsBulk(productId, dto);
  }

  @Put('product-variants/:productId/variants/:variantId')
  @Roles('ADMIN')
  updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(productId, variantId, dto);
  }

  @Delete('product-variants/:productId/variants/:variantId')
  @Roles('ADMIN')
  deleteVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productsService.deleteVariant(productId, variantId);
  }

  @Patch('product-variants/:productId/variants/bulk-update')
  @Roles('ADMIN')
  bulkUpdateVariants(
    @Param('productId') productId: string,
    @Body() variants: ProductVariantDto[],
  ) {
    return this.productsService.bulkUpdateVariants(productId, variants);
  }
}
