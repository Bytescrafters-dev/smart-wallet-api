/// <reference types="multer" />
import {
  Body,
  Controller,
  FileTypeValidator,
  Inject,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { UserService } from '../users/user.service';
import { ProductsService } from '../products/products.service';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { StoreUserGuard } from 'src/common/guards/store-user.guard';
import { UploadProductImageDto } from './dtos/upload-product-image.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IStoreUserRepository } from '../store-users/interfaces/store-user.repository.interface';

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
    @Inject(TOKENS.StoreUserRepo)
    private readonly storeUserRepo: IStoreUserRepository,
  ) {}

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

  // ── Product image (admin only) ─────────────────────────────────────────────

  @Post('admin/uploads/product-image')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadProductImage(
    @Body() dto: UploadProductImageDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const imageData = await this.uploadService.uploadProductImage(
      file.originalname,
      file.buffer,
      dto.productId,
    );

    const productImage = await this.productsService.addProductImage(
      dto.productId,
      {
        storageKey: imageData.storageKey,
        url: imageData.url,
        alt: dto.alt,
        isPrimary: dto.isPrimary ?? false,
        sortOrder: dto.sortOrder ?? 0,
        width: imageData.width,
        height: imageData.height,
        mimeType: imageData.mimeType ?? undefined,
        bytes: imageData.bytes,
        checksum: imageData.checksum,
      },
    );

    return { image: productImage };
  }
}
