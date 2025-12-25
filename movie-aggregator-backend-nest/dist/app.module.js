"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const admin_module_1 = require("./admin/admin.module");
const content_module_1 = require("./content/content.module");
const reviews_module_1 = require("./reviews/reviews.module");
const critics_module_1 = require("./critics/critics.module");
const analytics_module_1 = require("./analytics/analytics.module");
const gamification_module_1 = require("./gamification/gamification.module");
const expectations_module_1 = require("./expectations/expectations.module");
const external_api_module_1 = require("./external-api/external-api.module");
const recommendations_module_1 = require("./recommendations/recommendations.module");
const kafka_module_1 = require("./kafka/kafka.module");
const clickhouse_module_1 = require("./clickhouse/clickhouse.module");
const user_entity_1 = require("./users/user.entity");
const content_entity_1 = require("./content/entities/content.entity");
const review_entity_1 = require("./reviews/entities/review.entity");
const recommendation_entity_1 = require("./recommendations/entities/recommendation.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => ({
                    type: 'mysql',
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '3306', 10),
                    username: process.env.DB_USER || 'root',
                    password: process.env.DB_PASS || '',
                    database: process.env.DB_NAME || 'warehouse',
                    entities: [user_entity_1.User, content_entity_1.Content, review_entity_1.Review, recommendation_entity_1.Recommendation],
                    autoLoadEntities: true,
                    synchronize: false,
                    logging: (process.env.TYPEORM_LOGGING || process.env.NODE_ENV === 'development')
                        ? ['error', 'warn']
                        : ['error'],
                    retryAttempts: 12,
                    retryDelay: 2500,
                    keepConnectionAlive: true,
                    extra: {
                        connectTimeout: 10000,
                    },
                }),
            }),
            kafka_module_1.KafkaModule,
            clickhouse_module_1.ClickHouseModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            admin_module_1.AdminModule,
            content_module_1.ContentModule,
            reviews_module_1.ReviewsModule,
            critics_module_1.CriticsModule,
            analytics_module_1.AnalyticsModule,
            gamification_module_1.GamificationModule,
            expectations_module_1.ExpectationsModule,
            external_api_module_1.ExternalApiModule,
            recommendations_module_1.RecommendationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map