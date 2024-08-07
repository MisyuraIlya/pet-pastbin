import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async createPost(@Body('content') content: string) {
    return this.postService.createPost(content);
  }

  @Get(':hash')
  async getPost(@Param('hash') hash: string) {
    return this.postService.getPost(hash);
  }

  @Patch(':hash/views')
  async incrementViews(@Param('hash') hash: string) {
    return this.postService.incrementViews(hash);
  }

  @Get('popular')
  async getPopularPosts() {
    return this.postService.getPopularPosts();
  }


}
