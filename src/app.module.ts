import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PlatformJwtModule } from './modules/auth/jwt.module';
import { UsersModule } from './modules/users/user.module';
import { StoresModule } from './modules/stores/stores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CatalogModule,
    AuthModule,
    PlatformJwtModule,
    UploadsModule,
    OrdersModule,
    UsersModule,
    StoresModule,
  ],
})
export class AppModule {}
