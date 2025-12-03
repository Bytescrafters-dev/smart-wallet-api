import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TOKENS } from 'src/common/constants/tokens';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { StoreRepository } from './infra/store.repository';
import { PlatformJwtModule } from '../auth/jwt.module';

@Module({
  imports: [ConfigModule, PlatformJwtModule],
  controllers: [StoresController],
  providers: [
    StoresService,
    { provide: TOKENS.StoreRepo, useClass: StoreRepository },
  ],
  exports: [TOKENS.StoreRepo, StoresService],
})
export class StoresModule {}