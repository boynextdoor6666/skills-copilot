import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

export interface ReviewsAggregation {
  content_id: number;
  content_type: string;
  total_reviews: number;
  avg_rating: number;
  rating_distribution: Record<string, number>;
  top_emotions: Array<{ emotion: string; count: number }>;
  daily_trend: Array<{ date: string; count: number; avg_rating: number }>;
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

@Injectable()
export class ClickHouseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClickHouseService.name);
  private client: ClickHouseClient | null = null;
  private readonly enabled: boolean;
  private isConnected = false;

  private readonly database: string;

  constructor(private configService: ConfigService) {
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

      this.client = createClient({
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

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      this.logger.log('ClickHouse connected successfully');

      // Initialize schema
      await this.initializeSchema();
    } catch (error) {
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

  private async initializeSchema() {
    if (!this.client) return;

    try {
      // Create database if not exists
      await this.client.command({
        query: `CREATE DATABASE IF NOT EXISTS ${this.database}`,
      });

      // Reviews events table
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

      // User events table
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

      // Content events table
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

      // Materialized view for hourly aggregations
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

      // Content popularity aggregation table
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
    } catch (error) {
      this.logger.error(`Failed to initialize ClickHouse schema: ${error.message}`);
    }
  }

  // ==================== Query Methods ====================

  async getReviewsAggregation(contentId: number): Promise<ReviewsAggregation | null> {
    if (!this.isConnected || !this.client) return null;

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

      const rows: any[] = await result.json();
      if (rows.length === 0) return null;

      const row = rows[0];

      // Get rating distribution
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
      const distRows: any[] = await distResult.json();
      const rating_distribution: Record<string, number> = {};
      distRows.forEach((r: any) => {
        rating_distribution[String(r.rating_bucket)] = Number(r.cnt);
      });

      // Get daily trend (last 30 days)
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
      const trendRows: any[] = await trendResult.json();
      const daily_trend = trendRows.map((r: any) => ({
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
        top_emotions: [], // Would need JSON parsing
        daily_trend,
      };
    } catch (error) {
      this.logger.error(`Failed to get reviews aggregation: ${error.message}`);
      return null;
    }
  }

  async getTopContent(
    contentType?: string,
    limit: number = 10,
    days: number = 7,
  ): Promise<ContentPopularity[]> {
    if (!this.isConnected || !this.client) return [];

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

      const rows: any[] = await result.json();
      return rows.map((r: any) => ({
        content_id: r.content_id,
        content_type: r.content_type,
        views_count: Number(r.views_count),
        reviews_count: Number(r.reviews_count),
        avg_rating: Number(r.avg_rating) || 0,
        trend_score: Number(r.views_count) + Number(r.reviews_count) * 10,
      }));
    } catch (error) {
      this.logger.error(`Failed to get top content: ${error.message}`);
      return [];
    }
  }

  async getUserActivity(userId: number): Promise<UserActivity | null> {
    if (!this.isConnected || !this.client) return null;

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

      const rows: any[] = await result.json();
      if (rows.length === 0) return null;

      const row = rows[0];

      // Get activity by hour
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
      const hourRows: any[] = await hourResult.json();
      const activity_by_hour: Record<string, number> = {};
      hourRows.forEach((r: any) => {
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
    } catch (error) {
      this.logger.error(`Failed to get user activity: ${error.message}`);
      return null;
    }
  }

  async getReviewsTrend(days: number = 30): Promise<Array<{ date: string; count: number }>> {
    if (!this.isConnected || !this.client) return [];

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

      const rows: any[] = await result.json();
      return rows.map((r: any) => ({
        date: r.date,
        count: Number(r.cnt),
      }));
    } catch (error) {
      this.logger.error(`Failed to get reviews trend: ${error.message}`);
      return [];
    }
  }

  async getRatingDistribution(contentType?: string): Promise<Record<string, number>> {
    if (!this.isConnected || !this.client) return {};

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

      const rows: any[] = await result.json();
      const distribution: Record<string, number> = {};
      rows.forEach((r: any) => {
        distribution[String(r.rating_bucket)] = Number(r.cnt);
      });
      return distribution;
    } catch (error) {
      this.logger.error(`Failed to get rating distribution: ${error.message}`);
      return {};
    }
  }

  async getEmotionsCloud(contentId?: number): Promise<Array<{ emotion: string; count: number }>> {
    if (!this.isConnected || !this.client) return [];

    try {
      // This is simplified - would need proper JSON parsing in ClickHouse
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

      const rows: any[] = await result.json();
      
      // Aggregate emotions across all rows
      const emotionCounts: Record<string, number> = {};
      rows.forEach((r: any) => {
        try {
          const emotions = JSON.parse(r.emotions || '{}');
          Object.entries(emotions).forEach(([emotion, value]) => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + (value as number);
          });
        } catch (e) {
          // Skip invalid JSON
        }
      });

      return Object.entries(emotionCounts)
        .map(([emotion, count]) => ({ emotion, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    } catch (error) {
      this.logger.error(`Failed to get emotions cloud: ${error.message}`);
      return [];
    }
  }

  async getHourlyActivity(): Promise<Array<{ hour: number; count: number }>> {
    if (!this.isConnected || !this.client) return [];

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

      const rows: any[] = await result.json();
      return rows.map((r: any) => ({
        hour: Number(r.hour),
        count: Number(r.cnt),
      }));
    } catch (error) {
      this.logger.error(`Failed to get hourly activity: ${error.message}`);
      return [];
    }
  }

  // ==================== Status ====================

  isClickHouseEnabled(): boolean {
    return this.enabled;
  }

  isClickHouseConnected(): boolean {
    return this.isConnected;
  }

  async getStatus(): Promise<{
    enabled: boolean;
    connected: boolean;
    database: string;
    tables: string[];
  }> {
    let tables: string[] = [];

    if (this.isConnected && this.client) {
      try {
        const result = await this.client.query({
          query: `SHOW TABLES FROM ${this.database}`,
          format: 'JSONEachRow',
        });
        const rows: any[] = await result.json();
        tables = rows.map((r: any) => r.name);
      } catch (e) {
        // Ignore
      }
    }

    return {
      enabled: this.enabled,
      connected: this.isConnected,
      database: this.database,
      tables,
    };
  }
}
