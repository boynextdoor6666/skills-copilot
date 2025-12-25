import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpectationsService } from './expectations.service';
import { ExpectationsController } from './expectations.controller';
import { Expectation } from './entities/expectation.entity';
import { Content } from '../content/entities/content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expectation, Content])],
  controllers: [ExpectationsController],
  providers: [ExpectationsService],
  exports: [ExpectationsService],
})
export class ExpectationsModule {}
