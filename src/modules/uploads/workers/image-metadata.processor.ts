import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import sharp from 'sharp';
import * as crypto from 'crypto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { QUEUES } from 'src/common/queues/queues.constants';

interface ImageMetadataJobData {
  imageId: string;
  storageKey: string;
}

@Processor(QUEUES.MEDIA)
export class ImageMetadataProcessor extends WorkerHost {
  private readonly s3Client: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
    });
  }

  async process(job: Job<ImageMetadataJobData>): Promise<void> {
    const { imageId, storageKey } = job.data;

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.configService.getOrThrow('S3_BUCKET'),
        Key: storageKey,
      }),
    );

    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    const metadata = await sharp(buffer).metadata();
    const checksum = crypto.createHash('md5').update(buffer).digest('hex');

    await this.prisma.productImage.update({
      where: { id: imageId },
      data: {
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        mimeType: metadata.format ? `image/${metadata.format}` : null,
        bytes: buffer.length,
        checksum,
        status: 'READY',
      },
    });
  }
}
