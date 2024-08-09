import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Res, HttpException, HttpStatus } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async createPost(@Body('content') content: string) {
    return this.postService.createPost(content);
  }

  @Get(':hash')
  async getPost(@Param('hash') hash: string, @Res() res: Response) {
    try {
      const data = await this.postService.getPost(hash);
      res.setHeader('Content-Disposition', `attachment; filename=${hash}`);
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
  @Get('popular')
  async getPopularPosts() {
    return this.postService.getPopularPosts();
  }


}
