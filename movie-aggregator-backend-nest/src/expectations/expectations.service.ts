import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expectation } from './entities/expectation.entity';
import { Content } from '../content/entities/content.entity';

@Injectable()
export class ExpectationsService {
  constructor(
    @InjectRepository(Expectation)
    private expectationRepository: Repository<Expectation>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async setExpectation(userId: number, contentId: number, rating: number) {
    let expectation = await this.expectationRepository.findOne({ where: { user_id: userId, content_id: contentId } });
    if (expectation) {
      expectation.rating = rating;
    } else {
      expectation = this.expectationRepository.create({ user_id: userId, content_id: contentId, rating });
    }
    return this.expectationRepository.save(expectation);
  }

  async getExpectation(userId: number, contentId: number) {
    return this.expectationRepository.findOne({ where: { user_id: userId, content_id: contentId } });
  }

  async getContentExpectations(contentId: number) {
    const result = await this.expectationRepository
      .createQueryBuilder('expectation')
      .select('AVG(expectation.rating)', 'avg')
      .addSelect('COUNT(expectation.id)', 'count')
      .where('expectation.content_id = :contentId', { contentId })
      .getRawOne();
    
    return {
      avgRating: parseFloat(result.avg) || 0,
      count: parseInt(result.count) || 0,
    };
  }
}
