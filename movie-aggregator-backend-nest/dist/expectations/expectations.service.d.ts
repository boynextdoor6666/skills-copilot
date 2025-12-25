import { Repository } from 'typeorm';
import { Expectation } from './entities/expectation.entity';
import { Content } from '../content/entities/content.entity';
export declare class ExpectationsService {
    private expectationRepository;
    private contentRepository;
    constructor(expectationRepository: Repository<Expectation>, contentRepository: Repository<Content>);
    setExpectation(userId: number, contentId: number, rating: number): Promise<Expectation>;
    getExpectation(userId: number, contentId: number): Promise<Expectation | null>;
    getContentExpectations(contentId: number): Promise<{
        avgRating: number;
        count: number;
    }>;
}
