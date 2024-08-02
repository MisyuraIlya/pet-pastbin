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
    // Get a unique ID from PostgreSQL
    const hashRecord = await this.hashRepository.save(new Hash());

    // Encode the ID in base64
    const hash = base64url.encode(hashRecord.id).slice(0, 8);

    // Save the hash to Redis
    await this.redisService.set(hash, hashRecord.id);

    // Update the record with the generated hash
    hashRecord.hash = hash;
    await this.hashRepository.save(hashRecord);

    return hash;
  }
}
