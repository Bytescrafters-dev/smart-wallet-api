import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TOKENS } from 'src/common/constants/tokens';
import { RolesGuard } from 'src/common/auth/index';
import { PlatformJwtModule } from '../auth/jwt.module';
import { UserController } from './user.controller';
import { UsersManagementController } from './users-management.controller';
import { UserService } from './user.service';
import { UserRepository } from './infra/user.repository';

@Module({
  imports: [ConfigModule, PlatformJwtModule],
  controllers: [UserController, UsersManagementController],
  providers: [
    UserService,
    RolesGuard,
    { provide: TOKENS.UserRepo, useClass: UserRepository },
  ],
  exports: [TOKENS.UserRepo, UserService],
})
export class UsersModule {}
