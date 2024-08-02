import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { REDIS_BLOCK_CACHE, REDIS_METADATA_CACHE } from 'src/redis.providers';
import { Inject } from '@nestjs/common';
@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private httpService: HttpService,
    @Inject(REDIS_BLOCK_CACHE) private readonly blockCacheClient: Redis,
    @Inject(REDIS_METADATA_CACHE) private readonly metadataCacheClient: Redis,
  ) {}

  async createPost(content: string): Promise<Post> {
    // Call hash generator service to get unique hash
    const response = await this.httpService
      .post(`${process.env.HASH_SERVICE_URL}/generate`, {})
      .toPromise();

    const hash = response.data.hash;
    // const hash = '123'

    const post = new Post();
    post.hash = hash;
    post.content = content;

    return this.postRepository.save(post);
  }

  async getPost(hash: string): Promise<Post> {
    // Try to get from metadata cache
    const cachedPost = await this.metadataCacheClient.get(hash);
    console.log('cachedPost',cachedPost,this.metadataCacheClient.condition)
    if (cachedPost) {
      return JSON.parse(cachedPost);
    }

    const post = await this.postRepository.findOne({ where:{hash} });

    if (post) {
      // Cache the metadata
      await this.metadataCacheClient.set(hash, JSON.stringify(post), 'EX', 3600); // cache for 1 hour
    }

    return post;
  }

  async incrementViews(hash: string): Promise<void> {
    const post = await this.getPost(hash);
    if (post) {
      post.views++;
      await this.postRepository.save(post);
    }
  }

  async getPopularPosts(): Promise<Post[]> {
    return this.postRepository.find({
      order: { views: 'DESC' },
      take: 10,
    });
  }
}
