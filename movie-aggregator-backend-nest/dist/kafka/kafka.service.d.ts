import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface ReviewEvent {
    event_type: 'review_created' | 'review_updated' | 'review_deleted' | 'rating_changed';
    user_id: number;
    content_id: number;
    content_type: string;
    rating: number | null;
    emotions?: Record<string, number>;
    aspects?: Record<string, number>;
    source: string;
    event_time: string;
    metadata?: Record<string, any>;
}
export interface UserEvent {
    event_type: 'user_registered' | 'user_login' | 'user_updated' | 'achievement_unlocked';
    user_id: number;
    event_time: string;
    metadata?: Record<string, any>;
}
export interface ContentEvent {
    event_type: 'content_viewed' | 'content_searched' | 'content_imported';
    user_id?: number;
    content_id: number;
    content_type: string;
    event_time: string;
    metadata?: Record<string, any>;
}
export declare class KafkaService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private kafka;
    private producer;
    private admin;
    private isConnected;
    private readonly enabled;
    readonly TOPICS: {
        REVIEWS: string;
        USERS: string;
        CONTENT: string;
        ANALYTICS: string;
    };
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private ensureTopics;
    sendMessage(topic: string, message: any, key?: string): Promise<boolean>;
    sendBatch(topic: string, messages: any[]): Promise<boolean>;
    emitReviewCreated(userId: number, contentId: number, contentType: string, rating: number, emotions?: Record<string, number>, aspects?: Record<string, number>): Promise<void>;
    emitReviewDeleted(userId: number, contentId: number, contentType: string): Promise<void>;
    emitRatingChanged(userId: number, contentId: number, contentType: string, oldRating: number, newRating: number): Promise<void>;
    emitUserRegistered(userId: number, metadata?: Record<string, any>): Promise<void>;
    emitUserLogin(userId: number): Promise<void>;
    emitAchievementUnlocked(userId: number, achievementCode: string): Promise<void>;
    emitContentViewed(contentId: number, contentType: string, userId?: number): Promise<void>;
    emitContentSearched(query: string, resultsCount: number, userId?: number): Promise<void>;
    emitContentImported(contentId: number, contentType: string, source: string): Promise<void>;
    isKafkaEnabled(): boolean;
    isKafkaConnected(): boolean;
    getStatus(): Promise<{
        enabled: boolean;
        connected: boolean;
        brokers: string[];
        topics: string[];
    }>;
}
