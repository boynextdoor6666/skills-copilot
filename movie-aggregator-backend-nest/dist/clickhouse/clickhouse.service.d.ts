import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface ReviewsAggregation {
    content_id: number;
    content_type: string;
    total_reviews: number;
    avg_rating: number;
    rating_distribution: Record<string, number>;
    top_emotions: Array<{
        emotion: string;
        count: number;
    }>;
    daily_trend: Array<{
        date: string;
        count: number;
        avg_rating: number;
    }>;
}
export interface UserActivity {
    user_id: number;
    total_reviews: number;
    total_logins: number;
    achievements_count: number;
    favorite_genres: string[];
    activity_by_hour: Record<string, number>;
}
export interface ContentPopularity {
    content_id: number;
    title?: string;
    views_count: number;
    reviews_count: number;
    avg_rating: number;
    trend_score: number;
}
export declare class ClickHouseService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private client;
    private readonly enabled;
    private isConnected;
    private readonly database;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private initializeSchema;
    getReviewsAggregation(contentId: number): Promise<ReviewsAggregation | null>;
    getTopContent(contentType?: string, limit?: number, days?: number): Promise<ContentPopularity[]>;
    getUserActivity(userId: number): Promise<UserActivity | null>;
    getReviewsTrend(days?: number): Promise<Array<{
        date: string;
        count: number;
    }>>;
    getRatingDistribution(contentType?: string): Promise<Record<string, number>>;
    getEmotionsCloud(contentId?: number): Promise<Array<{
        emotion: string;
        count: number;
    }>>;
    getHourlyActivity(): Promise<Array<{
        hour: number;
        count: number;
    }>>;
    isClickHouseEnabled(): boolean;
    isClickHouseConnected(): boolean;
    getStatus(): Promise<{
        enabled: boolean;
        connected: boolean;
        database: string;
        tables: string[];
    }>;
}
