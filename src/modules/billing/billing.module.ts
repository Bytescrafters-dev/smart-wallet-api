import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { TOKENS } from 'src/common/constants/tokens';
import { QUEUES } from 'src/common/queues/queues.constants';
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
import { BillingProcessor } from './workers/billing.processor';

@Module({
  imports: [
    PlatformJwtModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: QUEUES.BILLING }),
  ],
  controllers: [PlanPriceController, SubscriptionController, InvoiceController],
  providers: [
    PlanPriceService,
    SubscriptionService,
    InvoiceService,
    BillingScheduler,
    BillingProcessor,
    { provide: TOKENS.PlanPriceRepo, useClass: PlanPriceRepository },
    { provide: TOKENS.SubscriptionRepo, useClass: SubscriptionRepository },
    { provide: TOKENS.InvoiceRepo, useClass: InvoiceRepository },
  ],
  exports: [PlanPriceService, SubscriptionService, InvoiceService],
})
export class BillingModule {}
