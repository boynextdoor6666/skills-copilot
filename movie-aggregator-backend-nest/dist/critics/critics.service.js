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
var CriticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let CriticsService = CriticsService_1 = class CriticsService {
    constructor(conn) {
        this.conn = conn;
        this.logger = new common_1.Logger(CriticsService_1.name);
    }
    async onModuleInit() {
        await this.ensureCriticsSchema();
        await this.ensurePublicationsSchema();
    }
    async ensurePublicationsSchema() {
        try {
            await this.conn.query(`
        CREATE TABLE IF NOT EXISTS publications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          logo_url VARCHAR(500) NULL,
          website VARCHAR(255) NULL,
          description TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
            const pubCol = await this.conn.query('SHOW COLUMNS FROM users LIKE "publication_id"');
            if (!Array.isArray(pubCol) || pubCol.length === 0) {
                try {
                    await this.conn.query('ALTER TABLE users ADD COLUMN publication_id INT NULL');
                    await this.conn.query('ALTER TABLE users ADD CONSTRAINT fk_user_publication FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE SET NULL');
                }
                catch { }
            }
        }
        catch {
        }
    }
    async ensureCriticsSchema() {
        try {
            await this.conn.query(`
        CREATE TABLE IF NOT EXISTS user_critic_preferences (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          critic_id BIGINT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_critic (user_id, critic_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
            try {
                await this.conn.query(`ALTER TABLE user_critic_preferences MODIFY COLUMN user_id BIGINT NOT NULL`);
                await this.conn.query(`ALTER TABLE user_critic_preferences MODIFY COLUMN critic_id BIGINT NOT NULL`);
            }
            catch (e) {
            }
            try {
                const [fkUser] = await this.conn.query(`SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_critic_preferences' AND CONSTRAINT_NAME = 'fk_ucp_user'`);
                if (!fkUser) {
                    await this.conn.query(`DELETE FROM user_critic_preferences WHERE user_id NOT IN (SELECT id FROM users)`);
                    await this.conn.query(`ALTER TABLE user_critic_preferences ADD CONSTRAINT fk_ucp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
                }
            }
            catch { }
            try {
                const [fkCritic] = await this.conn.query(`SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_critic_preferences' AND CONSTRAINT_NAME = 'fk_ucp_critic'`);
                if (!fkCritic) {
                    await this.conn.query(`DELETE FROM user_critic_preferences WHERE critic_id NOT IN (SELECT id FROM users)`);
                    await this.conn.query(`ALTER TABLE user_critic_preferences ADD CONSTRAINT fk_ucp_critic FOREIGN KEY (critic_id) REFERENCES users(id) ON DELETE CASCADE`);
                }
            }
            catch { }
            const regCol = await this.conn.query('SHOW COLUMNS FROM users LIKE "registration_date"');
            if (!Array.isArray(regCol) || regCol.length === 0) {
                try {
                    await this.conn.query('ALTER TABLE users ADD COLUMN registration_date DATETIME NULL');
                }
                catch { }
            }
            const ratingCol = await this.conn.query('SHOW COLUMNS FROM reviews LIKE "rating"');
            if (!Array.isArray(ratingCol) || ratingCol.length === 0) {
                try {
                    await this.conn.query('ALTER TABLE reviews ADD COLUMN rating DECIMAL(3,1) NULL');
                }
                catch { }
            }
        }
        catch (err) {
            this.logger.warn(`ensureCriticsSchema failed (non-fatal): ${err === null || err === void 0 ? void 0 : err.message}`);
        }
    }
    async getAllCritics() {
        try {
            const critics = await this.conn.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          u.registration_date,
          COUNT(DISTINCT r.id) as review_count,
          COALESCE(AVG(r.rating), 0) as avg_rating_given
        FROM users u
        LEFT JOIN reviews r ON r.user_id = u.id
        WHERE u.role = 'CRITIC'
        GROUP BY u.id, u.username, u.email, u.role, u.registration_date
        ORDER BY review_count DESC, u.username ASC
      `);
            return critics.map(critic => ({
                ...critic,
                review_count: Number(critic.review_count) || 0,
                avg_rating_given: Number(critic.avg_rating_given) || 0
            }));
        }
        catch (err) {
            this.logger.error(`getAllCritics error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            const errno = (err === null || err === void 0 ? void 0 : err.errno) || (err === null || err === void 0 ? void 0 : err.code);
            if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1054 || errno === 'ER_BAD_FIELD_ERROR') {
                await this.ensureCriticsSchema();
                try {
                    const critics = await this.conn.query(`
            SELECT 
              u.id,
              u.username,
              u.email,
              u.role,
              u.registration_date,
              COUNT(DISTINCT r.id) as review_count,
              COALESCE(AVG(r.rating), 0) as avg_rating_given
            FROM users u
            LEFT JOIN reviews r ON r.user_id = u.id
            WHERE u.role = 'CRITIC'
            GROUP BY u.id, u.username, u.email, u.role, u.registration_date
            ORDER BY review_count DESC, u.username ASC
          `);
                    return critics.map((c) => ({
                        ...c,
                        review_count: Number(c.review_count) || 0,
                        avg_rating_given: Number(c.avg_rating_given) || 0
                    }));
                }
                catch (e2) {
                    this.logger.error(`retry getAllCritics failed: ${(e2 === null || e2 === void 0 ? void 0 : e2.message) || e2}`);
                }
            }
            throw new common_1.InternalServerErrorException('Failed to fetch critics');
        }
    }
    async getFollowedCritics(userId) {
        try {
            const followed = await this.conn.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          ucp.created_at as followed_at,
          COUNT(DISTINCT r.id) as review_count,
          COALESCE(AVG(r.rating), 0) as avg_rating_given
        FROM user_critic_preferences ucp
        JOIN users u ON u.id = ucp.critic_id
        LEFT JOIN reviews r ON r.user_id = u.id
        WHERE ucp.user_id = ? AND u.role = 'CRITIC'
        GROUP BY u.id, u.username, u.email, u.role, ucp.created_at
        ORDER BY ucp.created_at DESC
      `, [userId]);
            return followed.map((row) => ({
                ...row,
                review_count: Number(row.review_count) || 0,
                avg_rating_given: Number(row.avg_rating_given) || 0,
            }));
        }
        catch (err) {
            this.logger.error(`getFollowedCritics error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            const errno = (err === null || err === void 0 ? void 0 : err.errno) || (err === null || err === void 0 ? void 0 : err.code);
            if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1054 || errno === 'ER_BAD_FIELD_ERROR') {
                await this.ensureCriticsSchema();
                try {
                    const followed = await this.conn.query(`
            SELECT 
              u.id,
              u.username,
              u.email,
              u.role,
              ucp.created_at as followed_at,
              COUNT(DISTINCT r.id) as review_count,
              COALESCE(AVG(r.rating), 0) as avg_rating_given
            FROM user_critic_preferences ucp
            JOIN users u ON u.id = ucp.critic_id
            LEFT JOIN reviews r ON r.user_id = u.id
            WHERE ucp.user_id = ? AND u.role = 'CRITIC'
            GROUP BY u.id, u.username, u.email, u.role, ucp.created_at
            ORDER BY ucp.created_at DESC
          `, [userId]);
                    return followed.map((row) => ({
                        ...row,
                        review_count: Number(row.review_count) || 0,
                        avg_rating_given: Number(row.avg_rating_given) || 0,
                    }));
                }
                catch (e2) {
                    this.logger.error(`retry getFollowedCritics failed: ${(e2 === null || e2 === void 0 ? void 0 : e2.message) || e2}`);
                }
            }
            throw new common_1.InternalServerErrorException('Failed to fetch followed critics');
        }
    }
    async followCritic(userId, criticId) {
        try {
            const [critic] = await this.conn.query(`
        SELECT id, role FROM users WHERE id = ? AND role = 'CRITIC'
      `, [criticId]);
            if (!critic) {
                throw new common_1.NotFoundException('Critic not found');
            }
            await this.conn.query(`
        INSERT IGNORE INTO user_critic_preferences (user_id, critic_id, created_at)
        VALUES (?, ?, NOW())
      `, [userId, criticId]);
            return { success: true, message: 'Critic followed successfully' };
        }
        catch (err) {
            if (err instanceof common_1.NotFoundException)
                throw err;
            this.logger.error(`followCritic error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            const errno = (err === null || err === void 0 ? void 0 : err.errno) || (err === null || err === void 0 ? void 0 : err.code);
            if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1452 || errno === 'ER_NO_REFERENCED_ROW_2') {
                await this.ensureCriticsSchema();
                try {
                    await this.conn.query(`
            INSERT IGNORE INTO user_critic_preferences (user_id, critic_id, created_at)
            VALUES (?, ?, NOW())
          `, [userId, criticId]);
                    return { success: true, message: 'Critic followed successfully' };
                }
                catch (e2) {
                    this.logger.error(`retry followCritic failed: ${(e2 === null || e2 === void 0 ? void 0 : e2.message) || e2}`);
                }
            }
            throw new common_1.InternalServerErrorException('Failed to follow critic');
        }
    }
    async unfollowCritic(userId, criticId) {
        try {
            await this.conn.query(`
        DELETE FROM user_critic_preferences
        WHERE user_id = ? AND critic_id = ?
      `, [userId, criticId]);
            return { success: true, message: 'Critic unfollowed successfully' };
        }
        catch (err) {
            this.logger.error(`unfollowCritic error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            throw new common_1.InternalServerErrorException('Failed to unfollow critic');
        }
    }
    async getPersonalizedRating(userId, contentId) {
        try {
            const [result] = await this.conn.query(`
        SELECT 
          AVG(r.rating) as personal_rating,
          COUNT(r.id) as review_count
        FROM reviews r
        JOIN user_critic_preferences ucp ON ucp.critic_id = r.user_id
        WHERE ucp.user_id = ? AND r.content_id = ? AND r.rating IS NOT NULL
      `, [userId, contentId]);
            return {
                personalRating: (result === null || result === void 0 ? void 0 : result.personal_rating) ? parseFloat(result.personal_rating) : null,
                reviewCount: (result === null || result === void 0 ? void 0 : result.review_count) || 0
            };
        }
        catch (err) {
            this.logger.error(`getPersonalizedRating error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            const errno = (err === null || err === void 0 ? void 0 : err.errno) || (err === null || err === void 0 ? void 0 : err.code);
            if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1054 || errno === 'ER_BAD_FIELD_ERROR') {
                await this.ensureCriticsSchema();
                try {
                    const [result] = await this.conn.query(`
            SELECT 
              AVG(r.rating) as personal_rating,
              COUNT(r.id) as review_count
            FROM reviews r
            JOIN user_critic_preferences ucp ON ucp.critic_id = r.user_id
            WHERE ucp.user_id = ? AND r.content_id = ? AND r.rating IS NOT NULL
          `, [userId, contentId]);
                    return {
                        personalRating: (result === null || result === void 0 ? void 0 : result.personal_rating) ? parseFloat(result.personal_rating) : null,
                        reviewCount: (result === null || result === void 0 ? void 0 : result.review_count) || 0
                    };
                }
                catch (e2) {
                    this.logger.error(`retry getPersonalizedRating failed: ${(e2 === null || e2 === void 0 ? void 0 : e2.message) || e2}`);
                }
            }
            throw new common_1.InternalServerErrorException('Failed to calculate personalized rating');
        }
    }
    async getPersonalizedRatings(userId, contentIds) {
        if (!contentIds.length)
            return {};
        try {
            const placeholders = contentIds.map(() => '?').join(',');
            const results = await this.conn.query(`
        SELECT 
          r.content_id,
          AVG(r.rating) as personal_rating,
          COUNT(r.id) as review_count
        FROM reviews r
        JOIN user_critic_preferences ucp ON ucp.critic_id = r.user_id
        WHERE ucp.user_id = ? AND r.content_id IN (${placeholders}) AND r.rating IS NOT NULL
        GROUP BY r.content_id
      `, [userId, ...contentIds]);
            const ratingsMap = {};
            results.forEach((row) => {
                ratingsMap[row.content_id] = {
                    personalRating: row.personal_rating ? parseFloat(row.personal_rating) : null,
                    reviewCount: row.review_count || 0
                };
            });
            return ratingsMap;
        }
        catch (err) {
            this.logger.error(`getPersonalizedRatings error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            const errno = (err === null || err === void 0 ? void 0 : err.errno) || (err === null || err === void 0 ? void 0 : err.code);
            if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1054 || errno === 'ER_BAD_FIELD_ERROR') {
                await this.ensureCriticsSchema();
                try {
                    const placeholders = contentIds.map(() => '?').join(',');
                    const results = await this.conn.query(`
            SELECT 
              r.content_id,
              AVG(r.rating) as personal_rating,
              COUNT(r.id) as review_count
            FROM reviews r
            JOIN user_critic_preferences ucp ON ucp.critic_id = r.user_id
            WHERE ucp.user_id = ? AND r.content_id IN (${placeholders}) AND r.rating IS NOT NULL
            GROUP BY r.content_id
          `, [userId, ...contentIds]);
                    const ratingsMap = {};
                    results.forEach((row) => {
                        ratingsMap[row.content_id] = {
                            personalRating: row.personal_rating ? parseFloat(row.personal_rating) : null,
                            reviewCount: row.review_count || 0
                        };
                    });
                    return ratingsMap;
                }
                catch (e2) {
                    this.logger.error(`retry getPersonalizedRatings failed: ${(e2 === null || e2 === void 0 ? void 0 : e2.message) || e2}`);
                }
            }
            throw new common_1.InternalServerErrorException('Failed to calculate personalized ratings');
        }
    }
    async getAllPublications() {
        return this.conn.query('SELECT * FROM publications ORDER BY name ASC');
    }
    async createPublication(data) {
        const res = await this.conn.query('INSERT INTO publications (name, logo_url, website, description) VALUES (?, ?, ?, ?)', [data.name, data.logo_url, data.website, data.description]);
        return { id: res.insertId, ...data };
    }
    async updatePublication(id, data) {
        await this.conn.query('UPDATE publications SET name = ?, logo_url = ?, website = ?, description = ? WHERE id = ?', [data.name, data.logo_url, data.website, data.description, id]);
        return { id, ...data };
    }
    async deletePublication(id) {
        await this.conn.query('DELETE FROM publications WHERE id = ?', [id]);
        return { message: 'Publication deleted' };
    }
};
exports.CriticsService = CriticsService;
exports.CriticsService = CriticsService = CriticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [typeorm_2.Connection])
], CriticsService);
//# sourceMappingURL=critics.service.js.map