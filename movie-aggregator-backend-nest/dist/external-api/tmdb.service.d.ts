import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export interface TmdbMovie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    release_date: string;
    poster_path: string | null;
    backdrop_path: string | null;
    genre_ids: number[];
    vote_average: number;
    vote_count: number;
    popularity: number;
    adult: boolean;
    video: boolean;
}
export interface TmdbTvShow {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    first_air_date: string;
    poster_path: string | null;
    backdrop_path: string | null;
    genre_ids: number[];
    vote_average: number;
    vote_count: number;
    popularity: number;
    origin_country: string[];
}
export interface TmdbMovieDetails {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    release_date: string;
    runtime: number;
    poster_path: string | null;
    backdrop_path: string | null;
    genres: {
        id: number;
        name: string;
    }[];
    vote_average: number;
    vote_count: number;
    budget: number;
    revenue: number;
    tagline: string;
    status: string;
    imdb_id: string;
    production_companies: {
        id: number;
        name: string;
        logo_path: string | null;
    }[];
    production_countries: {
        iso_3166_1: string;
        name: string;
    }[];
    credits?: {
        cast: TmdbCastMember[];
        crew: TmdbCrewMember[];
    };
    videos?: {
        results: TmdbVideo[];
    };
}
export interface TmdbTvShowDetails {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    first_air_date: string;
    last_air_date: string;
    poster_path: string | null;
    backdrop_path: string | null;
    genres: {
        id: number;
        name: string;
    }[];
    vote_average: number;
    vote_count: number;
    number_of_episodes: number;
    number_of_seasons: number;
    episode_run_time: number[];
    status: string;
    tagline: string;
    networks: {
        id: number;
        name: string;
        logo_path: string | null;
    }[];
    created_by: {
        id: number;
        name: string;
        profile_path: string | null;
    }[];
    credits?: {
        cast: TmdbCastMember[];
        crew: TmdbCrewMember[];
    };
    videos?: {
        results: TmdbVideo[];
    };
}
export interface TmdbCastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}
export interface TmdbCrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}
export interface TmdbVideo {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}
export interface TmdbSearchResult<T> {
    page: number;
    total_pages: number;
    total_results: number;
    results: T[];
}
export declare class TmdbService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly imageBaseUrl;
    private readonly apiKey;
    private requestCount;
    private lastResetTime;
    private readonly maxRequests;
    private readonly resetInterval;
    constructor(httpService: HttpService, configService: ConfigService);
    private checkRateLimit;
    private request;
    searchMovies(query: string, page?: number): Promise<TmdbSearchResult<TmdbMovie> | null>;
    searchTvShows(query: string, page?: number): Promise<TmdbSearchResult<TmdbTvShow> | null>;
    multiSearch(query: string, page?: number): Promise<TmdbSearchResult<any> | null>;
    getMovieDetails(movieId: number): Promise<TmdbMovieDetails | null>;
    getTvShowDetails(tvId: number): Promise<TmdbTvShowDetails | null>;
    getPopularMovies(page?: number): Promise<TmdbSearchResult<TmdbMovie> | null>;
    getPopularTvShows(page?: number): Promise<TmdbSearchResult<TmdbTvShow> | null>;
    getTopRatedMovies(page?: number): Promise<TmdbSearchResult<TmdbMovie> | null>;
    getTopRatedTvShows(page?: number): Promise<TmdbSearchResult<TmdbTvShow> | null>;
    getUpcomingMovies(page?: number): Promise<TmdbSearchResult<TmdbMovie> | null>;
    getNowPlayingMovies(page?: number): Promise<TmdbSearchResult<TmdbMovie> | null>;
    getPosterUrl(posterPath: string | null, size?: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'): string | null;
    getBackdropUrl(backdropPath: string | null, size?: 'w300' | 'w780' | 'w1280' | 'original'): string | null;
    getProfileUrl(profilePath: string | null, size?: 'w45' | 'w185' | 'h632' | 'original'): string | null;
    getYouTubeTrailerUrl(videos?: {
        results: TmdbVideo[];
    }): string | null;
    convertGenres(genreIds: number[]): string;
    convertMovieToContent(movie: TmdbMovieDetails): any;
    convertTvShowToContent(tvShow: TmdbTvShowDetails): any;
    isAvailable(): Promise<boolean>;
}
