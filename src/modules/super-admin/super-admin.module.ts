import { Module } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { PlatformJwtModule } from '../auth/jwt.module';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { SuperAdminAuthController } from './super-admin-auth.controller';
import { SuperAdminRepository } from './infra/super-admin.repository';
import { SuperAdminRefreshTokenRepository } from './infra/super-admin-refresh-token.repository';

@Module({
  imports: [PlatformJwtModule],
  controllers: [SuperAdminAuthController],
  providers: [
    SuperAdminAuthService,
    { provide: TOKENS.SuperAdminRepo, useClass: SuperAdminRepository },
    {
      provide: TOKENS.SuperAdminRefreshTokenRepo,
      useClass: SuperAdminRefreshTokenRepository,
    },
  ],
  exports: [SuperAdminAuthService],
})
export class SuperAdminModule {}
