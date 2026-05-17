import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';
import { SignupDto } from './dtos/signup.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Post('admin/login')
  adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }

  @Post('admin/refresh')
  adminRefresh(@Body() dto: RefreshDto) {
    return this.authService.adminRefresh(dto.refresh);
  }

  @Post('admin/logout')
  adminLogout(@Body() dto: RefreshDto) {
    return this.authService.adminRevoke(dto.refresh);
  }

  @Post('admin/change-password')
  @UseGuards(AdminGuard)
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
    return this.authService.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // ── Store User ─────────────────────────────────────────────────────────────

  @Post('store/:storeSlug/login')
  storeLogin(
    @Param('storeSlug') storeSlug: string,
    @Body() dto: LoginDto,
    @Req() req: Request,
  ) {
    const sessionId: string | undefined = req.cookies?.['sid'];

    return this.authService.storeUserLogin(
      dto.email,
      dto.password,
      storeSlug,
      sessionId ? { sessionId } : undefined,
    );
  }

  @Post('store/:storeSlug/signup')
  storeSignup(@Param('storeSlug') storeSlug: string, @Body() dto: SignupDto) {
    return this.authService.storeUserSignup(storeSlug, {
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  @Post('store/refresh')
  storeRefresh(@Body() dto: RefreshDto) {
    return this.authService.storeUserRefresh(dto.refresh);
  }

  @Post('store/logout')
  storeLogout(@Body() dto: RefreshDto) {
    return this.authService.storeUserRevoke(dto.refresh);
  }
}
