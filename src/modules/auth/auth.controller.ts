import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') //tested
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh') //tested
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh);
  }

  @Post('logout') //test later with frontend
  logout(@Body() dto: RefreshDto) {
    return this.authService.revoke(dto.refresh);
  }
}
