import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError, of } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * IGDB API Service - интеграция с Internet Game Database
 * Документация: https://api-docs.igdb.com/
 * 
 * IGDB использует Twitch OAuth для аутентификации:
 * 1. Получить Client ID и Client Secret на https://dev.twitch.tv/console
 * 2. Получить access_token через OAuth
 */

export interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number; // Unix timestamp
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
  status?: number; // 0 = released, 2 = alpha, 3 = beta, 4 = early access, 5 = offline, 6 = cancelled, 7 = rumored, 8 = delisted
}

export interface IgdbImage {
  id: number;
  image_id: string;
  width?: number;
  height?: number;
}

export interface IgdbVideo {
  id: number;
  video_id: string; // YouTube video ID
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
  category: number; // 1 = ESRB, 2 = PEGI
  rating: number;
}

export interface IgdbWebsite {
  id: number;
  category: number;
  url: string;
}

// ESRB rating mapping
const ESRB_RATINGS: { [key: number]: string } = {
  6: 'RP',     // Rating Pending
  7: 'EC',     // Early Childhood
  8: 'E',      // Everyone
  9: 'E10+',   // Everyone 10+
  10: 'T',     // Teen
  11: 'M',     // Mature 17+
  12: 'AO',    // Adults Only 18+
};

// PEGI rating mapping
const PEGI_RATINGS: { [key: number]: string } = {
  1: 'PEGI 3',
  2: 'PEGI 7',
  3: 'PEGI 12',
  4: 'PEGI 16',
  5: 'PEGI 18',
};

// Platform mapping для популярных платформ
const PLATFORM_SHORT_NAMES: { [key: number]: string } = {
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

// Жанры на русском
const GENRE_RU: { [key: number]: string } = {
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

@Injectable()
export class IgdbService implements OnModuleInit {
  private readonly logger = new Logger(IgdbService.name);
  private readonly baseUrl = 'https://api.igdb.com/v4';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  // Rate limiting: IGDB allows 4 requests per second
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly maxRequests = 4;
  private readonly resetInterval = 1000; // 1 second

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get<string>('IGDB_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('IGDB_CLIENT_SECRET') || '';

    // Check for placeholder values
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
    // Попытка получить токен при старте, если credentials настроены
    if (this.clientId && this.clientSecret) {
      await this.ensureAccessToken();
    }
  }

  /**
   * Получить/обновить OAuth токен от Twitch
   */
  private async ensureAccessToken(): Promise<boolean> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return true; // Токен ещё валидный
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://id.twitch.tv/oauth2/token',
          null,
          {
            params: {
              client_id: this.clientId,
              client_secret: this.clientSecret,
              grant_type: 'client_credentials',
            },
          },
        ),
      );

      if (response?.data?.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
        this.logger.log('IGDB access token obtained successfully');
        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to obtain IGDB access token: ${error}`);
    }

    return false;
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
      this.logger.debug(`Rate limit reached. Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Execute IGDB API request
   * IGDB использует специфичный Apicalypse query language
   */
  private async request<T>(endpoint: string, query: string): Promise<T[] | null> {
    if (!await this.ensureAccessToken()) {
      this.logger.error('Unable to authenticate with IGDB');
      return null;
    }

    await this.checkRateLimit();

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<T[]>(url, query, {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'text/plain',
          },
        }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`IGDB API error: ${error.message}`, error.response?.data);
            // Если ошибка авторизации, сбросить токен
            if (error.response?.status === 401) {
              this.accessToken = null;
              this.tokenExpiresAt = 0;
            }
            return of(null);
          }),
        ),
      );

      return response?.data || null;
    } catch (error) {
      this.logger.error(`IGDB request failed: ${error}`);
      return null;
    }
  }

  /**
   * Поиск игр
   */
  async searchGames(query: string, limit = 20): Promise<IgdbGame[] | null> {
    const body = `
      search "${query}";
      fields name, slug, summary, first_release_date, rating, rating_count, 
             aggregated_rating, aggregated_rating_count, total_rating, hypes,
             cover.image_id, genres.name, platforms.name, platforms.abbreviation,
             involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
      limit ${limit};
    `;
    return this.request<IgdbGame>('/games', body);
  }

  /**
   * Получить детали игры по ID
   */
  async getGameDetails(gameId: number): Promise<IgdbGame | null> {
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
    const results = await this.request<IgdbGame>('/games', body);
    return results?.[0] || null;
  }

  /**
   * Получить популярные игры
   */
  async getPopularGames(limit = 20): Promise<IgdbGame[] | null> {
    const body = `
      fields name, slug, summary, first_release_date, rating, total_rating, hypes,
             cover.image_id, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer;
      where total_rating_count > 50 & cover != null;
      sort hypes desc;
      limit ${limit};
    `;
    return this.request<IgdbGame>('/games', body);
  }

  /**
   * Получить топ игр по рейтингу
   */
  async getTopRatedGames(limit = 20): Promise<IgdbGame[] | null> {
    const body = `
      fields name, slug, summary, first_release_date, rating, total_rating, aggregated_rating,
             cover.image_id, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer;
      where total_rating_count > 100 & cover != null;
      sort total_rating desc;
      limit ${limit};
    `;
    return this.request<IgdbGame>('/games', body);
  }

  /**
   * Получить предстоящие игры
   */
  async getUpcomingGames(limit = 20): Promise<IgdbGame[] | null> {
    const now = Math.floor(Date.now() / 1000);
    const body = `
      fields name, slug, summary, first_release_date, hypes,
             cover.image_id, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer;
      where first_release_date > ${now} & cover != null;
      sort first_release_date asc;
      limit ${limit};
    `;
    return this.request<IgdbGame>('/games', body);
  }

  /**
   * Получить недавно вышедшие игры
   */
  async getRecentlyReleasedGames(limit = 20): Promise<IgdbGame[] | null> {
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
    return this.request<IgdbGame>('/games', body);
  }

  /**
   * Получить игры по платформе
   */
  async getGamesByPlatform(platformId: number, limit = 20): Promise<IgdbGame[] | null> {
    const body = `
      fields name, slug, summary, first_release_date, rating, total_rating,
             cover.image_id, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer;
      where platforms = ${platformId} & total_rating_count > 10 & cover != null;
      sort total_rating desc;
      limit ${limit};
    `;
    return this.request<IgdbGame>('/games', body);
  }

  /**
   * Получить URL обложки
   * Размеры: cover_small (90x128), cover_big (264x374), screenshot_med (569x320), 
   *          screenshot_big (889x500), screenshot_huge (1280x720), 720p (1280x720), 1080p (1920x1080)
   */
  getCoverUrl(imageId: string | undefined, size: 'cover_small' | 'cover_big' | 'screenshot_big' | '720p' | '1080p' = 'cover_big'): string | null {
    if (!imageId) return null;
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
  }

  /**
   * Получить URL скриншота
   */
  getScreenshotUrl(imageId: string | undefined, size: 'screenshot_med' | 'screenshot_big' | 'screenshot_huge' | '720p' | '1080p' = 'screenshot_big'): string | null {
    if (!imageId) return null;
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
  }

  /**
   * Получить URL трейлера YouTube
   */
  getYouTubeTrailerUrl(videos?: IgdbVideo[]): string | null {
    if (!videos?.length) return null;
    return `https://www.youtube.com/watch?v=${videos[0].video_id}`;
  }

  /**
   * Конвертировать Unix timestamp в год
   */
  timestampToYear(timestamp?: number): number | null {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).getFullYear();
  }

  /**
   * Конвертировать Unix timestamp в дату
   */
  timestampToDate(timestamp?: number): string | null {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toISOString().split('T')[0];
  }

  /**
   * Получить ESRB рейтинг
   */
  getEsrbRating(ageRatings?: IgdbAgeRating[]): string | null {
    if (!ageRatings) return null;
    const esrb = ageRatings.find(r => r.category === 1);
    return esrb ? ESRB_RATINGS[esrb.rating] || null : null;
  }

  /**
   * Конвертировать детали игры в формат приложения
   */
  convertGameToContent(game: IgdbGame): any {
    const developer = game.involved_companies?.find(c => c.developer)?.company.name;
    const publisher = game.involved_companies?.find(c => c.publisher)?.company.name;
    const platforms = game.platforms?.map(p => PLATFORM_SHORT_NAMES[p.id] || p.name) || [];

    return {
      title: game.name,
      content_type: 'GAME',
      description: game.summary || game.storyline || '',
      release_year: this.timestampToYear(game.first_release_date),
      release_date: this.timestampToDate(game.first_release_date),
      genre: game.genres?.map(g => GENRE_RU[g.id] || g.name).join(', ') || '',
      poster_url: this.getCoverUrl(game.cover?.image_id),
      screenshots: game.screenshots?.map(s => this.getScreenshotUrl(s.image_id)) || [],
      trailer_url: this.getYouTubeTrailerUrl(game.videos),
      developer,
      publisher,
      platforms,
      esrb_rating: this.getEsrbRating(game.age_ratings),
      players: game.game_modes?.map(m => m.name).join(', ') || null,
      igdb_id: game.id,
      igdb_rating: game.rating ? Math.round(game.rating) : null,
      igdb_aggregated_rating: game.aggregated_rating ? Math.round(game.aggregated_rating) : null,
      igdb_total_rating: game.total_rating ? Math.round(game.total_rating) : null,
      hype_index: game.hypes || 0,
      themes: game.themes?.map(t => t.name) || [],
      perspectives: game.player_perspectives?.map(p => p.name) || [],
      similar_games: game.similar_games || [],
      status: game.status,
    };
  }

  /**
   * Проверить доступность API
   */
  async isAvailable(): Promise<boolean> {
    if (!this.clientId || !this.clientSecret) return false;
    return await this.ensureAccessToken();
  }

  /**
   * Получить список платформ
   */
  async getPlatforms(): Promise<IgdbPlatform[] | null> {
    const body = `
      fields id, name, abbreviation, slug;
      where category = 1 | category = 5 | category = 6;
      sort name asc;
      limit 50;
    `;
    return this.request<IgdbPlatform>('/platforms', body);
  }

  /**
   * Получить список жанров
   */
  async getGenres(): Promise<IgdbGenre[] | null> {
    const body = `
      fields id, name, slug;
      limit 50;
    `;
    return this.request<IgdbGenre>('/genres', body);
  }
}
