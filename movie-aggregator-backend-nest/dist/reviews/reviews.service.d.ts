import { OnModuleInit } from '@nestjs/common';
import { Repository, Connection } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto, PublishProReviewDto } from './dto/review.dto';
import { GamificationService } from '../gamification/gamification.service';
import { KafkaService } from '../kafka/kafka.service';
export declare class ReviewsService implements OnModuleInit {
    private reviewRepository;
    private connection;
    private readonly gamificationService;
    private readonly kafkaService;
    private readonly logger;
    constructor(reviewRepository: Repository<Review>, connection: Connection, gamificationService: GamificationService, kafkaService: KafkaService);
    onModuleInit(): Promise<void>;
    private ensureReviewVotesColumns;
    private ensureReviewVotesTable;
    voteReview(userId: number, reviewId: number, voteType: 'LIKE' | 'DISLIKE'): Promise<{
        status: string;
        vote?: undefined;
    } | {
        status: string;
        vote: "LIKE" | "DISLIKE";
    }>;
    getReviewVotes(reviewId: number): Promise<any>;
    private recalcContentAggregates;
    private ensureReviewsTable;
    private ensureReviewsColumns;
    private getReviewColumnsMeta;
    private relaxReviewsNotNullColumns;
    private ensureMoviesColumns;
    private buildInsertForReviews;
    private checkReviewAchievements;
    addViewerReview(userId: number, createDto: CreateReviewDto): Promise<any>;
    publishProReview(userId: number, publishDto: PublishProReviewDto): Promise<any>;
    deleteReview(reviewId: number, adminId: number, reason: string): Promise<any>;
    getReviewsByContent(contentId: number): Promise<any>;
    getReviewsByUser(userId: number): Promise<Review[]>;
}
