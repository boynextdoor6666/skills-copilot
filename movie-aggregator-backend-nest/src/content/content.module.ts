import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Content } from './entities/content.entity';
import { HeroCarousel } from './entities/hero-carousel.entity';
import { ComingSoonItem } from './entities/coming-soon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Content, HeroCarousel, ComingSoonItem])],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
