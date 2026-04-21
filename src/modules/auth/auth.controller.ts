import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';
import { SignupDto } from './dtos/signup.dto';

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
