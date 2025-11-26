import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.getOrThrow('AWS_REGION');
    this.bucket = this.configService.getOrThrow('S3_BUCKET');
    this.s3Client = new S3Client({
      region: this.region,
    });
  }

  private buildPublicUrl(key: string): string {
    // Otherwise, direct S3 URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async upload(fileName: string, file: Buffer) {
    const key = `avatars/${Date.now()}-${fileName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.getOrThrow('S3_BUCKET'),
        Key: key,
        Body: file,
      }),
    );

    const url = this.buildPublicUrl(key);

    return { key, url };
  }
}
