import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TmdbService } from './tmdb.service';
import { IgdbService } from './igdb.service';
import { ExternalApiController } from './external-api.controller';
import { Content } from '../content/entities/content.entity';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
    TypeOrmModule.forFeature([Content]),
  ],
  controllers: [ExternalApiController],
  providers: [TmdbService, IgdbService],
  exports: [TmdbService, IgdbService],
})
export class ExternalApiModule {}
