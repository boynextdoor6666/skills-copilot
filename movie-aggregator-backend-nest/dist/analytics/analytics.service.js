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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let AnalyticsService = class AnalyticsService {
    constructor(connection) {
        this.connection = connection;
    }
    async getWorldRatings(contentId) {
        let sql = `
      SELECT 
        u.country,
        COUNT(r.id) as review_count,
        AVG(r.rating) as avg_rating
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE u.country IS NOT NULL AND r.rating IS NOT NULL
    `;
        const params = [];
        if (contentId) {
            sql += ` AND r.content_id = ?`;
            params.push(contentId);
        }
        sql += ` GROUP BY u.country ORDER BY avg_rating DESC`;
        return this.connection.query(sql, params);
    }
    async getAntiRating(limit = 10) {
        return this.connection.query(`
      SELECT 
        c.id, c.title, c.poster_url, c.content_type,
        c.avg_rating, c.reviews_count
      FROM content c
      WHERE c.reviews_count >= 1
      ORDER BY c.avg_rating ASC
      LIMIT ?
    `, [limit]);
    }
    async getHypeTop(limit = 10) {
        return this.connection.query(`
      SELECT 
        c.id, c.title, c.poster_url, c.content_type,
        c.hype_index, c.reviews_count
      FROM content c
      ORDER BY c.hype_index DESC
      LIMIT ?
    `, [limit]);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [typeorm_2.Connection])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map