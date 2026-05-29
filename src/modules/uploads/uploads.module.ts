import { Module, forwardRef } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/user.module';
import { ProductsModule } from '../products/products.module';
import { StoreUsersModule } from '../store-users/store-users.module';
import { PlatformJwtModule } from '../auth/jwt.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';

@Module({
  imports: [
    ConfigModule,
    PlatformJwtModule,
    UsersModule,
    StoreUsersModule,
    SuperAdminModule,
    forwardRef(() => ProductsModule),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
