import { Module } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { StoreUserRepository } from './infra/store-user.repository';
import { StoreUsersController } from './store-users.controller';
import { ConfigModule } from '@nestjs/config';
import { PlatformJwtModule } from '../auth/jwt.module';
import { StoreUsersService } from './store-users.service';

@Module({
  imports: [ConfigModule, PlatformJwtModule],
  providers: [
    StoreUsersService,
    { provide: TOKENS.StoreUserRepo, useClass: StoreUserRepository },
  ],
  controllers: [StoreUsersController],
  exports: [TOKENS.StoreUserRepo, StoreUsersService],
})
export class StoreUsersModule {}
