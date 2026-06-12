import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from 'src/common/queues/queues.constants';
import { NotificationsService } from './notifications.service';
import { EmailProcessor } from './workers/email.processor';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.NOTIFICATIONS })],
  providers: [NotificationsService, EmailProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
