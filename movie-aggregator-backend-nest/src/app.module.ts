import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ContentModule } from './content/content.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CriticsModule } from './critics/critics.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GamificationModule } from './gamification/gamification.module';
import { ExpectationsModule } from './expectations/expectations.module';
import { ExternalApiModule } from './external-api/external-api.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { KafkaModule } from './kafka/kafka.module';
import { ClickHouseModule } from './clickhouse/clickhouse.module';
import { User } from './users/user.entity';
import { Content } from './content/entities/content.entity';
import { Review } from './reviews/entities/review.entity';
import { Recommendation } from './recommendations/entities/recommendation.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'warehouse',
  entities: [User, Content, Review, Recommendation],
  autoLoadEntities: true,
        synchronize: false,
        logging: (process.env.TYPEORM_LOGGING || process.env.NODE_ENV === 'development')
          ? ['error','warn']
          : ['error'],
        // Improve resilience when DB is slow to start
        retryAttempts: 12,
        retryDelay: 2500,
        keepConnectionAlive: true,
        extra: {
          connectTimeout: 10000,
        },
      }),
    }),
    // Global modules for event streaming and analytics
    KafkaModule,
    ClickHouseModule,
    // Feature modules
    UsersModule,
    AuthModule,
    AdminModule,
    ContentModule,
    ReviewsModule,
    CriticsModule,
    AnalyticsModule,
    GamificationModule,
    ExpectationsModule,
    ExternalApiModule,
    RecommendationsModule,
  ],
})
export class AppModule {}
