import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Hash } from './entities/hash.entity';
import { REDIS_HASH } from 'src/redis.providers';
import { Redis } from 'ioredis';
import * as base64url from 'base64-url';

@Injectable()
export class HashService {
  constructor(
    @InjectRepository(Hash)
    private readonly hashRepository: Repository<Hash>,
    @Inject(REDIS_HASH) private readonly redisService: Redis,
  ) {}

  async generateHash(): Promise<string> {
    const cachedHash = await this.redisService.get('current_hash');
    if (cachedHash) {
      this.updateCacheWithNewHash();

      return cachedHash;
    }

    const newHash = await this.createAndCacheNewHash();
    return newHash;
  }

  private async createAndCacheNewHash(): Promise<string> {
    const hashRecord = await this.hashRepository.save(new Hash());
    const hash = base64url.encode(hashRecord.id.toString());
    await this.redisService.set('current_hash', hash);
    return hash;
  }

  private async updateCacheWithNewHash(): Promise<void> {
    const hashRecord = await this.hashRepository.save(new Hash());
    const newHash = base64url.encode(hashRecord.id.toString());
    await this.redisService.set('current_hash', newHash);
  }
}