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
var GamificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let GamificationService = GamificationService_1 = class GamificationService {
    constructor(conn) {
        this.conn = conn;
        this.logger = new common_1.Logger(GamificationService_1.name);
        this.achievements = [
            { id: 'first_review', title: 'Первый шаг', description: 'Оставьте свой первый отзыв', icon: '✍️', category: 'reviews', requirement: 1 },
            { id: 'review_5', title: 'Активный зритель', description: 'Оставьте 5 отзывов', icon: '📝', category: 'reviews', requirement: 5 },
            { id: 'review_10', title: 'Заядлый критик', description: 'Оставьте 10 отзывов', icon: '🎬', category: 'reviews', requirement: 10 },
            { id: 'review_25', title: 'Эксперт', description: 'Оставьте 25 отзывов', icon: '⭐', category: 'reviews', requirement: 25 },
            { id: 'review_50', title: 'Мастер рецензий', description: 'Оставьте 50 отзывов', icon: '🏆', category: 'reviews', requirement: 50 },
            { id: 'review_100', title: 'Легенда', description: 'Оставьте 100 отзывов', icon: '👑', category: 'reviews', requirement: 100 },
            { id: 'first_follow', title: 'Ищущий вкус', description: 'Подпишитесь на первого критика', icon: '👤', category: 'critics', requirement: 1 },
            { id: 'follow_5', title: 'Знаток мнений', description: 'Подпишитесь на 5 критиков', icon: '👥', category: 'critics', requirement: 5 },
            { id: 'follow_10', title: 'Коллекционер вкусов', description: 'Подпишитесь на 10 критиков', icon: '🎭', category: 'critics', requirement: 10 },
            { id: 'genre_3', title: 'Открытый разум', description: 'Оставьте отзывы на контент 3 разных жанров', icon: '🌈', category: 'diversity', requirement: 3 },
            { id: 'genre_5', title: 'Универсал', description: 'Оставьте отзывы на контент 5 разных жанров', icon: '🎨', category: 'diversity', requirement: 5 },
            { id: 'all_types', title: 'Всеядный', description: 'Оставьте отзывы на фильмы, сериалы и игры', icon: '🎯', category: 'diversity', requirement: 3 },
            { id: 'detailed_review', title: 'Детальный анализ', description: 'Оставьте отзыв со всеми аспектами и эмоциями', icon: '📊', category: 'engagement', requirement: 1 },
            { id: 'weekly_active', title: 'Еженедельник', description: 'Оставляйте отзывы 7 дней подряд', icon: '📅', category: 'engagement', requirement: 7 },
            { id: 'early_bird', title: 'Первопроходец', description: 'Оставьте первый отзыв на новый контент', icon: '🚀', category: 'special', requirement: 1 },
            { id: 'gem_finder', title: 'Охотник за сокровищами', description: 'Найдите 3 скрытые жемчужины (высокий рейтинг, низкий хайп)', icon: '💎', category: 'special', requirement: 3 },
        ];
    }
    async getUserLevel(userId) {
        try {
            const [result] = await this.conn.query(`
        SELECT COUNT(*) as review_count FROM reviews WHERE user_id = ?
      `, [userId]);
            const reviewCount = (result === null || result === void 0 ? void 0 : result.review_count) || 0;
            const xp = reviewCount * 10;
            const level = Math.floor(Math.sqrt(xp / 100)) + 1;
            const nextLevelXP = Math.pow(level, 2) * 100;
            const currentXP = xp;
            const titles = [
                'Новичок', 'Зритель', 'Любитель', 'Знаток', 'Эксперт',
                'Мастер', 'Гуру', 'Легенда', 'Титан', 'Божество кино'
            ];
            const title = titles[Math.min(level - 1, titles.length - 1)];
            return { level, currentXP, nextLevelXP, title };
        }
        catch (err) {
            this.logger.error(`getUserLevel error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            return { level: 1, currentXP: 0, nextLevelXP: 100, title: 'Новичок' };
        }
    }
    async getUserAchievements(userId) {
        try {
            const [reviewStats] = await this.conn.query(`
        SELECT 
          COUNT(*) as total_reviews,
          COUNT(DISTINCT CASE WHEN c.genre IS NOT NULL THEN c.genre END) as unique_genres,
          COUNT(DISTINCT CASE WHEN c.content_type IS NOT NULL THEN c.content_type END) as unique_types,
          SUM(CASE WHEN r.aspects IS NOT NULL AND r.emotions IS NOT NULL THEN 1 ELSE 0 END) as detailed_reviews
        FROM reviews r
        LEFT JOIN content c ON c.id = r.content_id
        WHERE r.user_id = ?
      `, [userId]);
            const [followStats] = await this.conn.query(`
        SELECT COUNT(*) as follow_count FROM user_critic_preferences WHERE user_id = ?
      `, [userId]);
            const stats = {
                reviews: (reviewStats === null || reviewStats === void 0 ? void 0 : reviewStats.total_reviews) || 0,
                genres: (reviewStats === null || reviewStats === void 0 ? void 0 : reviewStats.unique_genres) || 0,
                types: (reviewStats === null || reviewStats === void 0 ? void 0 : reviewStats.unique_types) || 0,
                detailedReviews: (reviewStats === null || reviewStats === void 0 ? void 0 : reviewStats.detailed_reviews) || 0,
                follows: (followStats === null || followStats === void 0 ? void 0 : followStats.follow_count) || 0,
            };
            return this.achievements.map(achievement => {
                let progress = 0;
                let unlocked = false;
                switch (achievement.category) {
                    case 'reviews':
                        progress = Math.min(stats.reviews, achievement.requirement);
                        unlocked = stats.reviews >= achievement.requirement;
                        break;
                    case 'critics':
                        progress = Math.min(stats.follows, achievement.requirement);
                        unlocked = stats.follows >= achievement.requirement;
                        break;
                    case 'diversity':
                        if (achievement.id === 'all_types') {
                            progress = stats.types;
                            unlocked = stats.types >= 3;
                        }
                        else {
                            progress = Math.min(stats.genres, achievement.requirement);
                            unlocked = stats.genres >= achievement.requirement;
                        }
                        break;
                    case 'engagement':
                        if (achievement.id === 'detailed_review') {
                            progress = Math.min(stats.detailedReviews, 1);
                            unlocked = stats.detailedReviews >= 1;
                        }
                        break;
                }
                return {
                    ...achievement,
                    progress,
                    unlockedAt: unlocked ? new Date() : undefined,
                };
            });
        }
        catch (err) {
            this.logger.error(`getUserAchievements error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            return this.achievements.map(a => ({ ...a, progress: 0 }));
        }
    }
    async getLeaderboard(limit = 10) {
        try {
            const leaderboard = await this.conn.query(`
        SELECT 
          u.id,
          u.username,
          COUNT(r.id) as review_count,
          AVG(r.rating) as avg_rating
        FROM users u
        LEFT JOIN reviews r ON r.user_id = u.id
        WHERE u.role IN ('VIEWER', 'CRITIC')
        GROUP BY u.id, u.username
        HAVING review_count > 0
        ORDER BY review_count DESC, avg_rating DESC
        LIMIT ?
      `, [limit]);
            return leaderboard.map((user, index) => ({
                rank: index + 1,
                userId: user.id,
                username: user.username,
                reviewCount: user.review_count,
                avgRating: user.avg_rating ? parseFloat(user.avg_rating).toFixed(1) : 'N/A',
                xp: user.review_count * 10,
            }));
        }
        catch (err) {
            this.logger.error(`getLeaderboard error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            return [];
        }
    }
};
exports.GamificationService = GamificationService;
exports.GamificationService = GamificationService = GamificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [typeorm_2.Connection])
], GamificationService);
//# sourceMappingURL=gamification.service.js.map