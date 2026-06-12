/// <reference types="multer" />
import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Inject,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ProductImageStatus } from '@prisma/client';
import { UploadsService } from './uploads.service';
import { UserService } from '../users/user.service';
import { ProductsService } from '../products/products.service';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { StoreUserGuard } from 'src/common/guards/store-user.guard';
import { PresignProductImageDto } from './dtos/presign-product-image.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IStoreUserRepository } from '../store-users/interfaces/store-user.repository.interface';
import { SuperAdminAuthService } from '../super-admin/super-admin-auth.service';
import { SuperAdminGuard } from 'src/common/guards/super-admin.guard';
import { JOBS, QUEUES } from 'src/common/queues/queues.constants';

const AVATAR_PIPE = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
    new FileTypeValidator({ fileType: /(jpeg|jpg|png)$/ }),
  ],
});

@Controller()
export class UploadsController {
  constructor(
    private readonly uploadService: UploadsService,
    private readonly userService: UserService,
    private readonly productsService: ProductsService,
    private readonly superAdminService: SuperAdminAuthService,
    @Inject(TOKENS.StoreUserRepo)
    private readonly storeUserRepo: IStoreUserRepository,
    @InjectQueue(QUEUES.MEDIA)
    private readonly mediaQueue: Queue,
  ) {}

  // ── Super admin avatar ───────────────────────────────────────────────────────────

  @Post('super-admin/uploads/avatar')
  @UseGuards(SuperAdminGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadSuperAdminAvatar(
    @Req() req: any,
    @UploadedFile(AVATAR_PIPE) file: Express.Multer.File,
  ) {
    const userId: string = req.user.sub;
    const { url } = await this.uploadService.uploadAvatar(
      file.originalname,
      file.buffer,
      `super-admins/${userId}`,
    );
    await this.superAdminService.updateAvatar(userId, url);
    return { avatarUrl: url };
  }

  // ── Admin avatar ───────────────────────────────────────────────────────────

  @Post('admin/uploads/avatar')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAdminAvatar(
    @Req() req: any,
    @UploadedFile(AVATAR_PIPE) file: Express.Multer.File,
  ) {
    const userId: string = req.user.sub;
    const { url } = await this.uploadService.uploadAvatar(
      file.originalname,
      file.buffer,
      `admins/${userId}`,
    );
    await this.userService.updateAvatar(userId, url);
    return { avatarUrl: url };
  }

  // ── Store user avatar ──────────────────────────────────────────────────────

  @Post('store/uploads/avatar')
  @UseGuards(StoreUserGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadStoreUserAvatar(
    @Req() req: any,
    @UploadedFile(AVATAR_PIPE) file: Express.Multer.File,
  ) {
    const storeUserId: string = req.user.sub;
    const { url } = await this.uploadService.uploadAvatar(
      file.originalname,
      file.buffer,
      `store-users/${storeUserId}`,
    );
    await this.storeUserRepo.updateAvatar(storeUserId, url);
    return { avatarUrl: url };
  }

  // ── Product image presign (admin only) ────────────────────────────────────

  @Post('admin/uploads/product-image/presign')
  @UseGuards(AdminGuard)
  async presignProductImage(@Body() dto: PresignProductImageDto) {
    const { key, url, uploadUrl, fields } =
      await this.uploadService.presignProductImage(
        dto.productId,
        dto.fileName,
        dto.mimeType,
      );

    const image = await this.productsService.createPendingImage(dto.productId, {
      storageKey: key,
      url,
      alt: dto.alt,
      isPrimary: dto.isPrimary ?? false,
      sortOrder: dto.sortOrder ?? 0,
    });

    return { imageId: image.id, uploadUrl, uploadFields: fields, finalUrl: url };
  }

  @Post('admin/uploads/product-image/:imageId/confirm')
  @UseGuards(AdminGuard)
  async confirmProductImage(@Param('imageId') imageId: string) {
    const image = await this.productsService.findImageById(imageId);
    if (!image) throw new NotFoundException('Image not found');
    if (image.status !== ProductImageStatus.PENDING) {
      throw new BadRequestException('Image is not in a pending state');
    }

    await this.mediaQueue.add(JOBS.IMAGE_METADATA, {
      imageId: image.id,
      storageKey: image.storageKey,
    });

    return { image };
  }

}
