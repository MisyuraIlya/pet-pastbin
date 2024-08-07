import { Injectable, OnModuleInit } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly s3: AWS.S3;
  private readonly bucketName = 'my-bucket';

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: 'http://minio:9000',
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
    } catch (err) {
      if (err.code === 'NotFound') {
        await this.s3.createBucket({ Bucket: this.bucketName }).promise();
      } else {
        throw err;
      }
    }
  }

  async uploadFile(fileName: string, fileContent: Buffer) {
    if (!fileName || !fileContent) {
      throw new Error('File name and content are required for S3 upload.');
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: 'text/plain', 
    };

    return this.s3.upload(params).promise();
  }

  async getFile(filename: string) {
    const params = {
      Bucket: this.bucketName,
      Key: filename,
    };

    return this.s3.getObject(params).promise();
  }
}
