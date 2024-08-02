import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../redis.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]), // Import Post repository
    HttpModule, // Import HttpModule for HttpService
    RedisModule,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
