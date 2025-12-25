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
var IgdbService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IgdbService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const ESRB_RATINGS = {
    6: 'RP',
    7: 'EC',
    8: 'E',
    9: 'E10+',
    10: 'T',
    11: 'M',
    12: 'AO',
};
const PEGI_RATINGS = {
    1: 'PEGI 3',
    2: 'PEGI 7',
    3: 'PEGI 12',
    4: 'PEGI 16',
    5: 'PEGI 18',
};
const PLATFORM_SHORT_NAMES = {
    6: 'PC',
    48: 'PlayStation 4',
    167: 'PlayStation 5',
    49: 'Xbox One',
    169: 'Xbox Series X|S',
    130: 'Nintendo Switch',
    34: 'Android',
    39: 'iOS',
    3: 'Linux',
    14: 'Mac',
};
const GENRE_RU = {
    2: 'Point-and-click',
    4: 'Файтинг',
    5: 'Шутер',
    7: 'Музыкальная',
    8: 'Платформер',
    9: 'Головоломка',
    10: 'Гонки',
    11: 'Стратегия',
    12: 'RPG',
    13: 'Симулятор',
    14: 'Спорт',
    15: 'Тактика',
    16: 'Hack and slash',
    24: 'Tactical',
    25: 'Beat \'em up',
    26: 'Викторина',
    30: 'Пинбол',
    31: 'Приключения',
    32: 'Инди',
    33: 'Аркада',
    34: 'Визуальная новелла',
    35: 'Карточная',
    36: 'MOBA',
};
let IgdbService = IgdbService_1 = class IgdbService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(IgdbService_1.name);
        this.baseUrl = 'https://api.igdb.com/v4';
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        this.requestCount = 0;
        this.lastResetTime = Date.now();
        this.maxRequests = 4;
        this.resetInterval = 1000;
        this.clientId = this.configService.get('IGDB_CLIENT_ID') || '';
        this.clientSecret = this.configService.get('IGDB_CLIENT_SECRET') || '';
        if (this.clientId === 'your_twitch_client_id' || this.clientSecret === 'your_twitch_client_secret') {
            this.logger.warn('IGDB credentials are set to default placeholders. IGDB integration will be disabled.');
            this.clientId = '';
            this.clientSecret = '';
        }
        if (!this.clientId || !this.clientSecret) {
            this.logger.warn('IGDB credentials not configured. IGDB integration will not work.');
        }
    }
    async onModuleInit() {
        if (this.clientId && this.clientSecret) {
            await this.ensureAccessToken();
        }
    }
    async ensureAccessToken() {
        var _a;
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
            return true;
        }
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'client_credentials',
                },
            }));
            if ((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.access_token) {
                this.accessToken = response.data.access_token;
                this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
                this.logger.log('IGDB access token obtained successfully');
                return true;
            }
        }
        catch (error) {
            this.logger.error(`Failed to obtain IGDB access token: ${error}`);
        }
        return false;
    }
    async checkRateLimit() {
        const now = Date.now();
        if (now - this.lastResetTime >= this.resetInterval) {
            this.requestCount = 0;
            this.lastResetTime = now;
        }
        if (this.requestCount >= this.maxRequests) {
            const waitTime = this.resetInterval - (now - this.lastResetTime);
            this.logger.debug(`Rate limit reached. Waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.requestCount = 0;
            this.lastResetTime = Date.now();
        }
        this.requestCount++;
    }
    async request(endpoint, query) {
        if (!await this.ensureAccessToken()) {
            this.logger.error('Unable to authenticate with IGDB');
            return null;
        }
        await this.checkRateLimit();
        const url = `${this.baseUrl}${endpoint}`;
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, query, {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'text/plain',
                },
            }).pipe((0, rxjs_1.catchError)((error) => {
                var _a, _b;
                this.logger.error(`IGDB API error: ${error.message}`, (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
                if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 401) {
                    this.accessToken = null;
                    this.tokenExpiresAt = 0;
                }
                return (0, rxjs_1.of)(null);
            })));
            return (response === null || response === void 0 ? void 0 : response.data) || null;
        }
        catch (error) {
            this.logger.error(`IGDB request failed: ${error}`);
            return null;
        }
    }
    async searchGames(query, limit = 20) {
        const body = `
      search "${query}";
      fields name, slug, summary, first_release_date, rating, rating_count, 
             aggregated_rating, aggregated_rating_count, total_rating, hypes,
             cover.image_id, genres.name, platforms.name, platforms.abbreviation,
             involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
      limit ${limit};
    `;
        return this.request('/games', body);
    }
    async getGameDetails(gameId) {
        const body = `
      fields name, slug, summary, storyline, first_release_date,
             rating, rating_count, aggregated_rating, aggregated_rating_count,
             total_rating, total_rating_count, hypes, follows,
             cover.image_id, cover.width, cover.height,
             screenshots.image_id, screenshots.width, screenshots.height,
             artworks.image_id, artworks.width, artworks.height,
             videos.video_id, videos.name,
             genres.id, genres.name, genres.slug,
             platforms.id, platforms.name, platforms.abbreviation, platforms.slug,
             involved_companies.company.id, involved_companies.company.name, 
             involved_companies.company.logo.image_id, involved_companies.developer, involved_companies.publisher,
             game_modes.name, themes.name, player_perspectives.name,
             age_ratings.category, age_ratings.rating,
             similar_games, websites.category, websites.url, status;
      where id = ${gameId};
    `;
        const results = await this.request('/games', body);
        return (results === null || results === void 0 ? void 0 : results[0]) || null;
    }
    async getPopularGames(limit = 20) {
        const body = `
      fields name, slug, summary, first_release_date, rating, total_rating, hypes,
             cover.image_id, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer;
      where total_rating_count > 50 & cover != null;
      sort hypes desc;
      limit ${limit};
    `;
        return this.request('/games', body);
    }
    async getTopRatedGames(limit = 20) {
        const body = `
      fields name, slug, summary, first_release_date, rating, total_rating, aggregated_rating,
             cover.image_id, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer;
      where total_rating_count > 100 & cover != null;
      sort total_rating desc;
      limit ${limit};
    `;
        return this.request('/games', body);
    }
    async getUpcomingGames(limit = 20) {
        const now = Math.floor(Date.now() / 1000);
        const body = `
      fields name, slug, summary, first_release_date, hypes,
             cover.image_id, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer;
      where first_release_date > ${now} & cover != null;
      sort first_release_date asc;
      limit ${limit};
    `;
        return this.request('/games', body);
    }
    async getRecentlyReleasedGames(limit = 20) {
        const now = Math.floor(Date.now() / 1000);
        const threeMonthsAgo = now - (90 * 24 * 60 * 60);
        const body = `
      fields name, slug, summary, first_release_date, rating, total_rating, hypes,
             cover.image_id, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer;
      where first_release_date >= ${threeMonthsAgo} & first_release_date <= ${now} & cover != null;
      sort first_release_date desc;
      limit ${limit};
    `;
        return this.request('/games', body);
    }
    async getGamesByPlatform(platformId, limit = 20) {
        const body = `
      fields name, slug, summary, first_release_date, rating, total_rating,
             cover.image_id, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer;
      where platforms = ${platformId} & total_rating_count > 10 & cover != null;
      sort total_rating desc;
      limit ${limit};
    `;
        return this.request('/games', body);
    }
    getCoverUrl(imageId, size = 'cover_big') {
        if (!imageId)
            return null;
        return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
    }
    getScreenshotUrl(imageId, size = 'screenshot_big') {
        if (!imageId)
            return null;
        return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
    }
    getYouTubeTrailerUrl(videos) {
        if (!(videos === null || videos === void 0 ? void 0 : videos.length))
            return null;
        return `https://www.youtube.com/watch?v=${videos[0].video_id}`;
    }
    timestampToYear(timestamp) {
        if (!timestamp)
            return null;
        return new Date(timestamp * 1000).getFullYear();
    }
    timestampToDate(timestamp) {
        if (!timestamp)
            return null;
        return new Date(timestamp * 1000).toISOString().split('T')[0];
    }
    getEsrbRating(ageRatings) {
        if (!ageRatings)
            return null;
        const esrb = ageRatings.find(r => r.category === 1);
        return esrb ? ESRB_RATINGS[esrb.rating] || null : null;
    }
    convertGameToContent(game) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const developer = (_b = (_a = game.involved_companies) === null || _a === void 0 ? void 0 : _a.find(c => c.developer)) === null || _b === void 0 ? void 0 : _b.company.name;
        const publisher = (_d = (_c = game.involved_companies) === null || _c === void 0 ? void 0 : _c.find(c => c.publisher)) === null || _d === void 0 ? void 0 : _d.company.name;
        const platforms = ((_e = game.platforms) === null || _e === void 0 ? void 0 : _e.map(p => PLATFORM_SHORT_NAMES[p.id] || p.name)) || [];
        return {
            title: game.name,
            content_type: 'GAME',
            description: game.summary || game.storyline || '',
            release_year: this.timestampToYear(game.first_release_date),
            release_date: this.timestampToDate(game.first_release_date),
            genre: ((_f = game.genres) === null || _f === void 0 ? void 0 : _f.map(g => GENRE_RU[g.id] || g.name).join(', ')) || '',
            poster_url: this.getCoverUrl((_g = game.cover) === null || _g === void 0 ? void 0 : _g.image_id),
            screenshots: ((_h = game.screenshots) === null || _h === void 0 ? void 0 : _h.map(s => this.getScreenshotUrl(s.image_id))) || [],
            trailer_url: this.getYouTubeTrailerUrl(game.videos),
            developer,
            publisher,
            platforms,
            esrb_rating: this.getEsrbRating(game.age_ratings),
            players: ((_j = game.game_modes) === null || _j === void 0 ? void 0 : _j.map(m => m.name).join(', ')) || null,
            igdb_id: game.id,
            igdb_rating: game.rating ? Math.round(game.rating) : null,
            igdb_aggregated_rating: game.aggregated_rating ? Math.round(game.aggregated_rating) : null,
            igdb_total_rating: game.total_rating ? Math.round(game.total_rating) : null,
            hype_index: game.hypes || 0,
            themes: ((_k = game.themes) === null || _k === void 0 ? void 0 : _k.map(t => t.name)) || [],
            perspectives: ((_l = game.player_perspectives) === null || _l === void 0 ? void 0 : _l.map(p => p.name)) || [],
            similar_games: game.similar_games || [],
            status: game.status,
        };
    }
    async isAvailable() {
        if (!this.clientId || !this.clientSecret)
            return false;
        return await this.ensureAccessToken();
    }
    async getPlatforms() {
        const body = `
      fields id, name, abbreviation, slug;
      where category = 1 | category = 5 | category = 6;
      sort name asc;
      limit 50;
    `;
        return this.request('/platforms', body);
    }
    async getGenres() {
        const body = `
      fields id, name, slug;
      limit 50;
    `;
        return this.request('/genres', body);
    }
};
exports.IgdbService = IgdbService;
exports.IgdbService = IgdbService = IgdbService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], IgdbService);
//# sourceMappingURL=igdb.service.js.map