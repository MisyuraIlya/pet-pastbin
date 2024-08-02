// redis.providers.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_HASH = 'REDIS_HASH';

export const redisProviders: Provider[] = [
  {
    provide: REDIS_HASH,
    useFactory: () => {
      return new Redis('redis://hash_redis:6379');
    },
  },
];
