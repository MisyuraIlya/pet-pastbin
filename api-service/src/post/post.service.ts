import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { REDIS_BLOCK_CACHE, REDIS_METADATA_CACHE } from 'src/redis.providers';
import { Inject } from '@nestjs/common';
import { Client as MinioClient } from 'minio';

@Injectable()
export class PostService {
  private minioClient: MinioClient;

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private httpService: HttpService,
    @Inject(REDIS_BLOCK_CACHE) private readonly blockCacheClient: Redis,
    @Inject(REDIS_METADATA_CACHE) private readonly metadataCacheClient: Redis,
  ) {
    this.minioClient = new MinioClient({
      endPoint:'s3_service', // or the actual MinIO hostname/IP
      port: 9000, // or the actual MinIO port
      useSSL: false, // set to true if using HTTPS
      accessKey: 'e5CWAMw2jSSwUowDsNZKs',
      secretKey: '8Pz2GOxLf0OKWr6pvnRv5pVQmxY2q38UgPsnI0lfs',
    });

    this.testMinioConnection()
    
  }
  async testMinioConnection() {
    try {
      // Example: List buckets to verify connection
      const buckets = await this.minioClient.listBuckets();
      console.log('Connected successfully. Buckets:', buckets);
    } catch (error) {
      console.error('Failed to connect to MinIO:', error);
    }
  }


  async createPost(content: string): Promise<Post> {
    const response = await this.httpService
      .get(`${process.env.HASH_SERVICE_URL}/hash`, {})
      .toPromise();
    const hash = response.data.hash;

    // Create a unique filename
    const fileName = `${hash}.txt`;
    const bucketName = process.env.MINIO_BUCKET_NAME;
    console.log('bucketName',bucketName)
    try {
      await this.minioClient.bucketExists(bucketName);
    } catch (error) {
      console.error('Error checking bucket existence:', error);
      throw new Error('Bucket does not exist');
    }
  
    // Upload the file to MinIO
    try {
      await this.minioClient.putObject(bucketName, fileName, content);
    } catch (error) {
      console.error('Error uploading to MinIO:', error);
      throw new Error('Failed to upload content to MinIO');
    }

    // Construct the link to the file
    const fileLink = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${fileName}`;

    // Save the link in the database
    const post = new Post();
    post.hash = hash;
    post.content = fileLink;

    return this.postRepository.save(post);
  }

  async getPost(hash: string): Promise<Post> {
    // Try to get from metadata cache
    const cachedPost = await this.metadataCacheClient.get(hash);
    if (cachedPost) {
      return JSON.parse(cachedPost);
    }

    const post = await this.postRepository.findOne({ where: { hash } });

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
