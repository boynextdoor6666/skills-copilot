import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export interface IgdbGame {
    id: number;
    name: string;
    slug: string;
    summary?: string;
    storyline?: string;
    first_release_date?: number;
    rating?: number;
    rating_count?: number;
    aggregated_rating?: number;
    aggregated_rating_count?: number;
    total_rating?: number;
    total_rating_count?: number;
    hypes?: number;
    follows?: number;
    cover?: IgdbImage;
    screenshots?: IgdbImage[];
    artworks?: IgdbImage[];
    videos?: IgdbVideo[];
    genres?: IgdbGenre[];
    platforms?: IgdbPlatform[];
    involved_companies?: IgdbInvolvedCompany[];
    game_modes?: IgdbGameMode[];
    themes?: IgdbTheme[];
    player_perspectives?: IgdbPlayerPerspective[];
    age_ratings?: IgdbAgeRating[];
    similar_games?: number[];
    websites?: IgdbWebsite[];
    status?: number;
}
export interface IgdbImage {
    id: number;
    image_id: string;
    width?: number;
    height?: number;
}
export interface IgdbVideo {
    id: number;
    video_id: string;
    name?: string;
}
export interface IgdbGenre {
    id: number;
    name: string;
    slug: string;
}
export interface IgdbPlatform {
    id: number;
    name: string;
    abbreviation?: string;
    slug: string;
}
export interface IgdbInvolvedCompany {
    id: number;
    company: IgdbCompany;
    developer: boolean;
    publisher: boolean;
}
export interface IgdbCompany {
    id: number;
    name: string;
    slug: string;
    logo?: IgdbImage;
}
export interface IgdbGameMode {
    id: number;
    name: string;
    slug: string;
}
export interface IgdbTheme {
    id: number;
    name: string;
    slug: string;
}
export interface IgdbPlayerPerspective {
    id: number;
    name: string;
    slug: string;
}
export interface IgdbAgeRating {
    id: number;
    category: number;
    rating: number;
}
export interface IgdbWebsite {
    id: number;
    category: number;
    url: string;
}
export declare class IgdbService implements OnModuleInit {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly clientId;
    private readonly clientSecret;
    private accessToken;
    private tokenExpiresAt;
    private requestCount;
    private lastResetTime;
    private readonly maxRequests;
    private readonly resetInterval;
    constructor(httpService: HttpService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private ensureAccessToken;
    private checkRateLimit;
    private request;
    searchGames(query: string, limit?: number): Promise<IgdbGame[] | null>;
    getGameDetails(gameId: number): Promise<IgdbGame | null>;
    getPopularGames(limit?: number): Promise<IgdbGame[] | null>;
    getTopRatedGames(limit?: number): Promise<IgdbGame[] | null>;
    getUpcomingGames(limit?: number): Promise<IgdbGame[] | null>;
    getRecentlyReleasedGames(limit?: number): Promise<IgdbGame[] | null>;
    getGamesByPlatform(platformId: number, limit?: number): Promise<IgdbGame[] | null>;
    getCoverUrl(imageId: string | undefined, size?: 'cover_small' | 'cover_big' | 'screenshot_big' | '720p' | '1080p'): string | null;
    getScreenshotUrl(imageId: string | undefined, size?: 'screenshot_med' | 'screenshot_big' | 'screenshot_huge' | '720p' | '1080p'): string | null;
    getYouTubeTrailerUrl(videos?: IgdbVideo[]): string | null;
    timestampToYear(timestamp?: number): number | null;
    timestampToDate(timestamp?: number): string | null;
    getEsrbRating(ageRatings?: IgdbAgeRating[]): string | null;
    convertGameToContent(game: IgdbGame): any;
    isAvailable(): Promise<boolean>;
    getPlatforms(): Promise<IgdbPlatform[] | null>;
    getGenres(): Promise<IgdbGenre[] | null>;
}
