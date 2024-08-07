import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './post/post.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.METADATA_DB_HOST,
      port: parseInt(process.env.METADATA_DB_PORT, 10) || 5432,
      username: process.env.METADATA_DB_USER,
      password: process.env.METADATA_DB_PASSWORD,
      database: process.env.METADATA_DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    RedisModule,
    PostModule,
    S3Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
