import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HashModule } from './hash/hash.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HealthCheckModule } from './health-check/health-check.module';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject:[ConfigService],
      useFactory: async (configService: ConfigService) => {
        console.log('STAGE:', process.env.STAGE)
        console.log('POSTGRES_HOST',configService.get('POSTGRES_HOST'))
        console.log('POSTGRES_PORT',configService.get('POSTGRES_PORT'))
        console.log('POSTGRES_USER',configService.get('POSTGRES_USER'))
        console.log('POSTGRES_PASSWORD',configService.get('POSTGRES_PASSWORD'))
        console.log('POSTGRES_DB',configService.get('POSTGRES_DB'))
        console.log('REDIS',configService.get('REDIS_URL'))
        return {
          type:'postgres',
          host:configService.get('POSTGRES_HOST'),
          port:configService.get('POSTGRES_PORT'),
          username:configService.get('POSTGRES_USER'),
          password:configService.get('POSTGRES_PASSWORD'),
          database:configService.get('POSTGRES_DB'),
          autoLoadEntities:true,
          synchronize:true,
          ssl: process.env.STAGE === 'prod' ? { rejectUnauthorized: false } : false,
        }
      }
    }),
    RedisModule,
    HashModule,
    HealthCheckModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
