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
var ContentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const content_entity_1 = require("./entities/content.entity");
const hero_carousel_entity_1 = require("./entities/hero-carousel.entity");
const coming_soon_entity_1 = require("./entities/coming-soon.entity");
let ContentService = ContentService_1 = class ContentService {
    constructor(contentRepository, heroCarouselRepository, comingSoonRepository, connection) {
        this.contentRepository = contentRepository;
        this.heroCarouselRepository = heroCarouselRepository;
        this.comingSoonRepository = comingSoonRepository;
        this.connection = connection;
        this.logger = new common_1.Logger(ContentService_1.name);
    }
    async onModuleInit() {
        await this.ensureContentTable();
        await this.ensureContentColumns();
        await this.ensureHeroCarouselTable();
        await this.ensureComingSoonTable();
    }
    async ensureContentTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content_type ENUM('MOVIE','TV_SERIES','GAME') DEFAULT 'MOVIE',
        release_year INT NULL,
        genre VARCHAR(100) NULL,
        description TEXT NULL,
        avg_rating DECIMAL(5,2) DEFAULT 0,
        critics_rating DECIMAL(5,2) DEFAULT 0,
        audience_rating DECIMAL(5,2) DEFAULT 0,
        hype_index INT DEFAULT 0,
        reviews_count INT DEFAULT 0,
        emotional_cloud JSON NULL,
        perception_map JSON NULL,
        poster_url VARCHAR(500) NULL,
        trailer_url VARCHAR(500) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
        try {
            await this.connection.query(sql);
        }
        catch (e) {
        }
    }
    async ensureHeroCarouselTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS hero_carousel (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NULL,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(500) NULL,
        description TEXT NULL,
        background_image VARCHAR(500) NULL,
        call_to_action_text VARCHAR(100) NULL,
        call_to_action_link VARCHAR(500) NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_active (is_active),
        INDEX idx_display_order (display_order),
        CONSTRAINT fk_hero_content_id FOREIGN KEY (content_id) REFERENCES content(id)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
        try {
            await this.connection.query(sql);
        }
        catch (_) { }
    }
    async ensureComingSoonTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS coming_soon_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content_type ENUM('MOVIE','TV_SERIES','GAME') NOT NULL,
        release_date DATE NOT NULL,
        description TEXT NULL,
        poster_url VARCHAR(500) NULL,
        trailer_url VARCHAR(500) NULL,
        expected_score INT NULL,
        genre VARCHAR(100) NULL,
        developer VARCHAR(255) NULL,
        director VARCHAR(255) NULL,
        creator VARCHAR(255) NULL,
        studio VARCHAR(255) NULL,
        network VARCHAR(255) NULL,
        publisher VARCHAR(255) NULL,
        platforms JSON NULL,
        watchlist_count INT DEFAULT 0,
        screenshots JSON NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_release_date (release_date),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
        try {
            await this.connection.query(sql);
        }
        catch (_) { }
    }
    async ensureContentColumns() {
        const addIfMissing = async (col, ddl) => {
            const check = await this.connection.query('SHOW COLUMNS FROM content LIKE ?', [col]);
            if (!Array.isArray(check) || check.length === 0) {
                await this.connection.query(`ALTER TABLE content ADD COLUMN ${ddl}`);
            }
        };
        try {
            await addIfMissing('content_type', "content_type ENUM('MOVIE','TV_SERIES','GAME') DEFAULT 'MOVIE'");
            await addIfMissing('poster_url', 'poster_url VARCHAR(500) NULL');
            await addIfMissing('trailer_url', 'trailer_url VARCHAR(500) NULL');
            await addIfMissing('avg_rating', 'avg_rating DECIMAL(5,2) DEFAULT 0');
            await addIfMissing('critics_rating', 'critics_rating DECIMAL(5,2) DEFAULT 0');
            await addIfMissing('audience_rating', 'audience_rating DECIMAL(5,2) DEFAULT 0');
            await addIfMissing('hype_index', 'hype_index INT DEFAULT 0');
            await addIfMissing('reviews_count', 'reviews_count INT DEFAULT 0');
            await addIfMissing('description', 'description TEXT NULL');
            await addIfMissing('release_year', 'release_year INT NULL');
            await addIfMissing('genre', 'genre VARCHAR(100) NULL');
            await addIfMissing('emotional_cloud', 'emotional_cloud JSON NULL');
            await addIfMissing('perception_map', 'perception_map JSON NULL');
            await addIfMissing('positive_reviews', 'positive_reviews INT DEFAULT 0');
            await addIfMissing('mixed_reviews', 'mixed_reviews INT DEFAULT 0');
            await addIfMissing('negative_reviews', 'negative_reviews INT DEFAULT 0');
            await addIfMissing('director', 'director VARCHAR(255) NULL');
            await addIfMissing('cast', 'cast TEXT NULL');
            await addIfMissing('director_photo_url', 'director_photo_url VARCHAR(500) NULL');
            await addIfMissing('cast_photos', 'cast_photos JSON NULL');
            await addIfMissing('runtime', 'runtime INT NULL');
            await addIfMissing('developer', 'developer VARCHAR(255) NULL');
            await addIfMissing('publisher', 'publisher VARCHAR(255) NULL');
            await addIfMissing('platforms', 'platforms JSON NULL');
            await addIfMissing('esrb_rating', 'esrb_rating VARCHAR(50) NULL');
            await addIfMissing('players', 'players VARCHAR(50) NULL');
            await addIfMissing('file_size', 'file_size VARCHAR(50) NULL');
            await addIfMissing('technical_info', 'technical_info JSON NULL');
        }
        catch (_) {
        }
    }
    async searchContent(searchDto) {
        const { query, content_type, limit } = searchDto;
        try {
            const result = await this.connection.query('CALL after_search(?, ?, ?)', [
                query || null,
                content_type || null,
                Number(limit) || 20,
            ]);
            return result[0];
        }
        catch (e) {
            const lim = Math.min(Math.max(Number(limit) || 20, 1), 200);
            const qb = this.contentRepository.createQueryBuilder('content');
            if (query) {
                qb.where('content.title LIKE :q', { q: `%${query}%` });
            }
            if (content_type) {
                try {
                    const hasContentType = await this.connection.query('SHOW COLUMNS FROM content LIKE "content_type"');
                    let columnName = null;
                    if (Array.isArray(hasContentType) && hasContentType.length > 0) {
                        columnName = 'content_type';
                    }
                    else {
                        const hasType = await this.connection.query('SHOW COLUMNS FROM content LIKE "type"');
                        if (Array.isArray(hasType) && hasType.length > 0) {
                            columnName = 'type';
                        }
                    }
                    if (columnName) {
                        if (query)
                            qb.andWhere(`content.${columnName} = :ctype`, { ctype: content_type });
                        else
                            qb.where(`content.${columnName} = :ctype`, { ctype: content_type });
                    }
                }
                catch { }
            }
            try {
                return await qb.orderBy('content.id', 'DESC').limit(lim).getMany();
            }
            catch (err) {
                const code = err === null || err === void 0 ? void 0 : err.code;
                const errno = err === null || err === void 0 ? void 0 : err.errno;
                if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
                    await this.ensureContentTable();
                    return qb.orderBy('content.id', 'DESC').limit(lim).getMany();
                }
                else if (code === 'ER_BAD_FIELD_ERROR' || errno === 1054) {
                    await this.ensureContentColumns();
                    return qb.orderBy('content.id', 'DESC').limit(lim).getMany();
                }
                throw err;
            }
        }
    }
    async autocomplete(query, limit = 10) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        try {
            const results = await this.connection.query(`
        SELECT 
          id,
          title,
          content_type,
          release_year,
          poster_url,
          avg_rating
        FROM content
        WHERE title LIKE ?
        ORDER BY 
          CASE 
            WHEN title LIKE ? THEN 1
            ELSE 2
          END,
          avg_rating DESC,
          reviews_count DESC
        LIMIT ?
      `, [`%${query}%`, `${query}%`, limit]);
            return results;
        }
        catch (err) {
            this.logger.error(`autocomplete error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            try {
                const qb = this.contentRepository
                    .createQueryBuilder('content')
                    .select(['content.id', 'content.title', 'content.content_type', 'content.release_year', 'content.poster_url', 'content.avg_rating'])
                    .where('content.title LIKE :q', { q: `%${query}%` })
                    .orderBy('content.avg_rating', 'DESC')
                    .limit(limit);
                return await qb.getMany();
            }
            catch (fallbackErr) {
                this.logger.error(`autocomplete fallback error: ${(fallbackErr === null || fallbackErr === void 0 ? void 0 : fallbackErr.message) || fallbackErr}`);
                return [];
            }
        }
    }
    async getContentById(id) {
        return this.getDetailedContent(id);
    }
    async getDetailedContent(id) {
        try {
            const content = await this.contentRepository.findOne({ where: { id } });
            if (!content)
                return null;
            const reviews = await this.connection.query(`
        SELECT 
          r.*,
          u.username,
          u.avatar_url,
          u.role,
          p.name as publication_name,
          p.logo_url as publication_logo
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN publications p ON u.publication_id = p.id
        WHERE r.content_id = ?
        ORDER BY r.created_at DESC
      `, [id]);
            const criticReviewsList = [];
            const userReviewsList = [];
            const criticStats = { total: 0, positive: 0, mixed: 0, negative: 0 };
            const userStats = { total: 0, positive: 0, mixed: 0, negative: 0 };
            for (const r of reviews) {
                const rating = Number(r.rating);
                const isCritic = r.role === 'CRITIC';
                let type = 'mixed';
                if (isCritic) {
                    if (rating >= 7.5)
                        type = 'positive';
                    else if (rating < 5.0)
                        type = 'negative';
                }
                else {
                    if (rating >= 7.0)
                        type = 'positive';
                    else if (rating < 5.0)
                        type = 'negative';
                }
                if (isCritic) {
                    criticStats.total++;
                    criticStats[type]++;
                    criticReviewsList.push({
                        id: r.id,
                        publicationName: r.publication_name || 'Independent',
                        publicationLogo: r.publication_logo || 'https://placehold.co/80x30/1e293b/666?text=Critic',
                        criticName: r.username,
                        score: rating * 10,
                        excerpt: r.content.substring(0, 150) + (r.content.length > 150 ? '...' : ''),
                        fullReviewUrl: '#',
                        publishDate: r.created_at,
                        type
                    });
                }
                else {
                    userStats.total++;
                    userStats[type]++;
                    userReviewsList.push({
                        id: r.id,
                        userName: r.username,
                        userAvatar: r.avatar_url || 'https://placehold.co/50/1e293b/666?text=U',
                        score: rating,
                        title: r.content.substring(0, 50) + '...',
                        content: r.content,
                        helpful: 0,
                        notHelpful: 0,
                        containsSpoilers: false,
                        date: r.created_at,
                        detailedRatings: r.aspects || {}
                    });
                }
            }
            let similarContent = [];
            if (content.genre) {
                const firstGenre = content.genre.split(',')[0].trim();
                similarContent = await this.contentRepository
                    .createQueryBuilder('c')
                    .where('c.genre LIKE :genre', { genre: `%${firstGenre}%` })
                    .andWhere('c.id != :id', { id })
                    .orderBy('c.avg_rating', 'DESC')
                    .take(3)
                    .getMany();
            }
            return {
                ...content,
                releaseDate: content.release_year ? `${content.release_year}-01-01` : null,
                coverImage: content.poster_url,
                logo: null,
                trailerUrl: content.trailer_url,
                metascore: content.critics_rating ? Number(content.critics_rating) * 10 : 0,
                userScore: Number(content.audience_rating) || 0,
                criticReviews: criticStats,
                userReviews: userStats,
                criticReviewsList,
                userReviewsList,
                similarContent: similarContent.map(c => ({
                    id: c.id,
                    title: c.title,
                    poster: c.poster_url,
                    metascore: c.critics_rating ? Number(c.critics_rating) * 10 : 0,
                    userScore: Number(c.audience_rating) || 0
                })),
                platforms: Array.isArray(content.platforms) ? content.platforms : [],
                genre: content.genre ? content.genre.split(',').map(s => s.trim()) : [],
                screenshots: [],
                trailers: content.trailer_url ? [{ title: 'Official Trailer', url: content.trailer_url, thumbnail: '' }] : [],
                technicalInfo: content.technical_info || { fileSize: content.file_size, languages: [], systemRequirements: {} }
            };
        }
        catch (e) {
            this.logger.error(`getDetailedContent error: ${e}`);
            return this.contentRepository.findOne({ where: { id } });
        }
    }
    async getEmotionalCloud(contentId) {
        try {
            const content = await this.contentRepository.findOne({
                where: { id: contentId },
                select: ['emotional_cloud']
            });
            return (content === null || content === void 0 ? void 0 : content.emotional_cloud) || {};
        }
        catch (e) {
            return {};
        }
    }
    async getPerceptionMap(contentId) {
        try {
            const content = await this.contentRepository.findOne({
                where: { id: contentId },
                select: ['perception_map']
            });
            return (content === null || content === void 0 ? void 0 : content.perception_map) || {};
        }
        catch (e) {
            return {};
        }
    }
    async getDynamicsGraph(contentId) {
        try {
            const dynamics = await this.connection.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%u') as week_code,
          MIN(DATE_FORMAT(created_at, '%Y-%m-%d')) as date,
          AVG(rating) as avg_rating,
          COUNT(*) as review_count
        FROM reviews
        WHERE content_id = ? AND rating IS NOT NULL
        GROUP BY week_code
        ORDER BY date ASC
      `, [contentId]);
            let cumulativeSum = 0;
            let cumulativeCount = 0;
            return dynamics.map((point) => {
                cumulativeSum += parseFloat(point.avg_rating) * point.review_count;
                cumulativeCount += point.review_count;
                return {
                    date: point.date,
                    week: point.week_code,
                    weeklyAvg: parseFloat(point.avg_rating).toFixed(2),
                    cumulativeAvg: (cumulativeSum / cumulativeCount).toFixed(2),
                    reviewCount: point.review_count
                };
            });
        }
        catch (e) {
            this.logger.error(`getDynamicsGraph error: ${(e === null || e === void 0 ? void 0 : e.message) || e}`);
            return [];
        }
    }
    async createContent(createDto) {
        const content = this.contentRepository.create({
            ...createDto,
            ...createDto.platforms
                ? { platforms: createDto.platforms.split(',').map((s) => s.trim()).filter(Boolean) }
                : {},
        });
        return this.contentRepository.save(content);
    }
    async updateContent(id, updateDto, adminId) {
        const { title, release_year, genre, description, poster_url, trailer_url } = updateDto;
        try {
            await this.connection.query('CALL admin_update_content(?, ?, ?, ?, ?)', [
                id,
                adminId,
                title || null,
                release_year || null,
                genre || null,
            ]);
            const ex = updateDto;
            const postPatch = {};
            if (ex.description !== undefined)
                postPatch.description = ex.description;
            if (ex.poster_url !== undefined)
                postPatch.poster_url = ex.poster_url;
            if (ex.trailer_url !== undefined)
                postPatch.trailer_url = ex.trailer_url;
            if (ex.director !== undefined)
                postPatch.director = ex.director;
            if (ex.director_photo_url !== undefined)
                postPatch.director_photo_url = ex.director_photo_url;
            if (ex.cast !== undefined)
                postPatch.cast = ex.cast;
            if (ex.cast_photos !== undefined) {
                postPatch.cast_photos = Array.isArray(ex.cast_photos)
                    ? ex.cast_photos
                    : String(ex.cast_photos).split(',').map((s) => s.trim()).filter(Boolean);
            }
            if (ex.runtime !== undefined)
                postPatch.runtime = ex.runtime;
            if (ex.developer !== undefined)
                postPatch.developer = ex.developer;
            if (ex.publisher !== undefined)
                postPatch.publisher = ex.publisher;
            if (ex.platforms !== undefined) {
                postPatch.platforms = typeof ex.platforms === 'string'
                    ? ex.platforms.split(',').map((s) => s.trim()).filter(Boolean)
                    : ex.platforms;
            }
            if (ex.esrb_rating !== undefined)
                postPatch.esrb_rating = ex.esrb_rating;
            if (ex.players !== undefined)
                postPatch.players = ex.players;
            if (ex.file_size !== undefined)
                postPatch.file_size = ex.file_size;
            if (ex.technical_info !== undefined)
                postPatch.technical_info = ex.technical_info;
            if (Object.keys(postPatch).length > 0) {
                await this.contentRepository.update(id, postPatch);
            }
            return this.getContentById(id);
        }
        catch (e) {
            const patch = {
                ...(title !== undefined ? { title } : {}),
                ...(release_year !== undefined ? { release_year } : {}),
                ...(genre !== undefined ? { genre } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(poster_url !== undefined ? { poster_url } : {}),
                ...(trailer_url !== undefined ? { trailer_url } : {}),
            };
            const ex = updateDto;
            if (ex.director !== undefined)
                patch.director = ex.director;
            if (ex.director_photo_url !== undefined)
                patch.director_photo_url = ex.director_photo_url;
            if (ex.cast !== undefined)
                patch.cast = ex.cast;
            if (ex.cast_photos !== undefined) {
                patch.cast_photos = Array.isArray(ex.cast_photos)
                    ? ex.cast_photos
                    : String(ex.cast_photos).split(',').map((s) => s.trim()).filter(Boolean);
            }
            if (ex.runtime !== undefined)
                patch.runtime = ex.runtime;
            if (ex.developer !== undefined)
                patch.developer = ex.developer;
            if (ex.publisher !== undefined)
                patch.publisher = ex.publisher;
            if (ex.platforms !== undefined) {
                patch.platforms = typeof ex.platforms === 'string'
                    ? ex.platforms.split(',').map((s) => s.trim()).filter(Boolean)
                    : ex.platforms;
            }
            if (ex.esrb_rating !== undefined)
                patch.esrb_rating = ex.esrb_rating;
            if (ex.players !== undefined)
                patch.players = ex.players;
            if (ex.file_size !== undefined)
                patch.file_size = ex.file_size;
            if (ex.technical_info !== undefined)
                patch.technical_info = ex.technical_info;
            await this.contentRepository.update(id, patch);
            return this.contentRepository.findOne({ where: { id } });
        }
    }
    async deleteContent(id) {
        return this.contentRepository.delete(id);
    }
    async getAllContent(contentType, limit = 50) {
        const lim = Math.min(Math.max(Number(limit) || 50, 1), 500);
        const query = this.contentRepository.createQueryBuilder('content');
        if (contentType) {
            try {
                const hasContentType = await this.connection.query('SHOW COLUMNS FROM content LIKE "content_type"');
                let columnName = null;
                if (Array.isArray(hasContentType) && hasContentType.length > 0) {
                    columnName = 'content_type';
                }
                else {
                    const hasType = await this.connection.query('SHOW COLUMNS FROM content LIKE "type"');
                    if (Array.isArray(hasType) && hasType.length > 0) {
                        columnName = 'type';
                    }
                }
                if (columnName) {
                    query.where(`content.${columnName} = :contentType`, { contentType });
                }
            }
            catch { }
        }
        try {
            return await query.orderBy('content.id', 'DESC').limit(lim).getMany();
        }
        catch (err) {
            const code = err === null || err === void 0 ? void 0 : err.code;
            const errno = err === null || err === void 0 ? void 0 : err.errno;
            if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
                await this.ensureContentTable();
                return this.getAllContent(contentType, lim);
            }
            else if (code === 'ER_BAD_FIELD_ERROR' || errno === 1054) {
                await this.ensureContentColumns();
                return this.getAllContent(contentType, lim);
            }
            throw err;
        }
    }
    async getActiveHeroCarousel(sort) {
        try {
            if (sort === 'latest') {
                return await this.heroCarouselRepository.find({
                    where: { is_active: true },
                    order: { updated_at: 'DESC' },
                    relations: ['content'],
                });
            }
            return await this.heroCarouselRepository.find({
                where: { is_active: true },
                order: { display_order: 'ASC' },
                relations: ['content'],
            });
        }
        catch (err) {
            const code = err === null || err === void 0 ? void 0 : err.code;
            const errno = err === null || err === void 0 ? void 0 : err.errno;
            if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
                await this.ensureHeroCarouselTable();
                try {
                    if (sort === 'latest') {
                        return await this.heroCarouselRepository.find({
                            where: { is_active: true },
                            order: { updated_at: 'DESC' },
                            relations: ['content'],
                        });
                    }
                    return await this.heroCarouselRepository.find({
                        where: { is_active: true },
                        order: { display_order: 'ASC' },
                        relations: ['content'],
                    });
                }
                catch { }
            }
            this.logger.error(`getActiveHeroCarousel error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            return [];
        }
    }
    async getContentStats() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
        try {
            const [total, movies, series, games, heroActive, comingActive] = await Promise.all([
                this.connection.query('SELECT COUNT(*) as c FROM content'),
                this.connection.query("SELECT COUNT(*) as c FROM content WHERE content_type='MOVIE'"),
                this.connection.query("SELECT COUNT(*) as c FROM content WHERE content_type='TV_SERIES'"),
                this.connection.query("SELECT COUNT(*) as c FROM content WHERE content_type='GAME'"),
                this.connection.query('SELECT COUNT(*) as c FROM hero_carousel WHERE is_active=1'),
                this.connection.query('SELECT COUNT(*) as c FROM coming_soon_items WHERE is_active=1'),
            ]);
            return {
                total: Number(((_a = total === null || total === void 0 ? void 0 : total[0]) === null || _a === void 0 ? void 0 : _a.c) || ((_c = (_b = total === null || total === void 0 ? void 0 : total[0]) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.c) || 0),
                byType: {
                    movies: Number(((_d = movies === null || movies === void 0 ? void 0 : movies[0]) === null || _d === void 0 ? void 0 : _d.c) || ((_f = (_e = movies === null || movies === void 0 ? void 0 : movies[0]) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.c) || 0),
                    series: Number(((_g = series === null || series === void 0 ? void 0 : series[0]) === null || _g === void 0 ? void 0 : _g.c) || ((_j = (_h = series === null || series === void 0 ? void 0 : series[0]) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.c) || 0),
                    games: Number(((_k = games === null || games === void 0 ? void 0 : games[0]) === null || _k === void 0 ? void 0 : _k.c) || ((_m = (_l = games === null || games === void 0 ? void 0 : games[0]) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.c) || 0),
                },
                heroActive: Number(((_o = heroActive === null || heroActive === void 0 ? void 0 : heroActive[0]) === null || _o === void 0 ? void 0 : _o.c) || ((_q = (_p = heroActive === null || heroActive === void 0 ? void 0 : heroActive[0]) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.c) || 0),
                comingActive: Number(((_r = comingActive === null || comingActive === void 0 ? void 0 : comingActive[0]) === null || _r === void 0 ? void 0 : _r.c) || ((_t = (_s = comingActive === null || comingActive === void 0 ? void 0 : comingActive[0]) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.c) || 0),
            };
        }
        catch (e) {
            this.logger.error(`getContentStats error: ${(e === null || e === void 0 ? void 0 : e.message) || e}`);
            return { total: 0, byType: { movies: 0, series: 0, games: 0 }, heroActive: 0, comingActive: 0 };
        }
    }
    async getAllHeroCarousel() {
        return await this.heroCarouselRepository.find({
            order: { display_order: 'ASC' },
            relations: ['content'],
        });
    }
    async createHeroCarousel(data) {
        if (data.content_id) {
            const contentExists = await this.contentRepository.findOne({ where: { id: data.content_id } });
            if (!contentExists) {
                throw new common_1.BadRequestException(`Content with ID ${data.content_id} not found`);
            }
        }
        const carousel = this.heroCarouselRepository.create(data);
        return await this.heroCarouselRepository.save(carousel);
    }
    async updateHeroCarousel(id, data) {
        if (data.content_id) {
            const contentExists = await this.contentRepository.findOne({ where: { id: data.content_id } });
            if (!contentExists) {
                throw new common_1.BadRequestException(`Content with ID ${data.content_id} not found`);
            }
        }
        await this.heroCarouselRepository.update(id, data);
        return await this.heroCarouselRepository.findOne({ where: { id }, relations: ['content'] });
    }
    async deleteHeroCarousel(id) {
        return await this.heroCarouselRepository.delete(id);
    }
    async getActiveComingSoon() {
        try {
            return await this.comingSoonRepository.find({
                where: { is_active: true },
                order: { release_date: 'ASC' },
            });
        }
        catch (err) {
            const code = err === null || err === void 0 ? void 0 : err.code;
            const errno = err === null || err === void 0 ? void 0 : err.errno;
            if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
                await this.ensureComingSoonTable();
                try {
                    return await this.comingSoonRepository.find({
                        where: { is_active: true },
                        order: { release_date: 'ASC' },
                    });
                }
                catch { }
            }
            this.logger.error(`getActiveComingSoon error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            return [];
        }
    }
    async getAllComingSoon() {
        return await this.comingSoonRepository.find({
            order: { release_date: 'ASC' },
        });
    }
    async createComingSoon(data) {
        const item = this.comingSoonRepository.create(data);
        return await this.comingSoonRepository.save(item);
    }
    async updateComingSoon(id, data) {
        await this.comingSoonRepository.update(id, data);
        return await this.comingSoonRepository.findOne({ where: { id } });
    }
    async deleteComingSoon(id) {
        return await this.comingSoonRepository.delete(id);
    }
    async getCountryRatings(contentId) {
        var _a, _b, _c;
        try {
            const content = await this.contentRepository.findOne({ where: { id: contentId } });
            const globalRating = (content === null || content === void 0 ? void 0 : content.avg_rating) ? Number(content.avg_rating) : 0;
            const countryStats = await this.connection.query(`
        SELECT 
          u.country,
          COUNT(*) as reviews_count,
          AVG(r.rating) as avg_rating,
          MIN(r.rating) as min_rating,
          MAX(r.rating) as max_rating,
          SUM(CASE WHEN r.rating >= 7 THEN 1 ELSE 0 END) as positive_count,
          SUM(CASE WHEN r.rating >= 5 AND r.rating < 7 THEN 1 ELSE 0 END) as mixed_count,
          SUM(CASE WHEN r.rating < 5 THEN 1 ELSE 0 END) as negative_count
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.content_id = ? 
          AND u.country IS NOT NULL 
          AND u.country != ''
          AND r.rating IS NOT NULL
        GROUP BY u.country
        HAVING reviews_count >= 1
        ORDER BY reviews_count DESC, avg_rating DESC
      `, [contentId]);
            const globalStats = await this.connection.query(`
        SELECT 
          COUNT(*) as total_reviews,
          AVG(r.rating) as global_avg,
          COUNT(DISTINCT u.country) as countries_count
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.content_id = ? 
          AND u.country IS NOT NULL 
          AND u.country != ''
          AND r.rating IS NOT NULL
      `, [contentId]);
            const ratings = countryStats.map((row) => {
                const avgRating = parseFloat(Number(row.avg_rating).toFixed(2));
                return {
                    country: row.country,
                    countryCode: this.getCountryCode(row.country),
                    count: Number(row.reviews_count),
                    avgRating,
                    minRating: Number(row.min_rating),
                    maxRating: Number(row.max_rating),
                    positiveCount: Number(row.positive_count),
                    mixedCount: Number(row.mixed_count),
                    negativeCount: Number(row.negative_count),
                    difference: parseFloat((avgRating - globalRating).toFixed(2)),
                };
            });
            return {
                ratings,
                totalRatings: Number(((_a = globalStats[0]) === null || _a === void 0 ? void 0 : _a.total_reviews) || 0),
                globalAvg: parseFloat(Number(((_b = globalStats[0]) === null || _b === void 0 ? void 0 : _b.global_avg) || 0).toFixed(2)),
                countriesCount: Number(((_c = globalStats[0]) === null || _c === void 0 ? void 0 : _c.countries_count) || 0),
            };
        }
        catch (e) {
            this.logger.error(`getCountryRatings error: ${(e === null || e === void 0 ? void 0 : e.message) || e}`);
            return { ratings: [], totalRatings: 0, globalAvg: 0, countriesCount: 0 };
        }
    }
    async getGlobalCountryStats() {
        try {
            const stats = await this.connection.query(`
        SELECT 
          u.country,
          COUNT(*) as reviews_count,
          AVG(r.rating) as avg_rating,
          COUNT(DISTINCT r.content_id) as content_reviewed,
          COUNT(DISTINCT u.id) as users_count
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE u.country IS NOT NULL 
          AND u.country != ''
          AND r.rating IS NOT NULL
        GROUP BY u.country
        HAVING reviews_count >= 1
        ORDER BY reviews_count DESC
      `);
            return stats.map((row) => ({
                country: row.country,
                countryCode: this.getCountryCode(row.country),
                reviewsCount: Number(row.reviews_count),
                avgRating: parseFloat(Number(row.avg_rating).toFixed(2)),
                contentReviewed: Number(row.content_reviewed),
                usersCount: Number(row.users_count),
            }));
        }
        catch (e) {
            this.logger.error(`getGlobalCountryStats error: ${(e === null || e === void 0 ? void 0 : e.message) || e}`);
            return [];
        }
    }
    getCountryCode(countryName) {
        const countryMap = {
            'Россия': 'RU', 'Russia': 'RU',
            'США': 'US', 'United States': 'US', 'USA': 'US',
            'Великобритания': 'GB', 'United Kingdom': 'GB', 'UK': 'GB',
            'Германия': 'DE', 'Germany': 'DE',
            'Франция': 'FR', 'France': 'FR',
            'Италия': 'IT', 'Italy': 'IT',
            'Испания': 'ES', 'Spain': 'ES',
            'Япония': 'JP', 'Japan': 'JP',
            'Китай': 'CN', 'China': 'CN',
            'Южная Корея': 'KR', 'South Korea': 'KR', 'Korea': 'KR',
            'Канада': 'CA', 'Canada': 'CA',
            'Австралия': 'AU', 'Australia': 'AU',
            'Бразилия': 'BR', 'Brazil': 'BR',
            'Индия': 'IN', 'India': 'IN',
            'Мексика': 'MX', 'Mexico': 'MX',
            'Польша': 'PL', 'Poland': 'PL',
            'Украина': 'UA', 'Ukraine': 'UA',
            'Беларусь': 'BY', 'Belarus': 'BY',
            'Казахстан': 'KZ', 'Kazakhstan': 'KZ',
            'Нидерланды': 'NL', 'Netherlands': 'NL',
            'Швеция': 'SE', 'Sweden': 'SE',
            'Норвегия': 'NO', 'Norway': 'NO',
            'Финляндия': 'FI', 'Finland': 'FI',
            'Дания': 'DK', 'Denmark': 'DK',
            'Турция': 'TR', 'Turkey': 'TR',
            'Аргентина': 'AR', 'Argentina': 'AR',
            'Чехия': 'CZ', 'Czech Republic': 'CZ', 'Czechia': 'CZ',
            'Австрия': 'AT', 'Austria': 'AT',
            'Швейцария': 'CH', 'Switzerland': 'CH',
            'Бельгия': 'BE', 'Belgium': 'BE',
            'Португалия': 'PT', 'Portugal': 'PT',
            'Греция': 'GR', 'Greece': 'GR',
            'Израиль': 'IL', 'Israel': 'IL',
            'ОАЭ': 'AE', 'United Arab Emirates': 'AE', 'UAE': 'AE',
            'Сингапур': 'SG', 'Singapore': 'SG',
            'Тайвань': 'TW', 'Taiwan': 'TW',
            'Таиланд': 'TH', 'Thailand': 'TH',
            'Вьетнам': 'VN', 'Vietnam': 'VN',
            'Индонезия': 'ID', 'Indonesia': 'ID',
            'Малайзия': 'MY', 'Malaysia': 'MY',
            'Филиппины': 'PH', 'Philippines': 'PH',
            'Новая Зеландия': 'NZ', 'New Zealand': 'NZ',
            'ЮАР': 'ZA', 'South Africa': 'ZA',
            'Египет': 'EG', 'Egypt': 'EG',
            'Саудовская Аравия': 'SA', 'Saudi Arabia': 'SA',
        };
        return countryMap[countryName] || 'XX';
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = ContentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(content_entity_1.Content)),
    __param(1, (0, typeorm_1.InjectRepository)(hero_carousel_entity_1.HeroCarousel)),
    __param(2, (0, typeorm_1.InjectRepository)(coming_soon_entity_1.ComingSoonItem)),
    __param(3, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Connection])
], ContentService);
//# sourceMappingURL=content.service.js.map