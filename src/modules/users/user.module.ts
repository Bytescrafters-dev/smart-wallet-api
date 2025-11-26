import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TOKENS } from 'src/common/constants/tokens';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './infra/user.repository';
import { PlatformJwtModule } from '../auth/jwt.module';

@Module({
  imports: [ConfigModule, PlatformJwtModule],
  controllers: [UserController],
  providers: [
    UserService,
    { provide: TOKENS.UserRepo, useClass: UserRepository },
  ],
  exports: [TOKENS.UserRepo, UserService],
})
export class UsersModule {}
