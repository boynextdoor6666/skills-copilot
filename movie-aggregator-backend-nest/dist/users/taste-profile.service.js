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
var TasteProfileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasteProfileService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let TasteProfileService = TasteProfileService_1 = class TasteProfileService {
    constructor(conn) {
        this.conn = conn;
        this.logger = new common_1.Logger(TasteProfileService_1.name);
    }
    async getUserTasteProfile(userId) {
        try {
            const genreStats = await this.conn.query(`
        SELECT 
          c.genre,
          COUNT(*) as count,
          AVG(r.rating) as avg_rating
        FROM reviews r
        JOIN content c ON c.id = r.content_id
        WHERE r.user_id = ? AND c.genre IS NOT NULL AND r.rating IS NOT NULL
        GROUP BY c.genre
        ORDER BY count DESC, avg_rating DESC
        LIMIT 5
      `, [userId]);
            const typeStats = await this.conn.query(`
        SELECT 
          c.content_type as type,
          COUNT(*) as count,
          AVG(r.rating) as avg_rating
        FROM reviews r
        JOIN content c ON c.id = r.content_id
        WHERE r.user_id = ? AND r.rating IS NOT NULL
        GROUP BY c.content_type
        ORDER BY count DESC
      `, [userId]);
            const aspectsData = await this.conn.query(`
        SELECT aspects FROM reviews 
        WHERE user_id = ? AND aspects IS NOT NULL
      `, [userId]);
            const aspectAverages = {};
            aspectsData.forEach((row) => {
                try {
                    const aspects = typeof row.aspects === 'string' ? JSON.parse(row.aspects) : row.aspects;
                    if (aspects && typeof aspects === 'object') {
                        Object.entries(aspects).forEach(([key, value]) => {
                            if (typeof value === 'number') {
                                if (!aspectAverages[key])
                                    aspectAverages[key] = { sum: 0, count: 0 };
                                aspectAverages[key].sum += value;
                                aspectAverages[key].count += 1;
                            }
                        });
                    }
                }
                catch (e) {
                }
            });
            const favoriteAspects = {};
            Object.entries(aspectAverages).forEach(([key, { sum, count }]) => {
                favoriteAspects[key] = parseFloat((sum / count).toFixed(2));
            });
            const emotionsData = await this.conn.query(`
        SELECT emotions FROM reviews 
        WHERE user_id = ? AND emotions IS NOT NULL
      `, [userId]);
            const emotionStats = {};
            emotionsData.forEach((row) => {
                try {
                    const emotions = typeof row.emotions === 'string' ? JSON.parse(row.emotions) : row.emotions;
                    if (emotions && typeof emotions === 'object') {
                        Object.entries(emotions).forEach(([key, value]) => {
                            if (typeof value === 'number' && value > 0) {
                                if (!emotionStats[key])
                                    emotionStats[key] = { sum: 0, count: 0 };
                                emotionStats[key].sum += value;
                                emotionStats[key].count += 1;
                            }
                        });
                    }
                }
                catch (e) {
                }
            });
            const dominantEmotions = Object.entries(emotionStats)
                .map(([emotion, { sum, count }]) => ({
                emotion,
                intensity: parseFloat((sum / count).toFixed(2)),
                count,
            }))
                .sort((a, b) => b.intensity - a.intensity)
                .slice(0, 5);
            const [ratingStats] = await this.conn.query(`
        SELECT 
          AVG(rating) as avg_rating,
          MIN(rating) as min_rating,
          MAX(rating) as max_rating,
          SUM(CASE WHEN rating < 5 THEN 1 ELSE 0 END) as harsh_count,
          SUM(CASE WHEN rating >= 5 AND rating <= 7 THEN 1 ELSE 0 END) as balanced_count,
          SUM(CASE WHEN rating > 7 THEN 1 ELSE 0 END) as generous_count,
          COUNT(*) as total_reviews
        FROM reviews
        WHERE user_id = ? AND rating IS NOT NULL
      `, [userId]);
            const totalReviews = (ratingStats === null || ratingStats === void 0 ? void 0 : ratingStats.total_reviews) || 0;
            const ratingTendency = {
                average: (ratingStats === null || ratingStats === void 0 ? void 0 : ratingStats.avg_rating) ? parseFloat(ratingStats.avg_rating) : 0,
                min: (ratingStats === null || ratingStats === void 0 ? void 0 : ratingStats.min_rating) || 0,
                max: (ratingStats === null || ratingStats === void 0 ? void 0 : ratingStats.max_rating) || 0,
                distribution: {
                    harsh: totalReviews > 0 ? Math.round(((ratingStats === null || ratingStats === void 0 ? void 0 : ratingStats.harsh_count) || 0) / totalReviews * 100) : 0,
                    balanced: totalReviews > 0 ? Math.round(((ratingStats === null || ratingStats === void 0 ? void 0 : ratingStats.balanced_count) || 0) / totalReviews * 100) : 0,
                    generous: totalReviews > 0 ? Math.round(((ratingStats === null || ratingStats === void 0 ? void 0 : ratingStats.generous_count) || 0) / totalReviews * 100) : 0,
                },
            };
            return {
                userId,
                favoriteGenres: genreStats.map((g) => ({
                    genre: g.genre,
                    count: g.count,
                    avgRating: parseFloat(g.avg_rating),
                })),
                favoriteAspects,
                dominantEmotions,
                preferredContentTypes: typeStats.map((t) => ({
                    type: t.type,
                    count: t.count,
                    avgRating: parseFloat(t.avg_rating),
                })),
                ratingTendency,
                totalReviews,
            };
        }
        catch (err) {
            this.logger.error(`getUserTasteProfile error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            return {
                userId,
                favoriteGenres: [],
                favoriteAspects: {},
                dominantEmotions: [],
                preferredContentTypes: [],
                ratingTendency: { average: 0, min: 0, max: 0, distribution: { harsh: 0, balanced: 0, generous: 0 } },
                totalReviews: 0,
            };
        }
    }
    async getPersonalizedRecommendations(userId, limit = 10) {
        try {
            const profile = await this.getUserTasteProfile(userId);
            if (profile.totalReviews === 0) {
                const popular = await this.conn.query(`
          SELECT 
            id as contentId,
            title,
            content_type as contentType,
            genre,
            avg_rating as avgRating,
            poster_url as posterUrl,
            release_year as releaseYear
          FROM content
          WHERE avg_rating >= 7
          ORDER BY reviews_count DESC, avg_rating DESC
          LIMIT ?
        `, [limit]);
                return popular.map((c) => ({
                    ...c,
                    matchScore: 0,
                    matchReasons: ['Популярный контент с высоким рейтингом'],
                }));
            }
            const favoriteGenres = profile.favoriteGenres.map((g) => g.genre);
            const genreFilter = favoriteGenres.length > 0 ? `AND c.genre IN (${favoriteGenres.map(() => '?').join(',')})` : '';
            const candidates = await this.conn.query(`
        SELECT 
          c.id as contentId,
          c.title,
          c.content_type as contentType,
          c.genre,
          c.avg_rating as avgRating,
          c.poster_url as posterUrl,
          c.release_year as releaseYear,
          c.perception_map as perceptionMap,
          c.emotional_cloud as emotionalCloud
        FROM content c
        WHERE c.id NOT IN (SELECT content_id FROM reviews WHERE user_id = ?)
          ${genreFilter}
          AND c.avg_rating >= ${profile.ratingTendency.average - 1}
        ORDER BY c.avg_rating DESC, c.reviews_count DESC
        LIMIT ${limit * 3}
      `, [userId, ...favoriteGenres]);
            const recommendations = candidates.map((content) => {
                let matchScore = 0;
                const matchReasons = [];
                const genreMatch = profile.favoriteGenres.find((g) => g.genre === content.genre);
                if (genreMatch) {
                    const genreScore = Math.min((genreMatch.count / profile.totalReviews) * 40, 40);
                    matchScore += genreScore;
                    matchReasons.push(`Ваш любимый жанр: ${content.genre}`);
                }
                const avgRating = parseFloat(content.avgRating);
                const ratingDiff = Math.abs(avgRating - profile.ratingTendency.average);
                const ratingScore = Math.max(20 - ratingDiff * 5, 0);
                matchScore += ratingScore;
                if (ratingScore > 10) {
                    matchReasons.push(`Рейтинг соответствует вашим предпочтениям (${avgRating.toFixed(1)})`);
                }
                if (content.perceptionMap) {
                    try {
                        const perceptionMap = typeof content.perceptionMap === 'string' ? JSON.parse(content.perceptionMap) : content.perceptionMap;
                        if (perceptionMap && typeof perceptionMap === 'object') {
                            let aspectScore = 0;
                            let matchingAspects = 0;
                            Object.entries(profile.favoriteAspects).forEach(([aspect, userPref]) => {
                                if (perceptionMap[aspect] && Math.abs(perceptionMap[aspect] - userPref) < 2) {
                                    aspectScore += 6;
                                    matchingAspects++;
                                }
                            });
                            matchScore += Math.min(aspectScore, 30);
                            if (matchingAspects > 0) {
                                matchReasons.push(`Совпадение по ${matchingAspects} аспектам`);
                            }
                        }
                    }
                    catch (e) {
                    }
                }
                if (content.emotionalCloud && profile.dominantEmotions.length > 0) {
                    try {
                        const emotionalCloud = typeof content.emotionalCloud === 'string' ? JSON.parse(content.emotionalCloud) : content.emotionalCloud;
                        if (emotionalCloud && typeof emotionalCloud === 'object') {
                            const topEmotion = profile.dominantEmotions[0].emotion;
                            if (emotionalCloud[topEmotion] && emotionalCloud[topEmotion] > 30) {
                                matchScore += 10;
                                matchReasons.push(`Вызывает эмоцию: ${topEmotion}`);
                            }
                        }
                    }
                    catch (e) {
                    }
                }
                return {
                    contentId: content.contentId,
                    title: content.title,
                    contentType: content.contentType,
                    genre: content.genre,
                    avgRating: parseFloat(content.avgRating),
                    posterUrl: content.posterUrl,
                    releaseYear: content.releaseYear,
                    matchScore: Math.round(matchScore),
                    matchReasons,
                };
            });
            return recommendations
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, limit);
        }
        catch (err) {
            this.logger.error(`getPersonalizedRecommendations error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            return [];
        }
    }
};
exports.TasteProfileService = TasteProfileService;
exports.TasteProfileService = TasteProfileService = TasteProfileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [typeorm_2.Connection])
], TasteProfileService);
//# sourceMappingURL=taste-profile.service.js.map