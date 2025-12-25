import { ExpectationsService } from './expectations.service';
export declare class ExpectationsController {
    private readonly expectationsService;
    constructor(expectationsService: ExpectationsService);
    setExpectation(req: any, contentId: string, rating: number): Promise<import("./entities/expectation.entity").Expectation>;
    getMyExpectation(req: any, contentId: string): Promise<import("./entities/expectation.entity").Expectation | null>;
    getContentExpectations(contentId: string): Promise<{
        avgRating: number;
        count: number;
    }>;
}
