import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { PlatformJwtModule } from './jwt.module';
import { TOKENS } from 'src/common/constants/tokens';
import { RefreshTokenRepository } from './infra/refresh-token.repository';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [ConfigModule, PlatformJwtModule, UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: TOKENS.RefreshTokenRepo, useClass: RefreshTokenRepository },
  ],
  exports: [AuthService],
})
export class AuthModule {}
