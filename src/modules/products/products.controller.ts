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
import { AdminGuard } from 'src/common/guards/admin.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { AddOptionDto } from './dtos/add-option.dto';
import { AddVariantDto } from './dtos/add-variant.dto';
import { CreateVariantsDto } from './dtos/create-variants.dto';
import { UpdateProductVariantDto } from './dtos/update-product-variant.dto';
import { ProductVariantDto } from './dtos/product-variant.dto';
import { UpdateProductImageDto } from './dtos/update-product-image.dto';
import { ReorderImagesDto } from './dtos/reorder-images.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(AdminGuard)
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Get(':id')
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }

  @Get('store/:storeSlug')
  getAllProducts(
    @Param('storeSlug') storeSlug: string,
    @Query('title') title?: string,
    @Query('slug') slug?: string,
    @Query('categoryId') categoryId?: string,
    @Query('profileId') profileId?: string,
    @Query('active') active?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('currency') currency?: string,
  ) {
    return this.productsService.getAllProducts(storeSlug, {
      title,
      slug,
      categoryId,
      profileId,
      active: active ? active === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      currency,
    });
  }

  @Get('store/search-all/:storeSlug')
  searchAllProducts(
    @Param('storeSlug') storeSlug: string,
    @Query('search') q: string,
  ) {
    return this.productsService.searchAllProducts(storeSlug, q);
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
  @UseGuards(AdminGuard)
  addOption(@Param('id') productId: string, @Body() dto: AddOptionDto) {
    return this.productsService.addOption(productId, dto);
  }

  @Get('product-options/:productId/options')
  @UseGuards(AdminGuard)
  getAllProductOptionsByProductId(@Param('productId') productId: string) {
    return this.productsService.getAllProductOptionsByProductId(productId);
  }

  @Get('product-options/:productId/options/:optionId')
  @UseGuards(AdminGuard)
  getProductOptionById(
    @Param('productId') productId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.productsService.getProductOptionById(productId, optionId);
  }

  @Delete('product-options/:productId/options/:optionId')
  @UseGuards(AdminGuard)
  deleteProductOptionById(
    @Param('productId') productId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.productsService.deleteProductOptionById(productId, optionId);
  }

  @Post(':id/variants')
  @UseGuards(AdminGuard)
  addVariant(@Param('id') productId: string, @Body() dto: AddVariantDto) {
    return this.productsService.addVariant(productId, dto);
  }

  @Get('product-variants/:productId/variants')
  @UseGuards(AdminGuard)
  getProductVariants(@Param('productId') productId: string) {
    return this.productsService.getProductVariants(productId);
  }

  @Post('product-variants/:productId/variants/bulk')
  @UseGuards(AdminGuard)
  createVariantsBulk(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantsDto,
  ) {
    return this.productsService.createVariantsBulk(productId, dto);
  }

  @Put('product-variants/:productId/variants/:variantId')
  @UseGuards(AdminGuard)
  updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(productId, variantId, dto);
  }

  @Delete('product-variants/:productId/variants/:variantId')
  @UseGuards(AdminGuard)
  deleteVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productsService.deleteVariant(productId, variantId);
  }

  @Patch('product-variants/:productId/variants/bulk-update')
  @UseGuards(AdminGuard)
  bulkUpdateVariants(
    @Param('productId') productId: string,
    @Body() variants: ProductVariantDto[],
  ) {
    return this.productsService.bulkUpdateVariants(productId, variants);
  }

  @Get('product-images/:productId/images')
  @UseGuards(AdminGuard)
  getProductImages(@Param('productId') productId: string) {
    return this.productsService.getProductImages(productId);
  }

  @Delete('product-images/:productId/images/:imageId')
  @UseGuards(AdminGuard)
  deleteProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.deleteProductImage(productId, imageId);
  }

  @Patch('product-images/:productId/images/reorder')
  @UseGuards(AdminGuard)
  reorderProductImages(
    @Param('productId') productId: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.productsService.reorderProductImages(productId, dto.images);
  }

  @Patch('product-images/:productId/images/:imageId')
  @UseGuards(AdminGuard)
  updateProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productsService.updateProductImage(productId, imageId, dto);
  }
}
