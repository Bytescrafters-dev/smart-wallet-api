import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CategoryQueryDto } from './dtos/category-query.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(AdminGuard)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Get('stores/:storeId')
  @UseGuards(AdminGuard)
  getCategories(
    @Param('storeId') storeId: string,
    @Query() query: CategoryQueryDto,
  ) {
    return this.categoriesService.getCategories(storeId, query);
  }

  @Get('stores/:storeSlug/slug')
  getCategoriesByStoreSlug(
    @Param('storeSlug') storeSlug: string,
    @Query() query: CategoryQueryDto,
  ) {
    return this.categoriesService.getCategoriesByStoreSlug(storeSlug, query);
  }

  @Get(':id')
  getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
