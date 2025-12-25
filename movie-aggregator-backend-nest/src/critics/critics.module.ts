import { Module } from '@nestjs/common';
import { CriticsController } from './critics.controller';
import { CriticsService } from './critics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publication } from './entities/publication.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Publication])],
  controllers: [CriticsController],
  providers: [CriticsService],
  exports: [CriticsService]
})
export class CriticsModule {}
