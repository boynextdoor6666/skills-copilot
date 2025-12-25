import { Repository } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';
export declare class RecommendationsService {
    private recommendationsRepository;
    private readonly logger;
    constructor(recommendationsRepository: Repository<Recommendation>);
    getRecommendationsForUser(userId: number, limit?: number): Promise<Recommendation[]>;
    generateRecommendations(): Promise<unknown>;
}
