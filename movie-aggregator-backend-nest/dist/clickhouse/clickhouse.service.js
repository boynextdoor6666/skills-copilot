"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ClickHouseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickHouseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@clickhouse/client");
let ClickHouseService = ClickHouseService_1 = class ClickHouseService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ClickHouseService_1.name);
        this.client = null;
        this.isConnected = false;
        this.enabled = this.configService.get('CLICKHOUSE_ENABLED', 'false') === 'true';
        this.database = this.configService.get('CLICKHOUSE_DATABASE', 'analytics');
    }
    async onModuleInit() {
        if (!this.enabled) {
            this.logger.log('ClickHouse is disabled. Set CLICKHOUSE_ENABLED=true to enable.');
            return;
        }
        try {
            const host = this.configService.get('CLICKHOUSE_HOST', 'localhost');
            const port = this.configService.get('CLICKHOUSE_PORT', '8123');
            const username = this.configService.get('CLICKHOUSE_USER', 'default');
            const password = this.configService.get('CLICKHOUSE_PASSWORD', '');
            this.client = (0, client_1.createClient)({
                url: `http://${host}:${port}`,
                username,
                password,
                database: this.database,
                request_timeout: 30000,
                clickhouse_settings: {
                    async_insert: 1,
                    wait_for_async_insert: 0,
                },
            });
            await this.client.ping();
            this.isConnected = true;
            this.logger.log('ClickHouse connected successfully');
            await this.initializeSchema();
        }
        catch (error) {
            this.logger.error(`Failed to connect to ClickHouse: ${error.message}`);
            this.isConnected = false;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.close();
            this.logger.log('ClickHouse connection closed');
        }
    }
    async initializeSchema() {
        if (!this.client)
            return;
        try {
            await this.client.command({
                query: `CREATE DATABASE IF NOT EXISTS ${this.database}`,
            });
            await this.client.command({
                query: `
          CREATE TABLE IF NOT EXISTS ${this.database}.reviews_events (
            event_time   DateTime DEFAULT now(),
            event_type   LowCardinality(String),
            user_id      UInt32,
            content_id   UInt32,
            content_type LowCardinality(String),
            rating       Nullable(Float32),
            emotions     String DEFAULT '{}',
            aspects      String DEFAULT '{}',
            source       LowCardinality(String) DEFAULT 'web'
          ) ENGINE = MergeTree()
          PARTITION BY toYYYYMM(event_time)
          ORDER BY (content_id, event_time)
          SETTINGS index_granularity = 8192
        `,
            });
            await this.client.command({
                query: `
          CREATE TABLE IF NOT EXISTS ${this.database}.user_events (
            event_time   DateTime DEFAULT now(),
            event_type   LowCardinality(String),
            user_id      UInt32,
            metadata     String DEFAULT '{}'
          ) ENGINE = MergeTree()
          PARTITION BY toYYYYMM(event_time)
          ORDER BY (user_id, event_time)
          SETTINGS index_granularity = 8192
        `,
            });
            await this.client.command({
                query: `
          CREATE TABLE IF NOT EXISTS ${this.database}.content_events (
            event_time   DateTime DEFAULT now(),
            event_type   LowCardinality(String),
            user_id      Nullable(UInt32),
            content_id   UInt32,
            content_type LowCardinality(String),
            metadata     String DEFAULT '{}'
          ) ENGINE = MergeTree()
          PARTITION BY toYYYYMM(event_time)
          ORDER BY (content_id, event_time)
          SETTINGS index_granularity = 8192
        `,
            });
            await this.client.command({
                query: `
          CREATE TABLE IF NOT EXISTS ${this.database}.reviews_hourly (
            hour         DateTime,
            content_id   UInt32,
            content_type LowCardinality(String),
            reviews_count UInt64,
            sum_rating   Float64,
            avg_rating   Float64
          ) ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(hour)
          ORDER BY (hour, content_id)
        `,
            });
            await this.client.command({
                query: `
          CREATE TABLE IF NOT EXISTS ${this.database}.content_popularity (
            date           Date,
            content_id     UInt32,
            content_type   LowCardinality(String),
            views_count    UInt64,
            reviews_count  UInt64,
            avg_rating     Float64,
            trend_score    Float64
          ) ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(date)
          ORDER BY (date, content_id)
        `,
            });
            this.logger.log('ClickHouse schema initialized');
        }
        catch (error) {
            this.logger.error(`Failed to initialize ClickHouse schema: ${error.message}`);
        }
    }
    async getReviewsAggregation(contentId) {
        if (!this.isConnected || !this.client)
            return null;
        try {
            const result = await this.client.query({
                query: `
          SELECT 
            content_id,
            content_type,
            count() as total_reviews,
            avg(rating) as avg_rating
          FROM ${this.database}.reviews_events
          WHERE content_id = {contentId:UInt32}
            AND event_type = 'review_created'
            AND rating IS NOT NULL
          GROUP BY content_id, content_type
        `,
                query_params: { contentId },
                format: 'JSONEachRow',
            });
            const rows = await result.json();
            if (rows.length === 0)
                return null;
            const row = rows[0];
            const distResult = await this.client.query({
                query: `
          SELECT 
            floor(rating) as rating_bucket,
            count() as cnt
          FROM ${this.database}.reviews_events
          WHERE content_id = {contentId:UInt32}
            AND event_type = 'review_created'
            AND rating IS NOT NULL
          GROUP BY rating_bucket
          ORDER BY rating_bucket
        `,
                query_params: { contentId },
                format: 'JSONEachRow',
            });
            const distRows = await distResult.json();
            const rating_distribution = {};
            distRows.forEach((r) => {
                rating_distribution[String(r.rating_bucket)] = Number(r.cnt);
            });
            const trendResult = await this.client.query({
                query: `
          SELECT 
            toDate(event_time) as date,
            count() as cnt,
            avg(rating) as avg_rating
          FROM ${this.database}.reviews_events
          WHERE content_id = {contentId:UInt32}
            AND event_type = 'review_created'
            AND event_time >= now() - INTERVAL 30 DAY
          GROUP BY date
          ORDER BY date
        `,
                query_params: { contentId },
                format: 'JSONEachRow',
            });
            const trendRows = await trendResult.json();
            const daily_trend = trendRows.map((r) => ({
                date: r.date,
                count: Number(r.cnt),
                avg_rating: Number(r.avg_rating),
            }));
            return {
                content_id: row.content_id,
                content_type: row.content_type,
                total_reviews: Number(row.total_reviews),
                avg_rating: Number(row.avg_rating),
                rating_distribution,
                top_emotions: [],
                daily_trend,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get reviews aggregation: ${error.message}`);
            return null;
        }
    }
    async getTopContent(contentType, limit = 10, days = 7) {
        if (!this.isConnected || !this.client)
            return [];
        try {
            let typeFilter = '';
            if (contentType) {
                typeFilter = `AND content_type = '${contentType}'`;
            }
            const result = await this.client.query({
                query: `
          SELECT 
            content_id,
            content_type,
            countIf(event_type = 'content_viewed') as views_count,
            countIf(event_type = 'review_created') as reviews_count,
            avgIf(rating, event_type = 'review_created' AND rating IS NOT NULL) as avg_rating
          FROM (
            SELECT content_id, content_type, event_type, NULL as rating, event_time
            FROM ${this.database}.content_events
            WHERE event_time >= now() - INTERVAL ${days} DAY
            UNION ALL
            SELECT content_id, content_type, event_type, rating, event_time
            FROM ${this.database}.reviews_events
            WHERE event_time >= now() - INTERVAL ${days} DAY
          )
          WHERE 1=1 ${typeFilter}
          GROUP BY content_id, content_type
          ORDER BY views_count + reviews_count * 10 DESC
          LIMIT ${limit}
        `,
                format: 'JSONEachRow',
            });
            const rows = await result.json();
            return rows.map((r) => ({
                content_id: r.content_id,
                content_type: r.content_type,
                views_count: Number(r.views_count),
                reviews_count: Number(r.reviews_count),
                avg_rating: Number(r.avg_rating) || 0,
                trend_score: Number(r.views_count) + Number(r.reviews_count) * 10,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get top content: ${error.message}`);
            return [];
        }
    }
    async getUserActivity(userId) {
        if (!this.isConnected || !this.client)
            return null;
        try {
            const result = await this.client.query({
                query: `
          SELECT 
            user_id,
            countIf(event_type = 'review_created') as total_reviews,
            countIf(event_type = 'user_login') as total_logins,
            countIf(event_type = 'achievement_unlocked') as achievements_count
          FROM (
            SELECT user_id, event_type FROM ${this.database}.reviews_events WHERE user_id = {userId:UInt32}
            UNION ALL
            SELECT user_id, event_type FROM ${this.database}.user_events WHERE user_id = {userId:UInt32}
          )
          GROUP BY user_id
        `,
                query_params: { userId },
                format: 'JSONEachRow',
            });
            const rows = await result.json();
            if (rows.length === 0)
                return null;
            const row = rows[0];
            const hourResult = await this.client.query({
                query: `
          SELECT 
            toHour(event_time) as hour,
            count() as cnt
          FROM ${this.database}.reviews_events
          WHERE user_id = {userId:UInt32}
          GROUP BY hour
          ORDER BY hour
        `,
                query_params: { userId },
                format: 'JSONEachRow',
            });
            const hourRows = await hourResult.json();
            const activity_by_hour = {};
            hourRows.forEach((r) => {
                activity_by_hour[String(r.hour)] = Number(r.cnt);
            });
            return {
                user_id: row.user_id,
                total_reviews: Number(row.total_reviews),
                total_logins: Number(row.total_logins),
                achievements_count: Number(row.achievements_count),
                favorite_genres: [],
                activity_by_hour,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get user activity: ${error.message}`);
            return null;
        }
    }
    async getReviewsTrend(days = 30) {
        if (!this.isConnected || !this.client)
            return [];
        try {
            const result = await this.client.query({
                query: `
          SELECT 
            toDate(event_time) as date,
            count() as cnt
          FROM ${this.database}.reviews_events
          WHERE event_type = 'review_created'
            AND event_time >= now() - INTERVAL ${days} DAY
          GROUP BY date
          ORDER BY date
        `,
                format: 'JSONEachRow',
            });
            const rows = await result.json();
            return rows.map((r) => ({
                date: r.date,
                count: Number(r.cnt),
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get reviews trend: ${error.message}`);
            return [];
        }
    }
    async getRatingDistribution(contentType) {
        if (!this.isConnected || !this.client)
            return {};
        try {
            let typeFilter = '';
            if (contentType) {
                typeFilter = `AND content_type = '${contentType}'`;
            }
            const result = await this.client.query({
                query: `
          SELECT 
            floor(rating) as rating_bucket,
            count() as cnt
          FROM ${this.database}.reviews_events
          WHERE event_type = 'review_created'
            AND rating IS NOT NULL
            ${typeFilter}
          GROUP BY rating_bucket
          ORDER BY rating_bucket
        `,
                format: 'JSONEachRow',
            });
            const rows = await result.json();
            const distribution = {};
            rows.forEach((r) => {
                distribution[String(r.rating_bucket)] = Number(r.cnt);
            });
            return distribution;
        }
        catch (error) {
            this.logger.error(`Failed to get rating distribution: ${error.message}`);
            return {};
        }
    }
    async getEmotionsCloud(contentId) {
        if (!this.isConnected || !this.client)
            return [];
        try {
            let contentFilter = '';
            if (contentId) {
                contentFilter = `AND content_id = ${contentId}`;
            }
            const result = await this.client.query({
                query: `
          SELECT 
            emotions,
            count() as cnt
          FROM ${this.database}.reviews_events
          WHERE event_type = 'review_created'
            AND emotions != '{}'
            ${contentFilter}
          GROUP BY emotions
          ORDER BY cnt DESC
          LIMIT 100
        `,
                format: 'JSONEachRow',
            });
            const rows = await result.json();
            const emotionCounts = {};
            rows.forEach((r) => {
                try {
                    const emotions = JSON.parse(r.emotions || '{}');
                    Object.entries(emotions).forEach(([emotion, value]) => {
                        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + value;
                    });
                }
                catch (e) {
                }
            });
            return Object.entries(emotionCounts)
                .map(([emotion, count]) => ({ emotion, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);
        }
        catch (error) {
            this.logger.error(`Failed to get emotions cloud: ${error.message}`);
            return [];
        }
    }
    async getHourlyActivity() {
        if (!this.isConnected || !this.client)
            return [];
        try {
            const result = await this.client.query({
                query: `
          SELECT 
            toHour(event_time) as hour,
            count() as cnt
          FROM ${this.database}.reviews_events
          WHERE event_time >= now() - INTERVAL 7 DAY
          GROUP BY hour
          ORDER BY hour
        `,
                format: 'JSONEachRow',
            });
            const rows = await result.json();
            return rows.map((r) => ({
                hour: Number(r.hour),
                count: Number(r.cnt),
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get hourly activity: ${error.message}`);
            return [];
        }
    }
    isClickHouseEnabled() {
        return this.enabled;
    }
    isClickHouseConnected() {
        return this.isConnected;
    }
    async getStatus() {
        let tables = [];
        if (this.isConnected && this.client) {
            try {
                const result = await this.client.query({
                    query: `SHOW TABLES FROM ${this.database}`,
                    format: 'JSONEachRow',
                });
                const rows = await result.json();
                tables = rows.map((r) => r.name);
            }
            catch (e) {
            }
        }
        return {
            enabled: this.enabled,
            connected: this.isConnected,
            database: this.database,
            tables,
        };
    }
};
exports.ClickHouseService = ClickHouseService;
exports.ClickHouseService = ClickHouseService = ClickHouseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClickHouseService);
//# sourceMappingURL=clickhouse.service.js.map