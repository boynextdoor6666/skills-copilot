import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, logLevel, Admin } from 'kafkajs';

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

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private isConnected = false;
  private readonly enabled: boolean;

  // Topic names
  readonly TOPICS = {
    REVIEWS: 'reviews',
    USERS: 'users',
    CONTENT: 'content',
    ANALYTICS: 'analytics',
  };

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get('KAFKA_ENABLED', 'false') === 'true';
    
    if (this.enabled) {
      const brokers = this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(',');
      const clientId = this.configService.get('KAFKA_CLIENT_ID', 'cinevibe-backend');

      this.kafka = new Kafka({
        clientId,
        brokers,
        logLevel: logLevel.WARN,
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

      // Ensure topics exist
      await this.ensureTopics();
    } catch (error) {
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

  private async ensureTopics() {
    try {
      const existingTopics = await this.admin.listTopics();
      const topicsToCreate = Object.values(this.TOPICS).filter(
        topic => !existingTopics.includes(topic)
      );

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
    } catch (error) {
      this.logger.warn(`Could not create topics: ${error.message}`);
    }
  }

  async sendMessage(topic: string, message: any, key?: string): Promise<boolean> {
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
    } catch (error) {
      this.logger.error(`Failed to send message to ${topic}: ${error.message}`);
      return false;
    }
  }

  async sendBatch(topic: string, messages: any[]): Promise<boolean> {
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
    } catch (error) {
      this.logger.error(`Failed to send batch to ${topic}: ${error.message}`);
      return false;
    }
  }

  // ==================== Review Events ====================

  async emitReviewCreated(
    userId: number,
    contentId: number,
    contentType: string,
    rating: number,
    emotions?: Record<string, number>,
    aspects?: Record<string, number>,
  ): Promise<void> {
    const event: ReviewEvent = {
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

  async emitReviewDeleted(
    userId: number,
    contentId: number,
    contentType: string,
  ): Promise<void> {
    const event: ReviewEvent = {
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

  async emitRatingChanged(
    userId: number,
    contentId: number,
    contentType: string,
    oldRating: number,
    newRating: number,
  ): Promise<void> {
    const event: ReviewEvent = {
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

  // ==================== User Events ====================

  async emitUserRegistered(userId: number, metadata?: Record<string, any>): Promise<void> {
    const event: UserEvent = {
      event_type: 'user_registered',
      user_id: userId,
      event_time: new Date().toISOString(),
      metadata,
    };

    await this.sendMessage(this.TOPICS.USERS, event, `${userId}`);
  }

  async emitUserLogin(userId: number): Promise<void> {
    const event: UserEvent = {
      event_type: 'user_login',
      user_id: userId,
      event_time: new Date().toISOString(),
    };

    await this.sendMessage(this.TOPICS.USERS, event, `${userId}`);
  }

  async emitAchievementUnlocked(userId: number, achievementCode: string): Promise<void> {
    const event: UserEvent = {
      event_type: 'achievement_unlocked',
      user_id: userId,
      event_time: new Date().toISOString(),
      metadata: { achievement_code: achievementCode },
    };

    await this.sendMessage(this.TOPICS.USERS, event, `${userId}`);
  }

  // ==================== Content Events ====================

  async emitContentViewed(
    contentId: number,
    contentType: string,
    userId?: number,
  ): Promise<void> {
    const event: ContentEvent = {
      event_type: 'content_viewed',
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      event_time: new Date().toISOString(),
    };

    await this.sendMessage(this.TOPICS.CONTENT, event, `${contentId}`);
  }

  async emitContentSearched(query: string, resultsCount: number, userId?: number): Promise<void> {
    const event: ContentEvent = {
      event_type: 'content_searched',
      content_id: 0,
      content_type: 'search',
      event_time: new Date().toISOString(),
      user_id: userId,
      metadata: { query, results_count: resultsCount },
    };

    await this.sendMessage(this.TOPICS.CONTENT, event);
  }

  async emitContentImported(
    contentId: number,
    contentType: string,
    source: string,
  ): Promise<void> {
    const event: ContentEvent = {
      event_type: 'content_imported',
      content_id: contentId,
      content_type: contentType,
      event_time: new Date().toISOString(),
      metadata: { source },
    };

    await this.sendMessage(this.TOPICS.CONTENT, event, `${contentId}`);
  }

  // ==================== Status ====================

  isKafkaEnabled(): boolean {
    return this.enabled;
  }

  isKafkaConnected(): boolean {
    return this.isConnected;
  }

  async getStatus(): Promise<{
    enabled: boolean;
    connected: boolean;
    brokers: string[];
    topics: string[];
  }> {
    const brokers = this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(',');
    let topics: string[] = [];

    if (this.isConnected) {
      try {
        topics = await this.admin.listTopics();
      } catch (e) {
        // Ignore
      }
    }

    return {
      enabled: this.enabled,
      connected: this.isConnected,
      brokers,
      topics,
    };
  }
}
