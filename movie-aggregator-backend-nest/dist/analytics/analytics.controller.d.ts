import { AnalyticsService } from './analytics.service';
import { ClickHouseService } from '../clickhouse/clickhouse.service';
import { KafkaService } from '../kafka/kafka.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    private readonly clickHouseService;
    private readonly kafkaService;
    constructor(analyticsService: AnalyticsService, clickHouseService: ClickHouseService, kafkaService: KafkaService);
    getWorldRatings(contentId?: string): Promise<any>;
    getAntiRating(limit?: string): Promise<any>;
    getHypeTop(limit?: string): Promise<any>;
    getRealtimeStatus(): Promise<{
        kafka: {
            enabled: boolean;
            connected: boolean;
            brokers: string[];
            topics: string[];
        };
        clickhouse: {
            enabled: boolean;
            connected: boolean;
            database: string;
            tables: string[];
        };
        streaming_enabled: boolean;
    }>;
    getContentAnalytics(contentId: string): Promise<import("../clickhouse/clickhouse.service").ReviewsAggregation | {
        content_id: number;
        message: string;
        clickhouse_enabled: boolean;
    }>;
    getTopContent(contentType?: string, limit?: string, days?: string): Promise<{
        results: never[];
        message: string;
        clickhouse_enabled: boolean;
    } | {
        results: import("../clickhouse/clickhouse.service").ContentPopularity[];
        message?: undefined;
        clickhouse_enabled?: undefined;
    }>;
    getUserActivity(userId: string): Promise<import("../clickhouse/clickhouse.service").UserActivity | {
        user_id: number;
        message: string;
        clickhouse_enabled: boolean;
    }>;
    getReviewsTrend(days?: string): Promise<{
        period_days: number;
        data: {
            date: string;
            count: number;
        }[];
        clickhouse_enabled: boolean;
    }>;
    getRatingDistribution(contentType?: string): Promise<{
        content_type: string;
        distribution: Record<string, number>;
        clickhouse_enabled: boolean;
    }>;
    getEmotionsCloud(contentId?: string): Promise<{
        content_id: string | number;
        emotions: {
            emotion: string;
            count: number;
        }[];
        clickhouse_enabled: boolean;
    }>;
    getHourlyActivity(): Promise<{
        data: {
            hour: number;
            count: number;
        }[];
        clickhouse_enabled: boolean;
    }>;
}
