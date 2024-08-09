// redis.providers.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_BLOCK_CACHE = 'REDIS_BLOCK_CACHE';
export const REDIS_METADATA_CACHE = 'REDIS_METADATA_CACHE';

export const redisProviders: Provider[] = [
  {
    provide: REDIS_BLOCK_CACHE,
    useFactory: () => {
      return new Redis(`${process.env.BLOCK_CACHE_REDIS_URL}`);
    },
  },
  {
    provide: REDIS_METADATA_CACHE,
    useFactory: () => {
      return new Redis(`${process.env.METADATA_CACHE_REDIS_URL}`);
    },
  },
];
