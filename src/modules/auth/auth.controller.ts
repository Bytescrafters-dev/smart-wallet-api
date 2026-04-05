import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    const merge =
      dto.sessionId && dto.storeId
        ? { sessionId: dto.sessionId, storeId: dto.storeId }
        : undefined;
    return this.authService.login(dto.email, dto.password, merge);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh);
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.authService.revoke(dto.refresh);
  }
}
