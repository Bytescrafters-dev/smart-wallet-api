import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/user.module';
import { ProductsModule } from '../products/products.module';
import { StoreUsersModule } from '../store-users/store-users.module';
import { PlatformJwtModule } from '../auth/jwt.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { ImageMetadataProcessor } from './workers/image-metadata.processor';
import { QUEUES } from 'src/common/queues/queues.constants';

@Module({
  imports: [
    ConfigModule,
    PlatformJwtModule,
    UsersModule,
    StoreUsersModule,
    SuperAdminModule,
    forwardRef(() => ProductsModule),
    BullModule.registerQueue({ name: QUEUES.MEDIA }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService, ImageMetadataProcessor],
  exports: [UploadsService],
})
export class UploadsModule {}
