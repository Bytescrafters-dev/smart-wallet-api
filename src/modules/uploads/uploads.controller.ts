import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../../common/auth';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from '../users/user.service';
import { UploadProductImageDto } from './dtos/upload-product-image.dto';
import { ProductsService } from '../products/products.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/uploads')
export class UploadsController {
  constructor(
    private readonly uploadService: UploadsService,
    private readonly usersService: UserService,
    private readonly productsService: ProductsService,
  ) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          //new MaxFileSizeValidator({ maxSize: 1000 }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const userId: string = req.user?.sub;

    const { url } = await this.uploadService.uploadAvatar(
      file.originalname,
      file.buffer,
    );

    this.usersService.updateUserById(userId, { avatar: url });

    return { message: 'Avatar updated successfully', avatarUrl: url };
  }

  @Post('product-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadProductImage(
    @Body() dto: UploadProductImageDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
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

    return {
      message: 'Product image uploaded successfully',
      image: productImage,
    };
  }
}
