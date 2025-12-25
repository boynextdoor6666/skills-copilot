import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { exec } from 'child_process';
import * as path from 'path';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectRepository(Recommendation)
    private recommendationsRepository: Repository<Recommendation>,
  ) {}

  async getRecommendationsForUser(userId: number, limit: number = 10) {
    return this.recommendationsRepository.find({
      where: { user_id: userId },
      relations: ['content'],
      order: { score: 'DESC' },
      take: limit,
    });
  }

  async generateRecommendations() {
    this.logger.log('Starting recommendation generation process...');
    
    const scriptPath = path.resolve(__dirname, '../../../../analytics/ml/recommender.py');
    
    return new Promise((resolve, reject) => {
      exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Error executing ML script: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          this.logger.warn(`ML Script Stderr: ${stderr}`);
        }
        this.logger.log(`ML Script Output: ${stdout}`);
        resolve({ message: 'Recommendations generated successfully', output: stdout });
      });
    });
  }
}
