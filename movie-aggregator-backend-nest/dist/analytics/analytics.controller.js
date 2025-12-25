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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const clickhouse_service_1 = require("../clickhouse/clickhouse.service");
const kafka_service_1 = require("../kafka/kafka.service");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService, clickHouseService, kafkaService) {
        this.analyticsService = analyticsService;
        this.clickHouseService = clickHouseService;
        this.kafkaService = kafkaService;
    }
    async getWorldRatings(contentId) {
        const id = contentId ? parseInt(contentId, 10) : undefined;
        return this.analyticsService.getWorldRatings(id);
    }
    async getAntiRating(limit) {
        const l = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getAntiRating(l);
    }
    async getHypeTop(limit) {
        const l = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getHypeTop(l);
    }
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
    async getContentAnalytics(contentId) {
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
    async getTopContent(contentType, limit, days) {
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
    async getUserActivity(userId) {
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
    async getReviewsTrend(days) {
        const d = days ? parseInt(days, 10) : 30;
        const trend = await this.clickHouseService.getReviewsTrend(d);
        return {
            period_days: d,
            data: trend,
            clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
        };
    }
    async getRatingDistribution(contentType) {
        const distribution = await this.clickHouseService.getRatingDistribution(contentType);
        return {
            content_type: contentType || 'all',
            distribution,
            clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
        };
    }
    async getEmotionsCloud(contentId) {
        const id = contentId ? parseInt(contentId, 10) : undefined;
        const emotions = await this.clickHouseService.getEmotionsCloud(id);
        return {
            content_id: id || 'all',
            emotions,
            clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
        };
    }
    async getHourlyActivity() {
        const activity = await this.clickHouseService.getHourlyActivity();
        return {
            data: activity,
            clickhouse_enabled: this.clickHouseService.isClickHouseEnabled(),
        };
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('world-ratings'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить рейтинги по странам' }),
    __param(0, (0, common_1.Query)('contentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getWorldRatings", null);
__decorate([
    (0, common_1.Get)('anti-rating'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить анти-рейтинг контента' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAntiRating", null);
__decorate([
    (0, common_1.Get)('hype-top'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить топ по хайпу' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getHypeTop", null);
__decorate([
    (0, common_1.Get)('realtime/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Статус подключения к Kafka и ClickHouse' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Статус аналитической инфраструктуры' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRealtimeStatus", null);
__decorate([
    (0, common_1.Get)('realtime/content/:contentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Реалтайм аналитика по контенту из ClickHouse' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Агрегированная аналитика по контенту' }),
    __param(0, (0, common_1.Param)('contentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getContentAnalytics", null);
__decorate([
    (0, common_1.Get)('realtime/top-content'),
    (0, swagger_1.ApiOperation)({ summary: 'Топ контента по популярности из ClickHouse' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Тип контента (MOVIE, TV_SERIES, GAME)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'Период в днях (по умолчанию 7)' }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopContent", null);
__decorate([
    (0, common_1.Get)('realtime/user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Активность пользователя из ClickHouse' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserActivity", null);
__decorate([
    (0, common_1.Get)('realtime/trends/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Тренд отзывов за период' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'Количество дней (по умолчанию 30)' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getReviewsTrend", null);
__decorate([
    (0, common_1.Get)('realtime/distribution/ratings'),
    (0, swagger_1.ApiOperation)({ summary: 'Распределение рейтингов' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Тип контента' }),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRatingDistribution", null);
__decorate([
    (0, common_1.Get)('realtime/emotions'),
    (0, swagger_1.ApiOperation)({ summary: 'Облако эмоций' }),
    (0, swagger_1.ApiQuery)({ name: 'contentId', required: false }),
    __param(0, (0, common_1.Query)('contentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getEmotionsCloud", null);
__decorate([
    (0, common_1.Get)('realtime/activity/hourly'),
    (0, swagger_1.ApiOperation)({ summary: 'Почасовая активность' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getHourlyActivity", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, common_1.Controller)('api/analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        clickhouse_service_1.ClickHouseService,
        kafka_service_1.KafkaService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map