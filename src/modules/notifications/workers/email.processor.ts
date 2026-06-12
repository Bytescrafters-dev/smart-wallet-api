import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Job } from 'bullmq';
import { QUEUES } from 'src/common/queues/queues.constants';

interface SendEmailJobData {
  to: string;
  subject: string;
  html: string;
}

@Processor(QUEUES.NOTIFICATIONS)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly sesClient: SESClient;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.sesClient = new SESClient({
      region: this.configService.getOrThrow('AWS_REGION'),
    });
    this.fromAddress = this.configService.getOrThrow('SES_FROM_ADDRESS');
  }

  async process(job: Job<SendEmailJobData>): Promise<void> {
    const { to, subject, html } = job.data;

    await this.sesClient.send(
      new SendEmailCommand({
        Source: this.fromAddress,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      }),
    );

    this.logger.log(`Email sent to ${to}: ${subject}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Email job ${job.id} failed after ${job.attemptsMade} attempt(s): ${error.message}`);
  }
}
