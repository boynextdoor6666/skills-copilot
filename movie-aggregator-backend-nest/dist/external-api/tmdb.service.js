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
var TmdbService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TmdbService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const TMDB_GENRE_MAP = {
    28: 'Боевик',
    12: 'Приключения',
    16: 'Мультфильм',
    35: 'Комедия',
    80: 'Криминал',
    99: 'Документальный',
    18: 'Драма',
    10751: 'Семейный',
    14: 'Фэнтези',
    36: 'История',
    27: 'Ужасы',
    10402: 'Музыка',
    9648: 'Детектив',
    10749: 'Мелодрама',
    878: 'Фантастика',
    10770: 'Телефильм',
    53: 'Триллер',
    10752: 'Военный',
    37: 'Вестерн',
    10759: 'Боевик и Приключения',
    10762: 'Детский',
    10763: 'Новости',
    10764: 'Реалити',
    10765: 'Фантастика и Фэнтези',
    10766: 'Мыльная опера',
    10767: 'Ток-шоу',
    10768: 'Война и Политика',
};
let TmdbService = TmdbService_1 = class TmdbService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(TmdbService_1.name);
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.imageBaseUrl = 'https://image.tmdb.org/t/p';
        this.requestCount = 0;
        this.lastResetTime = Date.now();
        this.maxRequests = 40;
        this.resetInterval = 10000;
        this.apiKey = this.configService.get('TMDB_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('TMDB_API_KEY not configured. TMDB integration will not work.');
        }
    }
    async checkRateLimit() {
        const now = Date.now();
        if (now - this.lastResetTime >= this.resetInterval) {
            this.requestCount = 0;
            this.lastResetTime = now;
        }
        if (this.requestCount >= this.maxRequests) {
            const waitTime = this.resetInterval - (now - this.lastResetTime);
            this.logger.warn(`Rate limit reached. Waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.requestCount = 0;
            this.lastResetTime = Date.now();
        }
        this.requestCount++;
    }
    async request(endpoint, params = {}) {
        if (!this.apiKey) {
            this.logger.error('TMDB API key not configured');
            return null;
        }
        await this.checkRateLimit();
        const url = `${this.baseUrl}${endpoint}`;
        const queryParams = {
            api_key: this.apiKey,
            language: 'ru-RU',
            ...params,
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: queryParams }).pipe((0, rxjs_1.catchError)((error) => {
                var _a;
                this.logger.error(`TMDB API error: ${error.message}`, (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
                return (0, rxjs_1.of)(null);
            })));
            return (response === null || response === void 0 ? void 0 : response.data) || null;
        }
        catch (error) {
            this.logger.error(`TMDB request failed: ${error}`);
            return null;
        }
    }
    async searchMovies(query, page = 1) {
        return this.request('/search/movie', {
            query,
            page,
            include_adult: false,
        });
    }
    async searchTvShows(query, page = 1) {
        return this.request('/search/tv', {
            query,
            page,
        });
    }
    async multiSearch(query, page = 1) {
        return this.request('/search/multi', {
            query,
            page,
            include_adult: false,
        });
    }
    async getMovieDetails(movieId) {
        return this.request(`/movie/${movieId}`, {
            append_to_response: 'credits,videos',
        });
    }
    async getTvShowDetails(tvId) {
        return this.request(`/tv/${tvId}`, {
            append_to_response: 'credits,videos',
        });
    }
    async getPopularMovies(page = 1) {
        return this.request('/movie/popular', { page });
    }
    async getPopularTvShows(page = 1) {
        return this.request('/tv/popular', { page });
    }
    async getTopRatedMovies(page = 1) {
        return this.request('/movie/top_rated', { page });
    }
    async getTopRatedTvShows(page = 1) {
        return this.request('/tv/top_rated', { page });
    }
    async getUpcomingMovies(page = 1) {
        return this.request('/movie/upcoming', { page });
    }
    async getNowPlayingMovies(page = 1) {
        return this.request('/movie/now_playing', { page });
    }
    getPosterUrl(posterPath, size = 'w500') {
        if (!posterPath)
            return null;
        return `${this.imageBaseUrl}/${size}${posterPath}`;
    }
    getBackdropUrl(backdropPath, size = 'w1280') {
        if (!backdropPath)
            return null;
        return `${this.imageBaseUrl}/${size}${backdropPath}`;
    }
    getProfileUrl(profilePath, size = 'w185') {
        if (!profilePath)
            return null;
        return `${this.imageBaseUrl}/${size}${profilePath}`;
    }
    getYouTubeTrailerUrl(videos) {
        var _a;
        if (!((_a = videos === null || videos === void 0 ? void 0 : videos.results) === null || _a === void 0 ? void 0 : _a.length))
            return null;
        const trailer = videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) || videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer') || videos.results.find(v => v.site === 'YouTube');
        if (!trailer)
            return null;
        return `https://www.youtube.com/watch?v=${trailer.key}`;
    }
    convertGenres(genreIds) {
        return genreIds
            .map(id => TMDB_GENRE_MAP[id])
            .filter(Boolean)
            .join(', ');
    }
    convertMovieToContent(movie) {
        var _a, _b;
        const director = (_a = movie.credits) === null || _a === void 0 ? void 0 : _a.crew.find(c => c.job === 'Director');
        const cast = ((_b = movie.credits) === null || _b === void 0 ? void 0 : _b.cast.slice(0, 10)) || [];
        return {
            title: movie.title,
            original_title: movie.original_title,
            content_type: 'MOVIE',
            description: movie.overview,
            release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
            genre: movie.genres.map(g => TMDB_GENRE_MAP[g.id] || g.name).join(', '),
            runtime: movie.runtime,
            poster_url: this.getPosterUrl(movie.poster_path),
            backdrop_url: this.getBackdropUrl(movie.backdrop_path),
            trailer_url: this.getYouTubeTrailerUrl(movie.videos),
            director: (director === null || director === void 0 ? void 0 : director.name) || null,
            director_photo_url: director ? this.getProfileUrl(director.profile_path) : null,
            cast: cast.map(c => c.name).join(', '),
            cast_photos: cast.map(c => ({
                name: c.name,
                character: c.character,
                photo_url: this.getProfileUrl(c.profile_path),
            })),
            tmdb_id: movie.id,
            tmdb_rating: movie.vote_average,
            tmdb_vote_count: movie.vote_count,
            imdb_id: movie.imdb_id,
            budget: movie.budget,
            revenue: movie.revenue,
            tagline: movie.tagline,
            production_companies: movie.production_companies.map(c => c.name),
        };
    }
    convertTvShowToContent(tvShow) {
        var _a, _b;
        const creators = tvShow.created_by || [];
        const cast = ((_a = tvShow.credits) === null || _a === void 0 ? void 0 : _a.cast.slice(0, 10)) || [];
        return {
            title: tvShow.name,
            original_title: tvShow.original_name,
            content_type: 'TV_SERIES',
            description: tvShow.overview,
            release_year: tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : null,
            genre: tvShow.genres.map(g => TMDB_GENRE_MAP[g.id] || g.name).join(', '),
            runtime: ((_b = tvShow.episode_run_time) === null || _b === void 0 ? void 0 : _b[0]) || null,
            poster_url: this.getPosterUrl(tvShow.poster_path),
            backdrop_url: this.getBackdropUrl(tvShow.backdrop_path),
            trailer_url: this.getYouTubeTrailerUrl(tvShow.videos),
            director: creators.map(c => c.name).join(', ') || null,
            director_photo_url: creators[0] ? this.getProfileUrl(creators[0].profile_path) : null,
            cast: cast.map(c => c.name).join(', '),
            cast_photos: cast.map(c => ({
                name: c.name,
                character: c.character,
                photo_url: this.getProfileUrl(c.profile_path),
            })),
            tmdb_id: tvShow.id,
            tmdb_rating: tvShow.vote_average,
            tmdb_vote_count: tvShow.vote_count,
            number_of_seasons: tvShow.number_of_seasons,
            number_of_episodes: tvShow.number_of_episodes,
            networks: tvShow.networks.map(n => n.name),
            first_air_date: tvShow.first_air_date,
            last_air_date: tvShow.last_air_date,
            status: tvShow.status,
            tagline: tvShow.tagline,
        };
    }
    async isAvailable() {
        if (!this.apiKey)
            return false;
        try {
            const result = await this.request('/configuration');
            return !!result;
        }
        catch {
            return false;
        }
    }
};
exports.TmdbService = TmdbService;
exports.TmdbService = TmdbService = TmdbService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], TmdbService);
//# sourceMappingURL=tmdb.service.js.map