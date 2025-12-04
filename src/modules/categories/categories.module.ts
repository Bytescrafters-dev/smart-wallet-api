import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TOKENS } from 'src/common/constants/tokens';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryRepository } from './infra/category.repository';
import { PlatformJwtModule } from '../auth/jwt.module';

@Module({
  imports: [ConfigModule, PlatformJwtModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    { provide: TOKENS.CategoryRepo, useClass: CategoryRepository },
  ],
  exports: [TOKENS.CategoryRepo, CategoriesService],
})
export class CategoriesModule {}