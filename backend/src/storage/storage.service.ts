import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import type { EnvConfig } from '../common/config/env.config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService<EnvConfig>) {
    const accountId = this.configService.get('R2_ACCOUNT_ID', { infer: true });
    this.bucket = this.configService.get('R2_BUCKET_NAME', { infer: true }) || '';
    this.publicUrl = this.configService.get('R2_PUBLIC_URL', { infer: true }) || '';

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get('R2_ACCESS_KEY_ID', { infer: true }) || '',
        secretAccessKey: this.configService.get('R2_SECRET_ACCESS_KEY', { infer: true }) || '',
      },
    });
  }

  async uploadFile(
    buffer: Buffer,
    folder: string,
    userId: string,
    ext: string,
    contentType: string,
  ): Promise<string> {
    const key = `${folder}/${userId}/${uuid()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const url = `${this.publicUrl}/${key}`;
    this.logger.log(`Uploaded: ${url}`);
    return url;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl.startsWith(this.publicUrl)) return;
    const key = fileUrl.replace(`${this.publicUrl}/`, '');

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    this.logger.log(`Deleted: ${key}`);
  }
}
