import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { REDIS_BLOCK_CACHE, REDIS_METADATA_CACHE } from 'src/redis.providers';
import { S3Service } from 'src/s3/s3.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly httpService: HttpService,
    @Inject(REDIS_BLOCK_CACHE) private readonly blockCacheClient: Redis,
    @Inject(REDIS_METADATA_CACHE) private readonly metadataCacheClient: Redis,
    private readonly S3Service: S3Service
  ) {}

  async createPost(content: string): Promise<Post> {
    if (!content) {
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
      throw new Error(`Failed to create post: ${err}`);
    }
  }

  async getPost(hash: string) {
    try {
      this.incrementViews(hash)
      const cachedPost = await this.getCacheData(hash);
      if (cachedPost) {
        const cachedData = JSON.parse(cachedPost);
        cachedData.Body = Buffer.from(cachedData.Body, 'base64'); 
        return cachedData;
      }
      const post = await this.postRepository.findOne({ where: { hash } });
      if (post) {
        const fileContent = await this.S3Service.getFile(post.content);
        this.setCacheData(post,hash,fileContent)
        return fileContent;
      }
    } catch (err) {
      throw new Error('Failed to get post');
    }
  }

  private async getCacheData(hash:string) {
    const propulatPost = await this.metadataCacheClient.get(hash);
    if(propulatPost){
      console.log('fetch from popular cache')
      return propulatPost;
    }
    const cachedPost = await this.blockCacheClient.get(hash);
    if(cachedPost){
      console.log('fetch from block cache')
      return cachedPost;
    }
    return null
  }

  private async setCacheData(post: Post, hash:string, fileContent){

    const dataToCache = {
      Body: fileContent.Body.toString('base64'), 
      ContentType: fileContent.ContentType,
    };

    if(post.views > 10) {
      console.log('set from popular cache')
      await this.metadataCacheClient.set(
        hash,
        JSON.stringify(dataToCache),
        'EX',
        3600
      ); // Cache for 1 hour
      return
    }
    console.log('set from block cache')
    await this.blockCacheClient.set(
      hash,
      JSON.stringify(dataToCache),
      'EX',
      600
    ); // Cache for 10 minutes
    return
  }

  async incrementViews(hash: string): Promise<void> {
    try {
      const post = await this.postRepository.findOne({
        where: {hash}
      });
      if (post) {
        post.views++;
        await this.postRepository.save(post);
      }
    } catch (err) {
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
      throw new Error('Failed to get popular posts');
    }
  }


}
