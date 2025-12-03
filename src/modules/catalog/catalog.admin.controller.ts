import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateStoreDto } from './dtos/store.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from './dtos/category.dto';
import { CreateProductDto } from './dtos/product.dto';

@Controller('catalog')
export class CatalogAdminController {
  constructor(private readonly catelogService: CatalogService) {}

  //Stores
  @Post('stores')
  createStore(@Body() dto: CreateStoreDto) {
    return this.catelogService.createStore(dto);
  }

  //Categories
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catelogService.createCategory(dto);
  }

  @Get('stores/:storeId/categories')
  getCategories(
    @Param('storeId') storeId: string,
    @Query() query: CategoryQueryDto,
  ) {
    return this.catelogService.getCategories(storeId, query);
  }

  @Get('categories/:id')
  getCategoryById(@Param('id') id: string) {
    return this.catelogService.getCategoryById(id);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catelogService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.catelogService.deleteCategory(id);
  }

  //Products
  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catelogService.createProduct(dto);
  }

  @Post('products/:id/options')
  async addOption(@Param('id') productId: string, @Body() b: any) {
    return this.catelogService.addOption(productId, b);
  }

  @Post('products/:id/variants')
  async addVariant(@Param('id') productId: string, @Body() b: any) {
    return this.catelogService.addVariant(productId, b);
  }
}
