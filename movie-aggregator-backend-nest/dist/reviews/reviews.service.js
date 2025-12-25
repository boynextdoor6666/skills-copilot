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
var ReviewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("./entities/review.entity");
const gamification_service_1 = require("../gamification/gamification.service");
const kafka_service_1 = require("../kafka/kafka.service");
let ReviewsService = ReviewsService_1 = class ReviewsService {
    constructor(reviewRepository, connection, gamificationService, kafkaService) {
        this.reviewRepository = reviewRepository;
        this.connection = connection;
        this.gamificationService = gamificationService;
        this.kafkaService = kafkaService;
        this.logger = new common_1.Logger(ReviewsService_1.name);
    }
    async onModuleInit() {
        await this.ensureReviewsTable();
        await this.ensureReviewVotesTable();
        await this.ensureReviewVotesColumns();
    }
    async ensureReviewVotesColumns() {
        try {
            const check = await this.connection.query("SHOW COLUMNS FROM review_votes LIKE 'vote_type'");
            if (!Array.isArray(check) || check.length === 0) {
                const checkType = await this.connection.query("SHOW COLUMNS FROM review_votes LIKE 'type'");
                if (Array.isArray(checkType) && checkType.length > 0) {
                    await this.connection.query("ALTER TABLE review_votes CHANGE COLUMN `type` `vote_type` ENUM('LIKE', 'DISLIKE') NOT NULL");
                }
                else {
                    await this.connection.query("ALTER TABLE review_votes ADD COLUMN `vote_type` ENUM('LIKE', 'DISLIKE') NOT NULL");
                }
            }
        }
        catch (e) {
            this.logger.warn(`ensureReviewVotesColumns failed: ${e.message}`);
        }
    }
    async ensureReviewVotesTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS review_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        review_id INT NOT NULL,
        vote_type ENUM('LIKE', 'DISLIKE') NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_review (user_id, review_id),
        INDEX idx_votes_review (review_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
        try {
            await this.connection.query(sql);
        }
        catch (_) { }
    }
    async voteReview(userId, reviewId, voteType) {
        const existing = await this.connection.query('SELECT id, vote_type FROM review_votes WHERE user_id = ? AND review_id = ?', [userId, reviewId]);
        if (existing && Array.isArray(existing) && existing.length > 0) {
            if (existing[0].vote_type === voteType) {
                await this.connection.query('DELETE FROM review_votes WHERE id = ?', [existing[0].id]);
                return { status: 'removed' };
            }
            else {
                await this.connection.query('UPDATE review_votes SET vote_type = ? WHERE id = ?', [voteType, existing[0].id]);
                return { status: 'updated', vote: voteType };
            }
        }
        else {
            await this.connection.query('INSERT INTO review_votes (user_id, review_id, vote_type) VALUES (?, ?, ?)', [userId, reviewId, voteType]);
            return { status: 'added', vote: voteType };
        }
    }
    async getReviewVotes(reviewId) {
        const rows = await this.connection.query(`SELECT 
        SUM(CASE WHEN vote_type = 'LIKE' THEN 1 ELSE 0 END) as likes,
        SUM(CASE WHEN vote_type = 'DISLIKE' THEN 1 ELSE 0 END) as dislikes
       FROM review_votes WHERE review_id = ?`, [reviewId]);
        return rows[0] || { likes: 0, dislikes: 0 };
    }
    async recalcContentAggregates(contentId) {
        if (!contentId)
            return;
        try {
            await this.connection.query(`
        UPDATE content c
        LEFT JOIN (
          SELECT 
            r.content_id,
            ROUND(AVG(r.rating), 2) as avg_rating,
            ROUND(AVG(CASE WHEN u.role = 'CRITIC' THEN r.rating END), 2) as critics_rating,
            ROUND(AVG(CASE WHEN u.role = 'USER' THEN r.rating END), 2) as audience_rating,
            COUNT(*) as reviews_count
          FROM reviews r
          LEFT JOIN users u ON u.id = r.user_id
          WHERE r.content_id = ? AND r.rating IS NOT NULL
        ) x ON x.content_id = c.id
        SET 
          c.avg_rating = COALESCE(x.avg_rating, 0),
          c.critics_rating = COALESCE(x.critics_rating, 0),
          c.audience_rating = COALESCE(x.audience_rating, 0),
          c.reviews_count = COALESCE(x.reviews_count, 0),
          c.updated_at = CURRENT_TIMESTAMP
        WHERE c.id = ?
        `, [contentId, contentId]);
        }
        catch (e) {
            this.logger.error(`recalcContentAggregates error: ${(e === null || e === void 0 ? void 0 : e.message) || e}`);
        }
    }
    async ensureReviewsTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NULL,
        movie_id INT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        aspects JSON NULL,
        emotions JSON NULL,
        rating DECIMAL(3,1) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reviews_content (content_id),
        INDEX idx_reviews_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
        try {
            await this.connection.query(sql);
        }
        catch (_) {
        }
    }
    async ensureReviewsColumns() {
        const addIfMissing = async (col, ddl) => {
            const check = await this.connection.query('SHOW COLUMNS FROM reviews LIKE ?', [col]);
            if (!Array.isArray(check) || check.length === 0) {
                await this.connection.query(`ALTER TABLE reviews ADD COLUMN ${ddl}`);
            }
        };
        try {
            await addIfMissing('content_id', 'content_id INT NULL');
            await addIfMissing('movie_id', 'movie_id INT NULL');
            await addIfMissing('user_id', 'user_id INT NOT NULL');
            await addIfMissing('content', 'content TEXT NOT NULL');
            await addIfMissing('aspects', 'aspects JSON NULL');
            await addIfMissing('emotions', 'emotions JSON NULL');
            await addIfMissing('rating', 'rating DECIMAL(3,1) NULL');
            await addIfMissing('created_at', 'created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        }
        catch (_) {
        }
    }
    async getReviewColumnsMeta() {
        const meta = {};
        try {
            const rows = await this.connection.query('SHOW COLUMNS FROM reviews');
            if (Array.isArray(rows)) {
                rows.forEach((r) => {
                    meta[r.Field] = { nullable: String(r.Null).toUpperCase() !== 'NO' ? true : false, type: r.Type, default: r.Default };
                });
            }
        }
        catch (err) {
            const code = err === null || err === void 0 ? void 0 : err.code;
            const errno = err === null || err === void 0 ? void 0 : err.errno;
            if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
                await this.ensureReviewsTable();
                const rows2 = await this.connection.query('SHOW COLUMNS FROM reviews');
                if (Array.isArray(rows2)) {
                    rows2.forEach((r) => {
                        meta[r.Field] = { nullable: String(r.Null).toUpperCase() !== 'NO' ? true : false, type: r.Type, default: r.Default };
                    });
                }
            }
        }
        return meta;
    }
    async relaxReviewsNotNullColumns() {
        try {
            const meta = await this.getReviewColumnsMeta();
            const skip = new Set(['id', 'user_id', 'content', 'content_id', 'movie_id']);
            const alters = [];
            for (const [field, info] of Object.entries(meta)) {
                if (skip.has(field))
                    continue;
                const isNotNull = info.nullable === false;
                const hasDefault = typeof info.default !== 'undefined' && info.default !== null;
                if (isNotNull && !hasDefault && info.type) {
                    alters.push(`MODIFY COLUMN \`${field}\` ${info.type} NULL DEFAULT NULL`);
                }
            }
            if (alters.length > 0) {
                const sql = `ALTER TABLE reviews ${alters.join(', ')}`;
                await this.connection.query(sql);
            }
        }
        catch (_) {
        }
    }
    async ensureMoviesColumns() {
        const addIfMissing = async (col, ddl) => {
            const check = await this.connection.query('SHOW COLUMNS FROM movies LIKE ?', [col]);
            if (!Array.isArray(check) || check.length === 0) {
                await this.connection.query(`ALTER TABLE movies ADD COLUMN ${ddl}`);
            }
        };
        try {
            await addIfMissing('reviews_count', 'reviews_count INT DEFAULT 0');
            await addIfMissing('overall_rating', 'overall_rating DECIMAL(5,2) DEFAULT 0');
            await addIfMissing('audience_rating', 'audience_rating DECIMAL(5,2) DEFAULT 0');
            await addIfMissing('critics_rating', 'critics_rating DECIMAL(5,2) DEFAULT 0');
            await addIfMissing('hype_index', 'hype_index INT DEFAULT 0');
            await addIfMissing('emotional_cloud', 'emotional_cloud JSON NULL');
            await addIfMissing('perception_map', 'perception_map JSON NULL');
        }
        catch (_) { }
    }
    buildInsertForReviews(columns, data) {
        var _a;
        const fields = [];
        const values = [];
        const hasContentId = Object.prototype.hasOwnProperty.call(columns, 'content_id');
        const hasMovieId = Object.prototype.hasOwnProperty.call(columns, 'movie_id');
        const movieNotNull = hasMovieId && ((_a = columns['movie_id']) === null || _a === void 0 ? void 0 : _a.nullable) === false;
        if (hasContentId) {
            fields.push('`content_id`');
            values.push(typeof data.content_id !== 'undefined' ? data.content_id : null);
        }
        else if (hasMovieId) {
            fields.push('`movie_id`');
            values.push(typeof data.movie_id !== 'undefined' ? data.movie_id : (typeof data.content_id !== 'undefined' ? data.content_id : null));
        }
        if (hasMovieId) {
            const alreadyHasMovie = fields.includes('`movie_id`');
            if (!alreadyHasMovie) {
                if (movieNotNull || typeof data.movie_id !== 'undefined') {
                    fields.push('`movie_id`');
                    const mv = typeof data.movie_id !== 'undefined' ? data.movie_id : (typeof data.content_id !== 'undefined' ? data.content_id : null);
                    values.push(mv);
                }
            }
        }
        if (Object.prototype.hasOwnProperty.call(columns, 'user_id') && typeof data.user_id !== 'undefined') {
            fields.push('`user_id`');
            values.push(data.user_id);
        }
        if (Object.prototype.hasOwnProperty.call(columns, 'content') && typeof data.content !== 'undefined') {
            fields.push('`content`');
            values.push(data.content);
        }
        if (Object.prototype.hasOwnProperty.call(columns, 'aspects') && typeof data.aspects !== 'undefined') {
            fields.push('`aspects`');
            values.push(data.aspects);
        }
        if (Object.prototype.hasOwnProperty.call(columns, 'emotions') && typeof data.emotions !== 'undefined') {
            fields.push('`emotions`');
            values.push(data.emotions);
        }
        if (Object.prototype.hasOwnProperty.call(columns, 'rating') && typeof data.rating !== 'undefined') {
            fields.push('`rating`');
            values.push(data.rating);
        }
        const placeholders = fields.map(() => '?').join(', ');
        const fieldList = fields.join(', ');
        const sql = `INSERT INTO reviews (${fieldList}) VALUES (${placeholders})`;
        return { sql, values };
    }
    async checkReviewAchievements(userId, reviewData) {
        try {
            const count = await this.reviewRepository.count({ where: { user_id: userId } });
            const results = await this.gamificationService.checkAndAward(userId, 'review_count', count);
            if (reviewData) {
                if (reviewData.content) {
                    const lengthResults = await this.gamificationService.checkAndAward(userId, 'review_length', reviewData.content.length);
                    results.push(...lengthResults);
                }
                if (reviewData.rating !== undefined && reviewData.rating !== null) {
                    const ratingResults = await this.gamificationService.checkAndAward(userId, 'rating_value', Number(reviewData.rating));
                    results.push(...ratingResults);
                }
            }
            return results;
        }
        catch (e) {
            this.logger.error(`Failed to check achievements for user ${userId}: ${e.message}`);
            return [];
        }
    }
    async addViewerReview(userId, createDto) {
        var _a, _b, _c;
        const { content_id, content, aspects, emotions, rating } = createDto;
        try {
            this.logger.log(`CALL add_review_viewer user=${userId} content=${content_id}`);
            const result = await this.connection.query('CALL add_review_viewer(?, ?, ?, ?, ?, ?)', [
                userId,
                content_id,
                aspects ? JSON.stringify(aspects) : null,
                emotions ? JSON.stringify(emotions) : null,
                rating !== null && rating !== void 0 ? rating : null,
                content,
            ]);
            this.logger.log(`add_review_viewer OK content=${content_id} review_id=${(_c = (_b = (_a = result === null || result === void 0 ? void 0 : result[0]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.review_id) !== null && _c !== void 0 ? _c : '-'} `);
            await this.recalcContentAggregates(content_id);
            const newAchievements = await this.checkReviewAchievements(userId, { content, rating: rating !== null && rating !== void 0 ? rating : undefined });
            await this.gamificationService.awardXp(userId, 5);
            await this.kafkaService.emitReviewCreated(userId, content_id, 'UNKNOWN', rating !== null && rating !== void 0 ? rating : 0, emotions, aspects);
            return { ...result[0][0], newAchievements };
        }
        catch (e) {
            this.logger.warn(`add_review_viewer failed, using fallback insert. code=${e === null || e === void 0 ? void 0 : e.code} errno=${e === null || e === void 0 ? void 0 : e.errno} msg=${(e === null || e === void 0 ? void 0 : e.sqlMessage) || (e === null || e === void 0 ? void 0 : e.message)}`);
            await this.ensureReviewsTable();
            await this.ensureReviewsColumns();
            try {
                await this.connection.query('ALTER TABLE content ADD COLUMN reviews_count INT DEFAULT 0');
            }
            catch (_) { }
            try {
                await this.connection.query('ALTER TABLE movies ADD COLUMN reviews_count INT DEFAULT 0');
            }
            catch (_) { }
            await this.ensureMoviesColumns();
            await this.relaxReviewsNotNullColumns();
            const colMeta = await this.getReviewColumnsMeta();
            const { sql, values } = this.buildInsertForReviews(colMeta, {
                content_id,
                movie_id: content_id,
                user_id: userId,
                content,
                aspects: aspects ? JSON.stringify(aspects) : undefined,
                emotions: emotions ? JSON.stringify(emotions) : undefined,
                rating: typeof rating === 'number' ? rating : (rating == null ? null : Number(rating)),
            });
            try {
                const res = await this.connection.query(sql, values);
                this.logger.log(`fallback insert OK content=${content_id} review_id=${res.insertId}`);
                await this.recalcContentAggregates(content_id);
                const newAchievements = await this.checkReviewAchievements(userId, { content, rating: rating !== null && rating !== void 0 ? rating : undefined });
                await this.gamificationService.awardXp(userId, 5);
                return { review_id: res.insertId, status: 'inserted', newAchievements };
            }
            catch (err) {
                const code = err === null || err === void 0 ? void 0 : err.code;
                const errno = err === null || err === void 0 ? void 0 : err.errno;
                const msg = (err === null || err === void 0 ? void 0 : err.sqlMessage) || (err === null || err === void 0 ? void 0 : err.message) || '';
                if (code === 'ER_BAD_FIELD_ERROR' || errno === 1054) {
                    try {
                        if (/reviews_count/.test(String(msg))) {
                            await this.connection.query('ALTER TABLE content ADD COLUMN reviews_count INT DEFAULT 0');
                            await this.connection.query('ALTER TABLE movies ADD COLUMN reviews_count INT DEFAULT 0');
                        }
                        if (/overall_rating|audience_rating|critics_rating|hype_index|emotional_cloud|perception_map/.test(String(msg))) {
                            await this.ensureMoviesColumns();
                        }
                        const resRetry = await this.connection.query(sql, values);
                        this.logger.log(`fallback retry insert OK content=${content_id} review_id=${resRetry.insertId}`);
                        await this.recalcContentAggregates(content_id);
                        const newAchievements = await this.checkReviewAchievements(userId, { content, rating: rating !== null && rating !== void 0 ? rating : undefined });
                        return { review_id: resRetry.insertId, status: 'inserted', newAchievements };
                    }
                    catch (_) {
                    }
                }
                this.logger.error(`addViewerReview insert failed code=${err === null || err === void 0 ? void 0 : err.code} errno=${err === null || err === void 0 ? void 0 : err.errno} msg=${(err === null || err === void 0 ? void 0 : err.sqlMessage) || (err === null || err === void 0 ? void 0 : err.message)}`);
                throw new common_1.InternalServerErrorException((err === null || err === void 0 ? void 0 : err.sqlMessage) || (err === null || err === void 0 ? void 0 : err.message) || 'Insert failed');
            }
        }
    }
    async publishProReview(userId, publishDto) {
        var _a, _b, _c;
        const { content_id, review_text, aspects, emotions, rating } = publishDto;
        try {
            this.logger.log(`CALL publish_pro_review critic=${userId} content=${content_id}`);
            const result = await this.connection.query('CALL publish_pro_review(?, ?, ?, ?, ?, ?)', [
                content_id,
                userId,
                review_text,
                JSON.stringify(aspects !== null && aspects !== void 0 ? aspects : {}),
                JSON.stringify(emotions !== null && emotions !== void 0 ? emotions : {}),
                rating !== null && rating !== void 0 ? rating : null,
            ]);
            this.logger.log(`publish_pro_review OK content=${content_id} review_id=${(_c = (_b = (_a = result === null || result === void 0 ? void 0 : result[0]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.review_id) !== null && _c !== void 0 ? _c : '-'}`);
            await this.recalcContentAggregates(content_id);
            const newAchievements = await this.checkReviewAchievements(userId, { content: review_text, rating: rating !== null && rating !== void 0 ? rating : undefined });
            await this.gamificationService.awardXp(userId, 15);
            return { ...result[0][0], newAchievements };
        }
        catch (e) {
            this.logger.warn(`publish_pro_review failed, using fallback insert. code=${e === null || e === void 0 ? void 0 : e.code} errno=${e === null || e === void 0 ? void 0 : e.errno} msg=${(e === null || e === void 0 ? void 0 : e.sqlMessage) || (e === null || e === void 0 ? void 0 : e.message)}`);
            await this.ensureReviewsTable();
            await this.ensureReviewsColumns();
            try {
                await this.connection.query('ALTER TABLE content ADD COLUMN reviews_count INT DEFAULT 0');
            }
            catch (_) { }
            try {
                await this.connection.query('ALTER TABLE movies ADD COLUMN reviews_count INT DEFAULT 0');
            }
            catch (_) { }
            await this.ensureMoviesColumns();
            await this.relaxReviewsNotNullColumns();
            const colMeta = await this.getReviewColumnsMeta();
            const { sql, values } = this.buildInsertForReviews(colMeta, {
                content_id,
                movie_id: content_id,
                user_id: userId,
                content: review_text,
                aspects: aspects ? JSON.stringify(aspects) : undefined,
                emotions: emotions ? JSON.stringify(emotions) : undefined,
                rating: typeof rating === 'number' ? rating : (rating == null ? null : Number(rating)),
            });
            try {
                const res = await this.connection.query(sql, values);
                this.logger.log(`fallback insert (pro) OK content=${content_id} review_id=${res.insertId}`);
                await this.recalcContentAggregates(content_id);
                const newAchievements = await this.checkReviewAchievements(userId, { content: review_text, rating: rating !== null && rating !== void 0 ? rating : undefined });
                await this.gamificationService.awardXp(userId, 15);
                return { review_id: res.insertId, status: 'inserted', newAchievements };
            }
            catch (err) {
                const code = err === null || err === void 0 ? void 0 : err.code;
                const errno = err === null || err === void 0 ? void 0 : err.errno;
                const msg = (err === null || err === void 0 ? void 0 : err.sqlMessage) || (err === null || err === void 0 ? void 0 : err.message) || '';
                if (code === 'ER_BAD_FIELD_ERROR' || errno === 1054) {
                    try {
                        if (/reviews_count/.test(String(msg))) {
                            await this.connection.query('ALTER TABLE content ADD COLUMN reviews_count INT DEFAULT 0');
                            await this.connection.query('ALTER TABLE movies ADD COLUMN reviews_count INT DEFAULT 0');
                        }
                        if (/overall_rating|audience_rating|critics_rating|hype_index|emotional_cloud|perception_map/.test(String(msg))) {
                            await this.ensureMoviesColumns();
                        }
                        const resRetry = await this.connection.query(sql, values);
                        this.logger.log(`fallback retry insert (pro) OK content=${content_id} review_id=${resRetry.insertId}`);
                        await this.recalcContentAggregates(content_id);
                        const newAchievements = await this.checkReviewAchievements(userId, { content: review_text, rating: rating !== null && rating !== void 0 ? rating : undefined });
                        return { review_id: resRetry.insertId, status: 'inserted', newAchievements };
                    }
                    catch (_) { }
                }
                this.logger.error(`publishProReview insert failed code=${err === null || err === void 0 ? void 0 : err.code} errno=${err === null || err === void 0 ? void 0 : err.errno} msg=${(err === null || err === void 0 ? void 0 : err.sqlMessage) || (err === null || err === void 0 ? void 0 : err.message)}`);
                throw new common_1.InternalServerErrorException((err === null || err === void 0 ? void 0 : err.sqlMessage) || (err === null || err === void 0 ? void 0 : err.message) || 'Insert failed');
            }
        }
    }
    async deleteReview(reviewId, adminId, reason) {
        try {
            const result = await this.connection.query('CALL admin_delete_review(?, ?, ?)', [reviewId, adminId, reason]);
            return result[0][0];
        }
        catch (e) {
            try {
                await this.connection.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
                return { status: 'deleted' };
            }
            catch (err) {
                const code = err === null || err === void 0 ? void 0 : err.code;
                const errno = err === null || err === void 0 ? void 0 : err.errno;
                if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
                    await this.ensureReviewsTable();
                    return { status: 'noop' };
                }
                throw err;
            }
        }
    }
    async getReviewsByContent(contentId) {
        try {
            const rows = await this.connection.query(`SELECT 
           r.*, 
           u.username, 
           u.avatar_url,
           (SELECT COUNT(*) FROM review_votes rv WHERE rv.review_id = r.id AND rv.vote_type = 'LIKE') as likes,
           (SELECT COUNT(*) FROM review_votes rv WHERE rv.review_id = r.id AND rv.vote_type = 'DISLIKE') as dislikes
         FROM reviews r 
         LEFT JOIN users u ON r.user_id = u.id 
         WHERE r.content_id = ? 
         ORDER BY r.id DESC`, [contentId]);
            return rows;
        }
        catch (e) {
            try {
                const rows2 = await this.connection.query(`SELECT 
             r.*, 
             u.username, 
             u.avatar_url,
             (SELECT COUNT(*) FROM review_votes rv WHERE rv.review_id = r.id AND rv.vote_type = 'LIKE') as likes,
             (SELECT COUNT(*) FROM review_votes rv WHERE rv.review_id = r.id AND rv.vote_type = 'DISLIKE') as dislikes
           FROM reviews r 
           LEFT JOIN users u ON r.user_id = u.id 
           WHERE r.movie_id = ? 
           ORDER BY r.id DESC`, [contentId]);
                return rows2;
            }
            catch (err) {
                const code = err === null || err === void 0 ? void 0 : err.code;
                const errno = err === null || err === void 0 ? void 0 : err.errno;
                if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
                    await this.ensureReviewsTable();
                    return [];
                }
                throw err;
            }
        }
    }
    async getReviewsByUser(userId) {
        try {
            return await this.reviewRepository.find({
                where: { user_id: userId },
                order: { id: 'DESC' },
            });
        }
        catch (err) {
            const code = err === null || err === void 0 ? void 0 : err.code;
            const errno = err === null || err === void 0 ? void 0 : err.errno;
            if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
                await this.ensureReviewsTable();
                return [];
            }
            throw err;
        }
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = ReviewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(1, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection,
        gamification_service_1.GamificationService,
        kafka_service_1.KafkaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map