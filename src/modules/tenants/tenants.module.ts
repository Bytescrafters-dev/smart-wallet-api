import { Module } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { PlatformJwtModule } from '../auth/jwt.module';
import { TenantService } from './tenant.service';
import { TenantsController } from './tenants.controller';
import { TenantRepository } from './infra/tenant.repository';
import { RefreshTokenRepository } from '../auth/infra/refresh-token.repository';

@Module({
  imports: [PlatformJwtModule],
  controllers: [TenantsController],
  providers: [
    TenantService,
    { provide: TOKENS.TenantRepo, useClass: TenantRepository },
    { provide: TOKENS.RefreshTokenRepo, useClass: RefreshTokenRepository },
  ],
  exports: [TenantService, { provide: TOKENS.TenantRepo, useClass: TenantRepository }],
})
export class TenantsModule {}
