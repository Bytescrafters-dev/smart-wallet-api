import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Patch,
} from '@nestjs/common';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { LoginDto } from '../auth/dtos/login.dto';
import { RefreshDto } from '../auth/dtos/refresh.dto';
import { ChangePasswordDto } from '../auth/dtos/change-password.dto';
import { SuperAdminGuard } from 'src/common/guards/super-admin.guard';
import { UpdateAdminUserDto } from './dtos/update-admin-user.dto';

@Controller('super-admin')
export class SuperAdminAuthController {
  constructor(private readonly authService: SuperAdminAuthService) {}

  @Post('auth/login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('auth/refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh);
  }

  @Post('auth/logout')
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refresh);
  }

  @Post('auth/change-password')
  @UseGuards(SuperAdminGuard)
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
    return this.authService.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Get('my-profile')
  @UseGuards(SuperAdminGuard)
  getMyProfile(@Req() req: any) {
    return this.authService.getAdminUserById(req.user.sub);
  }

  @Patch('my-profile')
  @UseGuards(SuperAdminGuard)
  updateMyProfile(@Req() req: any, @Body() dto: UpdateAdminUserDto) {
    return this.authService.updateProfile(req.user.sub, dto);
  }
}
