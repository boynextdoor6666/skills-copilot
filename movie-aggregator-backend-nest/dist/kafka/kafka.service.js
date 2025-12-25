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
var KafkaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafkajs_1 = require("kafkajs");
let KafkaService = KafkaService_1 = class KafkaService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(KafkaService_1.name);
        this.isConnected = false;
        this.TOPICS = {
            REVIEWS: 'reviews',
            USERS: 'users',
            CONTENT: 'content',
            ANALYTICS: 'analytics',
        };
        this.enabled = this.configService.get('KAFKA_ENABLED', 'false') === 'true';
        if (this.enabled) {
            const brokers = this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(',');
            const clientId = this.configService.get('KAFKA_CLIENT_ID', 'cinevibe-backend');
            this.kafka = new kafkajs_1.Kafka({
                clientId,
                brokers,
                logLevel: kafkajs_1.logLevel.WARN,
                retry: {
                    initialRetryTime: 100,
                    retries: 8,
                },
            });
            this.producer = this.kafka.producer({
                allowAutoTopicCreation: true,
                transactionTimeout: 30000,
            });
            this.admin = this.kafka.admin();
        }
    }
    async onModuleInit() {
        if (!this.enabled) {
            this.logger.log('Kafka is disabled. Set KAFKA_ENABLED=true to enable.');
            return;
        }
        try {
            await this.producer.connect();
            await this.admin.connect();
            this.isConnected = true;
            this.logger.log('Kafka producer connected successfully');
            await this.ensureTopics();
        }
        catch (error) {
            this.logger.error(`Failed to connect to Kafka: ${error.message}`);
            this.isConnected = false;
        }
    }
    async onModuleDestroy() {
        if (this.isConnected) {
            await this.producer.disconnect();
            await this.admin.disconnect();
            this.logger.log('Kafka producer disconnected');
        }
    }
    async ensureTopics() {
        try {
            const existingTopics = await this.admin.listTopics();
            const topicsToCreate = Object.values(this.TOPICS).filter(topic => !existingTopics.includes(topic));
            if (topicsToCreate.length > 0) {
                await this.admin.createTopics({
                    topics: topicsToCreate.map(topic => ({
                        topic,
                        numPartitions: 3,
                        replicationFactor: 1,
                    })),
                });
                this.logger.log(`Created Kafka topics: ${topicsToCreate.join(', ')}`);
            }
        }
        catch (error) {
            this.logger.warn(`Could not create topics: ${error.message}`);
        }
    }
    async sendMessage(topic, message, key) {
        if (!this.enabled || !this.isConnected) {
            return false;
        }
        try {
            await this.producer.send({
                topic,
                messages: [
                    {
                        key: key || undefined,
                        value: JSON.stringify(message),
                        timestamp: Date.now().toString(),
                    },
                ],
            });
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send message to ${topic}: ${error.message}`);
            return false;
        }
    }
    async sendBatch(topic, messages) {
        if (!this.enabled || !this.isConnected || messages.length === 0) {
            return false;
        }
        try {
            await this.producer.send({
                topic,
                messages: messages.map(msg => ({
                    value: JSON.stringify(msg),
                    timestamp: Date.now().toString(),
                })),
            });
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send batch to ${topic}: ${error.message}`);
            return false;
        }
    }
    async emitReviewCreated(userId, contentId, contentType, rating, emotions, aspects) {
        const event = {
            event_type: 'review_created',
            user_id: userId,
            content_id: contentId,
            content_type: contentType,
            rating,
            emotions,
            aspects,
            source: 'web',
            event_time: new Date().toISOString(),
        };
        await this.sendMessage(this.TOPICS.REVIEWS, event, `${contentId}`);
    }
    async emitReviewDeleted(userId, contentId, contentType) {
        const event = {
            event_type: 'review_deleted',
            user_id: userId,
            content_id: contentId,
            content_type: contentType,
            rating: null,
            source: 'web',
            event_time: new Date().toISOString(),
        };
        await this.sendMessage(this.TOPICS.REVIEWS, event, `${contentId}`);
    }
    async emitRatingChanged(userId, contentId, contentType, oldRating, newRating) {
        const event = {
            event_type: 'rating_changed',
            user_id: userId,
            content_id: contentId,
            content_type: contentType,
            rating: newRating,
            source: 'web',
            event_time: new Date().toISOString(),
            metadata: { old_rating: oldRating },
        };
        await this.sendMessage(this.TOPICS.REVIEWS, event, `${contentId}`);
    }
    async emitUserRegistered(userId, metadata) {
        const event = {
            event_type: 'user_registered',
            user_id: userId,
            event_time: new Date().toISOString(),
            metadata,
        };
        await this.sendMessage(this.TOPICS.USERS, event, `${userId}`);
    }
    async emitUserLogin(userId) {
        const event = {
            event_type: 'user_login',
            user_id: userId,
            event_time: new Date().toISOString(),
        };
        await this.sendMessage(this.TOPICS.USERS, event, `${userId}`);
    }
    async emitAchievementUnlocked(userId, achievementCode) {
        const event = {
            event_type: 'achievement_unlocked',
            user_id: userId,
            event_time: new Date().toISOString(),
            metadata: { achievement_code: achievementCode },
        };
        await this.sendMessage(this.TOPICS.USERS, event, `${userId}`);
    }
    async emitContentViewed(contentId, contentType, userId) {
        const event = {
            event_type: 'content_viewed',
            user_id: userId,
            content_id: contentId,
            content_type: contentType,
            event_time: new Date().toISOString(),
        };
        await this.sendMessage(this.TOPICS.CONTENT, event, `${contentId}`);
    }
    async emitContentSearched(query, resultsCount, userId) {
        const event = {
            event_type: 'content_searched',
            content_id: 0,
            content_type: 'search',
            event_time: new Date().toISOString(),
            user_id: userId,
            metadata: { query, results_count: resultsCount },
        };
        await this.sendMessage(this.TOPICS.CONTENT, event);
    }
    async emitContentImported(contentId, contentType, source) {
        const event = {
            event_type: 'content_imported',
            content_id: contentId,
            content_type: contentType,
            event_time: new Date().toISOString(),
            metadata: { source },
        };
        await this.sendMessage(this.TOPICS.CONTENT, event, `${contentId}`);
    }
    isKafkaEnabled() {
        return this.enabled;
    }
    isKafkaConnected() {
        return this.isConnected;
    }
    async getStatus() {
        const brokers = this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(',');
        let topics = [];
        if (this.isConnected) {
            try {
                topics = await this.admin.listTopics();
            }
            catch (e) {
            }
        }
        return {
            enabled: this.enabled,
            connected: this.isConnected,
            brokers,
            topics,
        };
    }
};
exports.KafkaService = KafkaService;
exports.KafkaService = KafkaService = KafkaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KafkaService);
//# sourceMappingURL=kafka.service.js.map