import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { REDIS_BLOCK_CACHE, REDIS_METADATA_CACHE } from 'src/redis.providers';
import { Client as MinioClient } from 'minio';
import { S3 } from 'aws-sdk';
import { S3Service } from 'src/s3/s3.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  private readonly s3: S3;
  private readonly bucketName: string = 'my-bucket';

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly httpService: HttpService,
    @Inject(REDIS_BLOCK_CACHE) private readonly blockCacheClient: Redis,
    @Inject(REDIS_METADATA_CACHE) private readonly metadataCacheClient: Redis,
    private readonly S3Service: S3Service
  ) {

  }



  async createPost(content: string): Promise<Post> {
    if (!content) {
      this.logger.error('Content is required to create a post.');
      throw new Error('Content is required to create a post.');
    }

    try {
      const response = await firstValueFrom(this.httpService.get(`${process.env.HASH_SERVICE_URL}/hash`));
      const hash = response.data.hash;
      const fileName = `${hash}.txt`;
      const fileContent = Buffer.from(content, 'utf-8');
      const fileLink = await this.S3Service.uploadFile(fileName, fileContent);
      const post = new Post();
      post.hash = hash;
      post.content = fileLink.Key;
      return this.postRepository.save(post);
    } catch (err) {
      this.logger.error(`Error creating post: ${err.message}`, err.stack);
      throw new Error('Failed to create post');
    }
  }

  async getPost(hash: string): Promise<Post> {
    try {
      // Try to get from metadata cache
      const cachedPost = await this.metadataCacheClient.get(hash);
      if (cachedPost) {
        return JSON.parse(cachedPost);
      }

      // Fetch from database
      const post = await this.postRepository.findOne({ where: { hash } });
      if (post) {
        // Cache the metadata
        await this.metadataCacheClient.set(hash, JSON.stringify(post), 'EX', 3600); // cache for 1 hour
      }

      return post;
    } catch (err) {
      this.logger.error(`Error getting post: ${err.message}`, err.stack);
      throw new Error('Failed to get post');
    }
  }

  async incrementViews(hash: string): Promise<void> {
    try {
      const post = await this.getPost(hash);
      if (post) {
        post.views++;
        await this.postRepository.save(post);
      }
    } catch (err) {
      this.logger.error(`Error incrementing views: ${err.message}`, err.stack);
      throw new Error('Failed to increment views');
    }
  }

  async getPopularPosts(): Promise<Post[]> {
    try {
      return this.postRepository.find({
        order: { views: 'DESC' },
        take: 10,
      });
    } catch (err) {
      this.logger.error(`Error getting popular posts: ${err.message}`, err.stack);
      throw new Error('Failed to get popular posts');
    }
  }


}
