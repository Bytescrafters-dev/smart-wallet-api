import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

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

  async uploadAvatar(fileName: string, file: Buffer) {
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

  async uploadProductImage(
    fileName: string,
    file: Buffer,
    productId: string,
  ) {
    const timestamp = Date.now();
    const key = `products/${productId}/${timestamp}-${fileName}`;

    // Extract image metadata
    const metadata = await sharp(file).metadata();
    const checksum = crypto.createHash('md5').update(file).digest('hex');

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: metadata.format
          ? `image/${metadata.format}`
          : 'application/octet-stream',
      }),
    );

    const url = this.buildPublicUrl(key);

    return {
      storageKey: key,
      url,
      width: metadata.width,
      height: metadata.height,
      mimeType: metadata.format ? `image/${metadata.format}` : null,
      bytes: file.length,
      checksum,
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );
  }
}
