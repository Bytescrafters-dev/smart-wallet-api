import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PlatformJwtModule } from './jwt.module';
import { TOKENS } from 'src/common/constants/tokens';
import { RefreshTokenRepository } from './infra/refresh-token.repository';
import { StoreUserRefreshTokenRepository } from './infra/store-user-refresh-token.repository';
import { UsersModule } from '../users/user.module';
import { OrdersModule } from '../orders/orders.module';
import { StoresModule } from '../stores/stores.module';
import { StoreUsersModule } from '../store-users/store-users.module';

@Module({
  imports: [ConfigModule, PlatformJwtModule, UsersModule, OrdersModule, StoresModule, StoreUsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: TOKENS.RefreshTokenRepo, useClass: RefreshTokenRepository },
    { provide: TOKENS.StoreUserRefreshTokenRepo, useClass: StoreUserRefreshTokenRepository },
  ],
  exports: [AuthService],
})
export class AuthModule {}
