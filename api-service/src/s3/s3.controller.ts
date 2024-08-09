import { Controller, Post, UploadedFile, UseInterceptors, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';
import { Response } from 'express';

@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException('No file uploaded.', HttpStatus.BAD_REQUEST);
    }

    try {
      const data = await this.s3Service.uploadFile('asdas',file);
      return data;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('file/:filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const data = await this.s3Service.getFile(filename);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', data.ContentType);
      res.send(data.Body);
    } catch (err) {
      if (err.code === 'NoSuchKey') {
        throw new HttpException('File not found.', HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
