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
var ExternalApiController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalApiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tmdb_service_1 = require("./tmdb.service");
const igdb_service_1 = require("./igdb.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../admin/roles.guard");
const roles_decorator_1 = require("../admin/roles.decorator");
const content_entity_1 = require("../content/entities/content.entity");
const user_entity_1 = require("../users/user.entity");
let ExternalApiController = ExternalApiController_1 = class ExternalApiController {
    constructor(tmdbService, igdbService, contentRepository) {
        this.tmdbService = tmdbService;
        this.igdbService = igdbService;
        this.contentRepository = contentRepository;
        this.logger = new common_1.Logger(ExternalApiController_1.name);
    }
    async getStatus() {
        const [tmdbAvailable, igdbAvailable] = await Promise.all([
            this.tmdbService.isAvailable(),
            this.igdbService.isAvailable(),
        ]);
        return {
            tmdb: {
                available: tmdbAvailable,
                configured: !!process.env.TMDB_API_KEY,
            },
            igdb: {
                available: igdbAvailable,
                configured: !!(process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET),
            },
        };
    }
    async searchTmdbMovies(query, page) {
        if (!query) {
            throw new common_1.HttpException('Query parameter is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const results = await this.tmdbService.searchMovies(query, page || 1);
        if (!results) {
            throw new common_1.HttpException('TMDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return {
            ...results,
            results: results.results.map(movie => ({
                ...movie,
                poster_url: this.tmdbService.getPosterUrl(movie.poster_path),
                backdrop_url: this.tmdbService.getBackdropUrl(movie.backdrop_path),
                genres: this.tmdbService.convertGenres(movie.genre_ids),
            })),
        };
    }
    async getPopularTmdbMovies(page) {
        const results = await this.tmdbService.getPopularMovies(page || 1);
        if (!results) {
            throw new common_1.HttpException('TMDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return {
            ...results,
            results: results.results.map(movie => ({
                ...movie,
                poster_url: this.tmdbService.getPosterUrl(movie.poster_path),
                genres: this.tmdbService.convertGenres(movie.genre_ids),
            })),
        };
    }
    async getTopRatedTmdbMovies(page) {
        const results = await this.tmdbService.getTopRatedMovies(page || 1);
        if (!results) {
            throw new common_1.HttpException('TMDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return {
            ...results,
            results: results.results.map(movie => ({
                ...movie,
                poster_url: this.tmdbService.getPosterUrl(movie.poster_path),
                genres: this.tmdbService.convertGenres(movie.genre_ids),
            })),
        };
    }
    async getUpcomingTmdbMovies(page) {
        const results = await this.tmdbService.getUpcomingMovies(page || 1);
        if (!results) {
            throw new common_1.HttpException('TMDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return {
            ...results,
            results: results.results.map(movie => ({
                ...movie,
                poster_url: this.tmdbService.getPosterUrl(movie.poster_path),
                genres: this.tmdbService.convertGenres(movie.genre_ids),
            })),
        };
    }
    async getTmdbMovieDetails(id) {
        const movie = await this.tmdbService.getMovieDetails(id);
        if (!movie) {
            throw new common_1.HttpException('Movie not found or TMDB unavailable', common_1.HttpStatus.NOT_FOUND);
        }
        return this.tmdbService.convertMovieToContent(movie);
    }
    async searchTmdbTvShows(query, page) {
        if (!query) {
            throw new common_1.HttpException('Query parameter is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const results = await this.tmdbService.searchTvShows(query, page || 1);
        if (!results) {
            throw new common_1.HttpException('TMDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return {
            ...results,
            results: results.results.map(show => ({
                ...show,
                poster_url: this.tmdbService.getPosterUrl(show.poster_path),
                backdrop_url: this.tmdbService.getBackdropUrl(show.backdrop_path),
                genres: this.tmdbService.convertGenres(show.genre_ids),
            })),
        };
    }
    async getPopularTmdbTvShows(page) {
        const results = await this.tmdbService.getPopularTvShows(page || 1);
        if (!results) {
            throw new common_1.HttpException('TMDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return {
            ...results,
            results: results.results.map(show => ({
                ...show,
                poster_url: this.tmdbService.getPosterUrl(show.poster_path),
                genres: this.tmdbService.convertGenres(show.genre_ids),
            })),
        };
    }
    async getTmdbTvShowDetails(id) {
        const show = await this.tmdbService.getTvShowDetails(id);
        if (!show) {
            throw new common_1.HttpException('TV Show not found or TMDB unavailable', common_1.HttpStatus.NOT_FOUND);
        }
        return this.tmdbService.convertTvShowToContent(show);
    }
    async searchIgdbGames(query, limit) {
        if (!query) {
            throw new common_1.HttpException('Query parameter is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const results = await this.igdbService.searchGames(query, limit || 20);
        if (!results) {
            throw new common_1.HttpException('IGDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return results.map(game => {
            var _a;
            return ({
                ...game,
                cover_url: this.igdbService.getCoverUrl((_a = game.cover) === null || _a === void 0 ? void 0 : _a.image_id),
                release_year: this.igdbService.timestampToYear(game.first_release_date),
            });
        });
    }
    async getPopularIgdbGames(limit) {
        const results = await this.igdbService.getPopularGames(limit || 20);
        if (!results) {
            throw new common_1.HttpException('IGDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return results.map(game => {
            var _a;
            return ({
                ...game,
                cover_url: this.igdbService.getCoverUrl((_a = game.cover) === null || _a === void 0 ? void 0 : _a.image_id),
                release_year: this.igdbService.timestampToYear(game.first_release_date),
            });
        });
    }
    async getTopRatedIgdbGames(limit) {
        const results = await this.igdbService.getTopRatedGames(limit || 20);
        if (!results) {
            throw new common_1.HttpException('IGDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return results.map(game => {
            var _a;
            return ({
                ...game,
                cover_url: this.igdbService.getCoverUrl((_a = game.cover) === null || _a === void 0 ? void 0 : _a.image_id),
                release_year: this.igdbService.timestampToYear(game.first_release_date),
            });
        });
    }
    async getUpcomingIgdbGames(limit) {
        const results = await this.igdbService.getUpcomingGames(limit || 20);
        if (!results) {
            throw new common_1.HttpException('IGDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return results.map(game => {
            var _a;
            return ({
                ...game,
                cover_url: this.igdbService.getCoverUrl((_a = game.cover) === null || _a === void 0 ? void 0 : _a.image_id),
                release_date: this.igdbService.timestampToDate(game.first_release_date),
            });
        });
    }
    async getRecentIgdbGames(limit) {
        const results = await this.igdbService.getRecentlyReleasedGames(limit || 20);
        if (!results) {
            throw new common_1.HttpException('IGDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return results.map(game => {
            var _a;
            return ({
                ...game,
                cover_url: this.igdbService.getCoverUrl((_a = game.cover) === null || _a === void 0 ? void 0 : _a.image_id),
                release_year: this.igdbService.timestampToYear(game.first_release_date),
            });
        });
    }
    async getIgdbGameDetails(id) {
        const game = await this.igdbService.getGameDetails(id);
        if (!game) {
            throw new common_1.HttpException('Game not found or IGDB unavailable', common_1.HttpStatus.NOT_FOUND);
        }
        return this.igdbService.convertGameToContent(game);
    }
    async getIgdbPlatforms() {
        const platforms = await this.igdbService.getPlatforms();
        if (!platforms) {
            throw new common_1.HttpException('IGDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return platforms;
    }
    async getIgdbGenres() {
        const genres = await this.igdbService.getGenres();
        if (!genres) {
            throw new common_1.HttpException('IGDB API unavailable', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return genres;
    }
    async importMovieFromTmdb(tmdbId) {
        const movie = await this.tmdbService.getMovieDetails(tmdbId);
        if (!movie) {
            throw new common_1.HttpException('Movie not found in TMDB', common_1.HttpStatus.NOT_FOUND);
        }
        const existing = await this.contentRepository.findOne({
            where: { title: movie.title, content_type: content_entity_1.ContentType.MOVIE },
        });
        if (existing) {
            throw new common_1.HttpException('Movie already exists in database', common_1.HttpStatus.CONFLICT);
        }
        const contentData = this.tmdbService.convertMovieToContent(movie);
        const content = Object.assign(new content_entity_1.Content(), {
            ...contentData,
            content_type: content_entity_1.ContentType.MOVIE,
        });
        const saved = await this.contentRepository.save(content);
        this.logger.log(`Imported movie from TMDB: ${movie.title} (ID: ${saved.id})`);
        return {
            message: 'Movie imported successfully',
            content: saved,
        };
    }
    async importTvShowFromTmdb(tmdbId) {
        const show = await this.tmdbService.getTvShowDetails(tmdbId);
        if (!show) {
            throw new common_1.HttpException('TV Show not found in TMDB', common_1.HttpStatus.NOT_FOUND);
        }
        const existing = await this.contentRepository.findOne({
            where: { title: show.name, content_type: content_entity_1.ContentType.TV_SERIES },
        });
        if (existing) {
            throw new common_1.HttpException('TV Show already exists in database', common_1.HttpStatus.CONFLICT);
        }
        const contentData = this.tmdbService.convertTvShowToContent(show);
        const content = Object.assign(new content_entity_1.Content(), {
            ...contentData,
            content_type: content_entity_1.ContentType.TV_SERIES,
        });
        const saved = await this.contentRepository.save(content);
        this.logger.log(`Imported TV show from TMDB: ${show.name} (ID: ${saved.id})`);
        return {
            message: 'TV Show imported successfully',
            content: saved,
        };
    }
    async importGameFromIgdb(igdbId) {
        const game = await this.igdbService.getGameDetails(igdbId);
        if (!game) {
            throw new common_1.HttpException('Game not found in IGDB', common_1.HttpStatus.NOT_FOUND);
        }
        const existing = await this.contentRepository.findOne({
            where: { title: game.name, content_type: content_entity_1.ContentType.GAME },
        });
        if (existing) {
            throw new common_1.HttpException('Game already exists in database', common_1.HttpStatus.CONFLICT);
        }
        const contentData = this.igdbService.convertGameToContent(game);
        const content = Object.assign(new content_entity_1.Content(), {
            ...contentData,
            content_type: content_entity_1.ContentType.GAME,
        });
        const saved = await this.contentRepository.save(content);
        this.logger.log(`Imported game from IGDB: ${game.name} (ID: ${saved.id})`);
        return {
            message: 'Game imported successfully',
            content: saved,
        };
    }
    async bulkImportMovies(body) {
        var _a;
        if (!((_a = body.tmdbIds) === null || _a === void 0 ? void 0 : _a.length)) {
            throw new common_1.HttpException('tmdbIds array is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const results = {
            success: [],
            failed: [],
            skipped: [],
        };
        for (const tmdbId of body.tmdbIds) {
            try {
                const movie = await this.tmdbService.getMovieDetails(tmdbId);
                if (!movie) {
                    results.failed.push({ tmdbId, reason: 'Not found in TMDB' });
                    continue;
                }
                const existing = await this.contentRepository.findOne({
                    where: { title: movie.title, content_type: content_entity_1.ContentType.MOVIE },
                });
                if (existing) {
                    results.skipped.push({ tmdbId, title: movie.title, reason: 'Already exists' });
                    continue;
                }
                const contentData = this.tmdbService.convertMovieToContent(movie);
                const content = Object.assign(new content_entity_1.Content(), {
                    ...contentData,
                    content_type: content_entity_1.ContentType.MOVIE,
                });
                const saved = await this.contentRepository.save(content);
                results.success.push({ tmdbId, id: saved.id, title: movie.title });
            }
            catch (error) {
                results.failed.push({ tmdbId, reason: String(error) });
            }
        }
        return results;
    }
    async bulkImportGames(body) {
        var _a;
        if (!((_a = body.igdbIds) === null || _a === void 0 ? void 0 : _a.length)) {
            throw new common_1.HttpException('igdbIds array is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const results = {
            success: [],
            failed: [],
            skipped: [],
        };
        for (const igdbId of body.igdbIds) {
            try {
                const game = await this.igdbService.getGameDetails(igdbId);
                if (!game) {
                    results.failed.push({ igdbId, reason: 'Not found in IGDB' });
                    continue;
                }
                const existing = await this.contentRepository.findOne({
                    where: { title: game.name, content_type: content_entity_1.ContentType.GAME },
                });
                if (existing) {
                    results.skipped.push({ igdbId, title: game.name, reason: 'Already exists' });
                    continue;
                }
                const contentData = this.igdbService.convertGameToContent(game);
                const content = Object.assign(new content_entity_1.Content(), {
                    ...contentData,
                    content_type: content_entity_1.ContentType.GAME,
                });
                const saved = await this.contentRepository.save(content);
                results.success.push({ igdbId, id: saved.id, title: game.name });
            }
            catch (error) {
                results.failed.push({ igdbId, reason: String(error) });
            }
        }
        return results;
    }
};
exports.ExternalApiController = ExternalApiController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Проверить статус внешних API' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Статус подключения к API' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('tmdb/search/movies'),
    (0, swagger_1.ApiOperation)({ summary: 'Поиск фильмов в TMDB' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: true, description: 'Поисковый запрос' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Страница результатов' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Список найденных фильмов' }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "searchTmdbMovies", null);
__decorate([
    (0, common_1.Get)('tmdb/movies/popular'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить популярные фильмы из TMDB' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getPopularTmdbMovies", null);
__decorate([
    (0, common_1.Get)('tmdb/movies/top-rated'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить топ фильмов из TMDB' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getTopRatedTmdbMovies", null);
__decorate([
    (0, common_1.Get)('tmdb/movies/upcoming'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить предстоящие фильмы из TMDB' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getUpcomingTmdbMovies", null);
__decorate([
    (0, common_1.Get)('tmdb/movies/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить детали фильма из TMDB' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Детальная информация о фильме' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getTmdbMovieDetails", null);
__decorate([
    (0, common_1.Get)('tmdb/search/tv'),
    (0, swagger_1.ApiOperation)({ summary: 'Поиск сериалов в TMDB' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "searchTmdbTvShows", null);
__decorate([
    (0, common_1.Get)('tmdb/tv/popular'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить популярные сериалы из TMDB' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getPopularTmdbTvShows", null);
__decorate([
    (0, common_1.Get)('tmdb/tv/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить детали сериала из TMDB' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getTmdbTvShowDetails", null);
__decorate([
    (0, common_1.Get)('igdb/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Поиск игр в IGDB' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "searchIgdbGames", null);
__decorate([
    (0, common_1.Get)('igdb/games/popular'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить популярные игры из IGDB' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getPopularIgdbGames", null);
__decorate([
    (0, common_1.Get)('igdb/games/top-rated'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить топ игр по рейтингу из IGDB' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getTopRatedIgdbGames", null);
__decorate([
    (0, common_1.Get)('igdb/games/upcoming'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить предстоящие игры из IGDB' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getUpcomingIgdbGames", null);
__decorate([
    (0, common_1.Get)('igdb/games/recent'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить недавно вышедшие игры из IGDB' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getRecentIgdbGames", null);
__decorate([
    (0, common_1.Get)('igdb/games/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить детали игры из IGDB' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getIgdbGameDetails", null);
__decorate([
    (0, common_1.Get)('igdb/platforms'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить список платформ из IGDB' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getIgdbPlatforms", null);
__decorate([
    (0, common_1.Get)('igdb/genres'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить список жанров игр из IGDB' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "getIgdbGenres", null);
__decorate([
    (0, common_1.Post)('import/movie/:tmdbId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Импортировать фильм из TMDB в базу данных (только для админов)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Фильм успешно импортирован' }),
    __param(0, (0, common_1.Param)('tmdbId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "importMovieFromTmdb", null);
__decorate([
    (0, common_1.Post)('import/tv/:tmdbId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Импортировать сериал из TMDB в базу данных (только для админов)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Сериал успешно импортирован' }),
    __param(0, (0, common_1.Param)('tmdbId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "importTvShowFromTmdb", null);
__decorate([
    (0, common_1.Post)('import/game/:igdbId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Импортировать игру из IGDB в базу данных (только для админов)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Игра успешно импортирована' }),
    __param(0, (0, common_1.Param)('igdbId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "importGameFromIgdb", null);
__decorate([
    (0, common_1.Post)('import/bulk/movies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Массовый импорт фильмов из TMDB' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                tmdbIds: { type: 'array', items: { type: 'number' } }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "bulkImportMovies", null);
__decorate([
    (0, common_1.Post)('import/bulk/games'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Массовый импорт игр из IGDB' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                igdbIds: { type: 'array', items: { type: 'number' } }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExternalApiController.prototype, "bulkImportGames", null);
exports.ExternalApiController = ExternalApiController = ExternalApiController_1 = __decorate([
    (0, swagger_1.ApiTags)('External API'),
    (0, common_1.Controller)('api/external'),
    __param(2, (0, typeorm_1.InjectRepository)(content_entity_1.Content)),
    __metadata("design:paramtypes", [tmdb_service_1.TmdbService,
        igdb_service_1.IgdbService,
        typeorm_2.Repository])
], ExternalApiController);
//# sourceMappingURL=external-api.controller.js.map