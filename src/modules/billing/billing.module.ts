import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TOKENS } from 'src/common/constants/tokens';
import { PlatformJwtModule } from '../auth/jwt.module';
import { PlanPriceService } from './plan-price.service';
import { PlanPriceController } from './plan-price.controller';
import { PlanPriceRepository } from './infra/plan-price.repository';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionRepository } from './infra/subscription.repository';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceRepository } from './infra/invoice.repository';
import { BillingScheduler } from './billing.scheduler';

@Module({
  imports: [PlatformJwtModule, ScheduleModule.forRoot()],
  controllers: [PlanPriceController, SubscriptionController, InvoiceController],
  providers: [
    PlanPriceService,
    SubscriptionService,
    InvoiceService,
    BillingScheduler,
    { provide: TOKENS.PlanPriceRepo, useClass: PlanPriceRepository },
    { provide: TOKENS.SubscriptionRepo, useClass: SubscriptionRepository },
    { provide: TOKENS.InvoiceRepo, useClass: InvoiceRepository },
  ],
  exports: [PlanPriceService, SubscriptionService, InvoiceService],
})
export class BillingModule {}
