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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const review_entity_1 = require("../reviews/entities/review.entity");
const content_entity_1 = require("../content/entities/content.entity");
let AdminService = class AdminService {
    constructor(users, reviews, content) {
        this.users = users;
        this.reviews = reviews;
        this.content = content;
    }
    async getDashboardStats() {
        const userStats = await this.getUserStats();
        const contentStats = await this.getContentStats();
        const reviewStats = await this.getReviewStats();
        const systemHealth = {
            database: 'connected',
            tmdb: process.env.TMDB_API_KEY ? 'configured' : 'missing',
            igdb: (process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET) ? 'configured' : 'missing',
            version: '1.0.0'
        };
        return {
            users: userStats,
            content: contentStats,
            reviews: reviewStats,
            system: systemHealth
        };
    }
    async getContentStats() {
        const [total, movies, series, games] = await Promise.all([
            this.content.count(),
            this.content.count({ where: { content_type: content_entity_1.ContentType.MOVIE } }),
            this.content.count({ where: { content_type: content_entity_1.ContentType.TV_SERIES } }),
            this.content.count({ where: { content_type: content_entity_1.ContentType.GAME } }),
        ]);
        return {
            total,
            byType: {
                movies,
                series,
                games
            }
        };
    }
    async getReviewStats() {
        const total = await this.reviews.count();
        const avgRatingResult = await this.reviews
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'avg')
            .getRawOne();
        const avgRating = avgRatingResult ? parseFloat(avgRatingResult.avg).toFixed(1) : 0;
        const last7Days = await this.reviews
            .createQueryBuilder('review')
            .select("DATE_FORMAT(review.created_at, '%Y-%m-%d')", 'date')
            .addSelect('COUNT(*)', 'count')
            .where('review.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();
        return {
            total,
            avgRating,
            activity: last7Days
        };
    }
    async getAllUsers(role) {
        const query = this.users.createQueryBuilder('user');
        if (role) {
            query.where('user.role = :role', { role });
        }
        return query.orderBy('user.registrationDate', 'DESC').getMany();
    }
    async getAllReviews() {
        return this.reviews.find({
            relations: ['user', 'contentEntity'],
            order: { created_at: 'DESC' },
            take: 100,
        });
    }
    async deleteReview(id) {
        const review = await this.reviews.findOne({ where: { id } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        await this.reviews.remove(review);
        return { message: 'Review deleted' };
    }
    async getUserStats() {
        const [total, active, admins, critics, regularUsers] = await Promise.all([
            this.users.count(),
            this.users.count({ where: { isActive: true } }),
            this.users.count({ where: { role: user_entity_1.UserRole.ADMIN } }),
            this.users.count({ where: { role: user_entity_1.UserRole.CRITIC } }),
            this.users.count({ where: { role: user_entity_1.UserRole.USER } }),
        ]);
        return {
            total,
            active,
            inactive: total - active,
            byRole: {
                admins,
                critics,
                users: regularUsers,
            },
        };
    }
    async updateUserStatus(userId, isActive) {
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.isActive = isActive;
        return this.users.save(user);
    }
    async updateUserRole(userId, role) {
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.role = role;
        return this.users.save(user);
    }
    async deleteUser(userId) {
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.users.remove(user);
        return { message: 'User deleted successfully', userId };
    }
    async getTopUsers(limit = 10) {
        return this.users
            .createQueryBuilder('user')
            .where('user.isActive = :active', { active: true })
            .orderBy('user.reputation', 'DESC')
            .limit(limit)
            .getMany();
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(2, (0, typeorm_1.InjectRepository)(content_entity_1.Content)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map