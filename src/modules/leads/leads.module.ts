import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TOKENS } from 'src/common/constants/tokens';
import { PlatformJwtModule } from '../auth/jwt.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadRepository } from './infra/lead.repository';
import { StoreRepository } from '../stores/infra/store.repository';

@Module({
  imports: [ConfigModule, PlatformJwtModule],
  controllers: [LeadsController],
  providers: [
    LeadsService,
    { provide: TOKENS.LeadRepo, useClass: LeadRepository },
    { provide: TOKENS.StoreRepo, useClass: StoreRepository },
  ],
})
export class LeadsModule {}
