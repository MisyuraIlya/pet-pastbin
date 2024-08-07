import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../redis.module'; 
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]), 
    HttpModule,
    RedisModule,
    S3Module,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
