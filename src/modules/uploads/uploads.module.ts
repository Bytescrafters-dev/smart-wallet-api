import { Module, forwardRef } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/user.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ConfigModule, UsersModule, forwardRef(() => ProductsModule)],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
