import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { ClickHouseService } from '../clickhouse/clickhouse.service';
import { KafkaService } from '../kafka/kafka.service';

@ApiTags('Analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly clickHouseService: ClickHouseService,
    private readonly kafkaService: KafkaService,
  ) {}

  // ==================== Original MySQL-based endpoints ====================

  @Get('world-ratings')
  @ApiOperation({ summary: 'Получить рейтинги по странам' })
  async getWorldRatings(@Query('contentId') contentId?: string) {
    const id = contentId ? parseInt(contentId, 10) : undefined;
    return this.analyticsService.getWorldRatings(id);
  }

  @Get('anti-rating')
  @ApiOperation({ summary: 'Получить анти-рейтинг контента' })
  async getAntiRating(@Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getAntiRating(l);
  }

  @Get('hype-top')
  @ApiOperation({ summary: 'Получить топ по хайпу' })
  async getHypeTop(@Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getHypeTop(l);
  }

  // ==================== ClickHouse-based endpoints ====================

  @Get('realtime/status')
  @ApiOperation({ summary: 'Статус подключения к Kafka и ClickHouse' })
  @ApiResponse({ status: 200, description: 'Статус аналитической инфраструктуры' })
  async getRealtimeStatus() {
    const [kafkaStatus, clickhouseStatus] = await Promise.all([
      this.kafkaService.getStatus(),
      this.clickHouseService.getStatus(),
    ]);

    return {
      kafka: kafkaStatus,
      clickhouse: clickhouseStatus,
      streaming_enabled: kafkaStatus.enabled && clickhouseStatus.enabled,
    };
  }

  @Get('realtime/content/:contentId')
  @ApiOperation({ summary: 'Реалтайм аналитика по контенту из ClickHouse' })
  @ApiResponse({ status: 200, description: 'Агрегированная аналитика по контенту' })
  async getContentAnalytics(@Param('contentId') contentId: string) {
    const id = parseInt(contentId, 10);
    const aggregation = await this.clickHouseService.getReviewsAggregation(id);
    
    if (!aggregation) {
      return {
        content_id: id,
        message: 'No analytics data available. ClickHouse may be disabled or no events recorded.',
        clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
      };
    }

    return aggregation;
  }

  @Get('realtime/top-content')
  @ApiOperation({ summary: 'Топ контента по популярности из ClickHouse' })
  @ApiQuery({ name: 'type', required: false, description: 'Тип контента (MOVIE, TV_SERIES, GAME)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'days', required: false, description: 'Период в днях (по умолчанию 7)' })
  async getTopContent(
    @Query('type') contentType?: string,
    @Query('limit') limit?: string,
    @Query('days') days?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 10;
    const d = days ? parseInt(days, 10) : 7;
    
    const topContent = await this.clickHouseService.getTopContent(contentType, l, d);
    
    if (topContent.length === 0) {
      return {
        results: [],
        message: 'No analytics data available. ClickHouse may be disabled or no events recorded.',
        clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
      };
    }

    return { results: topContent };
  }

  @Get('realtime/user/:userId')
  @ApiOperation({ summary: 'Активность пользователя из ClickHouse' })
  async getUserActivity(@Param('userId') userId: string) {
    const id = parseInt(userId, 10);
    const activity = await this.clickHouseService.getUserActivity(id);
    
    if (!activity) {
      return {
        user_id: id,
        message: 'No activity data available.',
        clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
      };
    }

    return activity;
  }

  @Get('realtime/trends/reviews')
  @ApiOperation({ summary: 'Тренд отзывов за период' })
  @ApiQuery({ name: 'days', required: false, description: 'Количество дней (по умолчанию 30)' })
  async getReviewsTrend(@Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 30;
    const trend = await this.clickHouseService.getReviewsTrend(d);
    
    return {
      period_days: d,
      data: trend,
      clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
    };
  }

  @Get('realtime/distribution/ratings')
  @ApiOperation({ summary: 'Распределение рейтингов' })
  @ApiQuery({ name: 'type', required: false, description: 'Тип контента' })
  async getRatingDistribution(@Query('type') contentType?: string) {
    const distribution = await this.clickHouseService.getRatingDistribution(contentType);
    
    return {
      content_type: contentType || 'all',
      distribution,
      clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
    };
  }

  @Get('realtime/emotions')
  @ApiOperation({ summary: 'Облако эмоций' })
  @ApiQuery({ name: 'contentId', required: false })
  async getEmotionsCloud(@Query('contentId') contentId?: string) {
    const id = contentId ? parseInt(contentId, 10) : undefined;
    const emotions = await this.clickHouseService.getEmotionsCloud(id);
    
    return {
      content_id: id || 'all',
      emotions,
      clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
    };
  }

  @Get('realtime/activity/hourly')
  @ApiOperation({ summary: 'Почасовая активность' })
  async getHourlyActivity() {
    const activity = await this.clickHouseService.getHourlyActivity();
    
    return {
      data: activity,
      clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
    };
  }
}
