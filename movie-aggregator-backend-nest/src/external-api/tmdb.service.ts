import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError, of } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * TMDB API Service - интеграция с The Movie Database
 * Документация: https://developers.themoviedb.org/3
 */

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
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  budget: number;
  revenue: number;
  tagline: string;
  status: string;
  imdb_id: string;
  production_companies: { id: number; name: string; logo_path: string | null }[];
  production_countries: { iso_3166_1: string; name: string }[];
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
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  number_of_episodes: number;
  number_of_seasons: number;
  episode_run_time: number[];
  status: string;
  tagline: string;
  networks: { id: number; name: string; logo_path: string | null }[];
  created_by: { id: number; name: string; profile_path: string | null }[];
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

// Маппинг TMDB жанров на русский
const TMDB_GENRE_MAP: { [key: number]: string } = {
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
  // TV genres
  10759: 'Боевик и Приключения',
  10762: 'Детский',
  10763: 'Новости',
  10764: 'Реалити',
  10765: 'Фантастика и Фэнтези',
  10766: 'Мыльная опера',
  10767: 'Ток-шоу',
  10768: 'Война и Политика',
};

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';
  private readonly apiKey: string;

  // Rate limiting: TMDB allows 40 requests per 10 seconds
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly maxRequests = 40;
  private readonly resetInterval = 10000; // 10 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('TMDB_API_KEY not configured. TMDB integration will not work.');
    }
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
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

  /**
   * Execute TMDB API request
   */
  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
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
      const response = await firstValueFrom(
        this.httpService.get<T>(url, { params: queryParams }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`TMDB API error: ${error.message}`, error.response?.data);
            return of(null);
          }),
        ),
      );

      return response?.data || null;
    } catch (error) {
      this.logger.error(`TMDB request failed: ${error}`);
      return null;
    }
  }

  /**
   * Поиск фильмов
   */
  async searchMovies(query: string, page = 1): Promise<TmdbSearchResult<TmdbMovie> | null> {
    return this.request<TmdbSearchResult<TmdbMovie>>('/search/movie', {
      query,
      page,
      include_adult: false,
    });
  }

  /**
   * Поиск сериалов
   */
  async searchTvShows(query: string, page = 1): Promise<TmdbSearchResult<TmdbTvShow> | null> {
    return this.request<TmdbSearchResult<TmdbTvShow>>('/search/tv', {
      query,
      page,
    });
  }

  /**
   * Мультипоиск (фильмы + сериалы + персоны)
   */
  async multiSearch(query: string, page = 1): Promise<TmdbSearchResult<any> | null> {
    return this.request<TmdbSearchResult<any>>('/search/multi', {
      query,
      page,
      include_adult: false,
    });
  }

  /**
   * Получить детали фильма
   */
  async getMovieDetails(movieId: number): Promise<TmdbMovieDetails | null> {
    return this.request<TmdbMovieDetails>(`/movie/${movieId}`, {
      append_to_response: 'credits,videos',
    });
  }

  /**
   * Получить детали сериала
   */
  async getTvShowDetails(tvId: number): Promise<TmdbTvShowDetails | null> {
    return this.request<TmdbTvShowDetails>(`/tv/${tvId}`, {
      append_to_response: 'credits,videos',
    });
  }

  /**
   * Получить популярные фильмы
   */
  async getPopularMovies(page = 1): Promise<TmdbSearchResult<TmdbMovie> | null> {
    return this.request<TmdbSearchResult<TmdbMovie>>('/movie/popular', { page });
  }

  /**
   * Получить популярные сериалы
   */
  async getPopularTvShows(page = 1): Promise<TmdbSearchResult<TmdbTvShow> | null> {
    return this.request<TmdbSearchResult<TmdbTvShow>>('/tv/popular', { page });
  }

  /**
   * Получить топ фильмов
   */
  async getTopRatedMovies(page = 1): Promise<TmdbSearchResult<TmdbMovie> | null> {
    return this.request<TmdbSearchResult<TmdbMovie>>('/movie/top_rated', { page });
  }

  /**
   * Получить топ сериалов
   */
  async getTopRatedTvShows(page = 1): Promise<TmdbSearchResult<TmdbTvShow> | null> {
    return this.request<TmdbSearchResult<TmdbTvShow>>('/tv/top_rated', { page });
  }

  /**
   * Получить предстоящие фильмы
   */
  async getUpcomingMovies(page = 1): Promise<TmdbSearchResult<TmdbMovie> | null> {
    return this.request<TmdbSearchResult<TmdbMovie>>('/movie/upcoming', { page });
  }

  /**
   * Получить фильмы в прокате
   */
  async getNowPlayingMovies(page = 1): Promise<TmdbSearchResult<TmdbMovie> | null> {
    return this.request<TmdbSearchResult<TmdbMovie>>('/movie/now_playing', { page });
  }

  /**
   * Получить URL постера
   */
  getPosterUrl(posterPath: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!posterPath) return null;
    return `${this.imageBaseUrl}/${size}${posterPath}`;
  }

  /**
   * Получить URL бэкдропа
   */
  getBackdropUrl(backdropPath: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    if (!backdropPath) return null;
    return `${this.imageBaseUrl}/${size}${backdropPath}`;
  }

  /**
   * Получить URL профиля актёра
   */
  getProfileUrl(profilePath: string | null, size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'): string | null {
    if (!profilePath) return null;
    return `${this.imageBaseUrl}/${size}${profilePath}`;
  }

  /**
   * Получить URL трейлера YouTube
   */
  getYouTubeTrailerUrl(videos?: { results: TmdbVideo[] }): string | null {
    if (!videos?.results?.length) return null;
    
    // Ищем официальный трейлер
    const trailer = videos.results.find(
      v => v.site === 'YouTube' && v.type === 'Trailer' && v.official,
    ) || videos.results.find(
      v => v.site === 'YouTube' && v.type === 'Trailer',
    ) || videos.results.find(
      v => v.site === 'YouTube',
    );

    if (!trailer) return null;
    return `https://www.youtube.com/watch?v=${trailer.key}`;
  }

  /**
   * Конвертировать жанры TMDB в строку на русском
   */
  convertGenres(genreIds: number[]): string {
    return genreIds
      .map(id => TMDB_GENRE_MAP[id])
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Конвертировать детали фильма в формат приложения
   */
  convertMovieToContent(movie: TmdbMovieDetails): any {
    const director = movie.credits?.crew.find(c => c.job === 'Director');
    const cast = movie.credits?.cast.slice(0, 10) || [];

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
      director: director?.name || null,
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

  /**
   * Конвертировать детали сериала в формат приложения
   */
  convertTvShowToContent(tvShow: TmdbTvShowDetails): any {
    const creators = tvShow.created_by || [];
    const cast = tvShow.credits?.cast.slice(0, 10) || [];

    return {
      title: tvShow.name,
      original_title: tvShow.original_name,
      content_type: 'TV_SERIES',
      description: tvShow.overview,
      release_year: tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : null,
      genre: tvShow.genres.map(g => TMDB_GENRE_MAP[g.id] || g.name).join(', '),
      runtime: tvShow.episode_run_time?.[0] || null,
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

  /**
   * Проверить доступность API
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const result = await this.request<any>('/configuration');
      return !!result;
    } catch {
      return false;
    }
  }
}
