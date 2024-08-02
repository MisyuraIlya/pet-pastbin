// redis.providers.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_BLOCK_CACHE = 'REDIS_BLOCK_CACHE';
export const REDIS_METADATA_CACHE = 'REDIS_METADATA_CACHE';

export const redisProviders: Provider[] = [
  {
    provide: REDIS_BLOCK_CACHE,
    useFactory: () => {
      return new Redis('redis://block_cache_redis:6379');
    },
  },
  {
    provide: REDIS_METADATA_CACHE,
    useFactory: () => {
      return new Redis('redis://metadata_cache_redis:6379');
    },
  },
];
