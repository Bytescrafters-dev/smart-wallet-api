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

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/uploads')
export class UploadsController {
  constructor(
    private readonly uploadService: UploadsService,
    private readonly usersService: UserService,
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

    const { url } = await this.uploadService.upload(
      file.originalname,
      file.buffer,
    );

    this.usersService.updateUserById(userId, { avatar: url });

    return { message: 'Avatar updated successfully', avatarUrl: url };
  }
}
