import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PlatformJwtModule } from './modules/auth/jwt.module';
import { UsersModule } from './modules/users/user.module';
import { StoresModule } from './modules/stores/stores.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PlatformJwtModule,
    UploadsModule,
    OrdersModule,
    UsersModule,
    StoresModule,
    CategoriesModule,
    ProductsModule,
  ],
})
export class AppModule {}
