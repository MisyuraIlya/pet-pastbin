import { Injectable, OnModuleInit } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly s3: AWS.S3;
  constructor() {
    this.s3 = new AWS.S3({
      endpoint: `${process.env.MINIO_ENDPOINT}`,
      accessKeyId: `${process.env.MINIO_ACCESS_KEY_ID}`,
      secretAccessKey: `${process.env.MINIO_SECRET_ACCESS_KEY}`,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3.headBucket({ Bucket: `${process.env.MINIO_BUCKET_NAME}` }).promise();
    } catch (err) {
      if (err.code === 'NotFound') {
        await this.s3.createBucket({ Bucket:`${process.env.MINIO_BUCKET_NAME}`}).promise();
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
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: 'text/plain', 
    };

    return this.s3.upload(params).promise();
  }

  async getFile(filename: string) {
    const params = {
      Bucket: `${process.env.MINIO_BUCKET_NAME}`,
      Key: filename,
    };
    
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    await sleep(3000);
    
    return this.s3.getObject(params).promise();
  }
}
