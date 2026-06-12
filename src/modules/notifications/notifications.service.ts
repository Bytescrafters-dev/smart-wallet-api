import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOBS, QUEUES } from 'src/common/queues/queues.constants';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue(QUEUES.NOTIFICATIONS) private readonly notificationsQueue: Queue,
  ) {}

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.notificationsQueue.add(
      JOBS.SEND_EMAIL,
      { to, subject, html },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );
  }
}
