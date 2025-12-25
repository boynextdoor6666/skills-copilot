import { ReviewsService } from './reviews.service';
import { CreateReviewDto, PublishProReviewDto } from './dto/review.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    addReview(req: any, createDto: CreateReviewDto): Promise<any>;
    publishProReview(req: any, publishDto: PublishProReviewDto): Promise<any>;
    deleteReview(id: number, req: any, reason: string): Promise<any>;
    getReviewsByContent(contentId: number): Promise<any>;
    getReviewsByUser(userId: number): Promise<import("./entities/review.entity").Review[]>;
    getMyReviews(req: any): Promise<import("./entities/review.entity").Review[]>;
    voteReview(id: number, req: any, type: 'LIKE' | 'DISLIKE'): Promise<{
        status: string;
        vote?: undefined;
    } | {
        status: string;
        vote: "LIKE" | "DISLIKE";
    }>;
}
