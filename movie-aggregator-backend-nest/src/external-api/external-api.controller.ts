import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TmdbService } from './tmdb.service';
import { IgdbService } from './igdb.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/roles.decorator';
import { Content, ContentType } from '../content/entities/content.entity';
import { UserRole } from '../users/user.entity';

@ApiTags('External API')
@Controller('api/external')
export class ExternalApiController {
  private readonly logger = new Logger(ExternalApiController.name);

  constructor(
    private readonly tmdbService: TmdbService,
    private readonly igdbService: IgdbService,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  // ==================== STATUS ====================

  @Get('status')
  @ApiOperation({ summary: 'Проверить статус внешних API' })
  @ApiResponse({ status: 200, description: 'Статус подключения к API' })
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

  // ==================== TMDB - MOVIES ====================

  @Get('tmdb/search/movies')
  @ApiOperation({ summary: 'Поиск фильмов в TMDB' })
  @ApiQuery({ name: 'query', required: true, description: 'Поисковый запрос' })
  @ApiQuery({ name: 'page', required: false, description: 'Страница результатов' })
  @ApiResponse({ status: 200, description: 'Список найденных фильмов' })
  async searchTmdbMovies(
    @Query('query') query: string,
    @Query('page') page?: number,
  ) {
    if (!query) {
      throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
    }

    const results = await this.tmdbService.searchMovies(query, page || 1);
    if (!results) {
      throw new HttpException('TMDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
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

  @Get('tmdb/movies/popular')
  @ApiOperation({ summary: 'Получить популярные фильмы из TMDB' })
  @ApiQuery({ name: 'page', required: false })
  async getPopularTmdbMovies(@Query('page') page?: number) {
    const results = await this.tmdbService.getPopularMovies(page || 1);
    if (!results) {
      throw new HttpException('TMDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
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

  @Get('tmdb/movies/top-rated')
  @ApiOperation({ summary: 'Получить топ фильмов из TMDB' })
  @ApiQuery({ name: 'page', required: false })
  async getTopRatedTmdbMovies(@Query('page') page?: number) {
    const results = await this.tmdbService.getTopRatedMovies(page || 1);
    if (!results) {
      throw new HttpException('TMDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
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

  @Get('tmdb/movies/upcoming')
  @ApiOperation({ summary: 'Получить предстоящие фильмы из TMDB' })
  @ApiQuery({ name: 'page', required: false })
  async getUpcomingTmdbMovies(@Query('page') page?: number) {
    const results = await this.tmdbService.getUpcomingMovies(page || 1);
    if (!results) {
      throw new HttpException('TMDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
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

  @Get('tmdb/movies/:id')
  @ApiOperation({ summary: 'Получить детали фильма из TMDB' })
  @ApiResponse({ status: 200, description: 'Детальная информация о фильме' })
  async getTmdbMovieDetails(@Param('id') id: number) {
    const movie = await this.tmdbService.getMovieDetails(id);
    if (!movie) {
      throw new HttpException('Movie not found or TMDB unavailable', HttpStatus.NOT_FOUND);
    }

    return this.tmdbService.convertMovieToContent(movie);
  }

  // ==================== TMDB - TV SHOWS ====================

  @Get('tmdb/search/tv')
  @ApiOperation({ summary: 'Поиск сериалов в TMDB' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'page', required: false })
  async searchTmdbTvShows(
    @Query('query') query: string,
    @Query('page') page?: number,
  ) {
    if (!query) {
      throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
    }

    const results = await this.tmdbService.searchTvShows(query, page || 1);
    if (!results) {
      throw new HttpException('TMDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
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

  @Get('tmdb/tv/popular')
  @ApiOperation({ summary: 'Получить популярные сериалы из TMDB' })
  @ApiQuery({ name: 'page', required: false })
  async getPopularTmdbTvShows(@Query('page') page?: number) {
    const results = await this.tmdbService.getPopularTvShows(page || 1);
    if (!results) {
      throw new HttpException('TMDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
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

  @Get('tmdb/tv/:id')
  @ApiOperation({ summary: 'Получить детали сериала из TMDB' })
  async getTmdbTvShowDetails(@Param('id') id: number) {
    const show = await this.tmdbService.getTvShowDetails(id);
    if (!show) {
      throw new HttpException('TV Show not found or TMDB unavailable', HttpStatus.NOT_FOUND);
    }

    return this.tmdbService.convertTvShowToContent(show);
  }

  // ==================== IGDB - GAMES ====================

  @Get('igdb/search')
  @ApiOperation({ summary: 'Поиск игр в IGDB' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'limit', required: false })
  async searchIgdbGames(
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ) {
    if (!query) {
      throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
    }

    const results = await this.igdbService.searchGames(query, limit || 20);
    if (!results) {
      throw new HttpException('IGDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    return results.map(game => ({
      ...game,
      cover_url: this.igdbService.getCoverUrl(game.cover?.image_id),
      release_year: this.igdbService.timestampToYear(game.first_release_date),
    }));
  }

  @Get('igdb/games/popular')
  @ApiOperation({ summary: 'Получить популярные игры из IGDB' })
  @ApiQuery({ name: 'limit', required: false })
  async getPopularIgdbGames(@Query('limit') limit?: number) {
    const results = await this.igdbService.getPopularGames(limit || 20);
    if (!results) {
      throw new HttpException('IGDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    return results.map(game => ({
      ...game,
      cover_url: this.igdbService.getCoverUrl(game.cover?.image_id),
      release_year: this.igdbService.timestampToYear(game.first_release_date),
    }));
  }

  @Get('igdb/games/top-rated')
  @ApiOperation({ summary: 'Получить топ игр по рейтингу из IGDB' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopRatedIgdbGames(@Query('limit') limit?: number) {
    const results = await this.igdbService.getTopRatedGames(limit || 20);
    if (!results) {
      throw new HttpException('IGDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    return results.map(game => ({
      ...game,
      cover_url: this.igdbService.getCoverUrl(game.cover?.image_id),
      release_year: this.igdbService.timestampToYear(game.first_release_date),
    }));
  }

  @Get('igdb/games/upcoming')
  @ApiOperation({ summary: 'Получить предстоящие игры из IGDB' })
  @ApiQuery({ name: 'limit', required: false })
  async getUpcomingIgdbGames(@Query('limit') limit?: number) {
    const results = await this.igdbService.getUpcomingGames(limit || 20);
    if (!results) {
      throw new HttpException('IGDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    return results.map(game => ({
      ...game,
      cover_url: this.igdbService.getCoverUrl(game.cover?.image_id),
      release_date: this.igdbService.timestampToDate(game.first_release_date),
    }));
  }

  @Get('igdb/games/recent')
  @ApiOperation({ summary: 'Получить недавно вышедшие игры из IGDB' })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentIgdbGames(@Query('limit') limit?: number) {
    const results = await this.igdbService.getRecentlyReleasedGames(limit || 20);
    if (!results) {
      throw new HttpException('IGDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    return results.map(game => ({
      ...game,
      cover_url: this.igdbService.getCoverUrl(game.cover?.image_id),
      release_year: this.igdbService.timestampToYear(game.first_release_date),
    }));
  }

  @Get('igdb/games/:id')
  @ApiOperation({ summary: 'Получить детали игры из IGDB' })
  async getIgdbGameDetails(@Param('id') id: number) {
    const game = await this.igdbService.getGameDetails(id);
    if (!game) {
      throw new HttpException('Game not found or IGDB unavailable', HttpStatus.NOT_FOUND);
    }

    return this.igdbService.convertGameToContent(game);
  }

  @Get('igdb/platforms')
  @ApiOperation({ summary: 'Получить список платформ из IGDB' })
  async getIgdbPlatforms() {
    const platforms = await this.igdbService.getPlatforms();
    if (!platforms) {
      throw new HttpException('IGDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return platforms;
  }

  @Get('igdb/genres')
  @ApiOperation({ summary: 'Получить список жанров игр из IGDB' })
  async getIgdbGenres() {
    const genres = await this.igdbService.getGenres();
    if (!genres) {
      throw new HttpException('IGDB API unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return genres;
  }

  // ==================== IMPORT TO DATABASE ====================

  @Post('import/movie/:tmdbId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Импортировать фильм из TMDB в базу данных (только для админов)' })
  @ApiResponse({ status: 201, description: 'Фильм успешно импортирован' })
  async importMovieFromTmdb(@Param('tmdbId') tmdbId: number) {
    const movie = await this.tmdbService.getMovieDetails(tmdbId);
    if (!movie) {
      throw new HttpException('Movie not found in TMDB', HttpStatus.NOT_FOUND);
    }

    // Проверка на дубликат
    const existing = await this.contentRepository.findOne({
      where: { title: movie.title, content_type: ContentType.MOVIE },
    });
    if (existing) {
      throw new HttpException('Movie already exists in database', HttpStatus.CONFLICT);
    }

    const contentData = this.tmdbService.convertMovieToContent(movie);
    const content = Object.assign(new Content(), {
      ...contentData,
      content_type: ContentType.MOVIE,
    });

    const saved = await this.contentRepository.save(content);
    this.logger.log(`Imported movie from TMDB: ${movie.title} (ID: ${saved.id})`);

    return {
      message: 'Movie imported successfully',
      content: saved,
    };
  }

  @Post('import/tv/:tmdbId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Импортировать сериал из TMDB в базу данных (только для админов)' })
  @ApiResponse({ status: 201, description: 'Сериал успешно импортирован' })
  async importTvShowFromTmdb(@Param('tmdbId') tmdbId: number) {
    const show = await this.tmdbService.getTvShowDetails(tmdbId);
    if (!show) {
      throw new HttpException('TV Show not found in TMDB', HttpStatus.NOT_FOUND);
    }

    // Проверка на дубликат
    const existing = await this.contentRepository.findOne({
      where: { title: show.name, content_type: ContentType.TV_SERIES },
    });
    if (existing) {
      throw new HttpException('TV Show already exists in database', HttpStatus.CONFLICT);
    }

    const contentData = this.tmdbService.convertTvShowToContent(show);
    const content = Object.assign(new Content(), {
      ...contentData,
      content_type: ContentType.TV_SERIES,
    });

    const saved = await this.contentRepository.save(content);
    this.logger.log(`Imported TV show from TMDB: ${show.name} (ID: ${saved.id})`);

    return {
      message: 'TV Show imported successfully',
      content: saved,
    };
  }

  @Post('import/game/:igdbId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Импортировать игру из IGDB в базу данных (только для админов)' })
  @ApiResponse({ status: 201, description: 'Игра успешно импортирована' })
  async importGameFromIgdb(@Param('igdbId') igdbId: number) {
    const game = await this.igdbService.getGameDetails(igdbId);
    if (!game) {
      throw new HttpException('Game not found in IGDB', HttpStatus.NOT_FOUND);
    }

    // Проверка на дубликат
    const existing = await this.contentRepository.findOne({
      where: { title: game.name, content_type: ContentType.GAME },
    });
    if (existing) {
      throw new HttpException('Game already exists in database', HttpStatus.CONFLICT);
    }

    const contentData = this.igdbService.convertGameToContent(game);
    const content = Object.assign(new Content(), {
      ...contentData,
      content_type: ContentType.GAME,
    });

    const saved = await this.contentRepository.save(content);
    this.logger.log(`Imported game from IGDB: ${game.name} (ID: ${saved.id})`);

    return {
      message: 'Game imported successfully',
      content: saved,
    };
  }

  // ==================== BULK IMPORT ====================

  @Post('import/bulk/movies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Массовый импорт фильмов из TMDB' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        tmdbIds: { type: 'array', items: { type: 'number' } } 
      } 
    } 
  })
  async bulkImportMovies(@Body() body: { tmdbIds: number[] }) {
    if (!body.tmdbIds?.length) {
      throw new HttpException('tmdbIds array is required', HttpStatus.BAD_REQUEST);
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
      skipped: [] as any[],
    };

    for (const tmdbId of body.tmdbIds) {
      try {
        const movie = await this.tmdbService.getMovieDetails(tmdbId);
        if (!movie) {
          results.failed.push({ tmdbId, reason: 'Not found in TMDB' });
          continue;
        }

        const existing = await this.contentRepository.findOne({
          where: { title: movie.title, content_type: ContentType.MOVIE },
        });
        if (existing) {
          results.skipped.push({ tmdbId, title: movie.title, reason: 'Already exists' });
          continue;
        }

        const contentData = this.tmdbService.convertMovieToContent(movie);
        const content = Object.assign(new Content(), {
          ...contentData,
          content_type: ContentType.MOVIE,
        });
        const saved = await this.contentRepository.save(content);
        results.success.push({ tmdbId, id: saved.id, title: movie.title });
      } catch (error) {
        results.failed.push({ tmdbId, reason: String(error) });
      }
    }

    return results;
  }

  @Post('import/bulk/games')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Массовый импорт игр из IGDB' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        igdbIds: { type: 'array', items: { type: 'number' } } 
      } 
    } 
  })
  async bulkImportGames(@Body() body: { igdbIds: number[] }) {
    if (!body.igdbIds?.length) {
      throw new HttpException('igdbIds array is required', HttpStatus.BAD_REQUEST);
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
      skipped: [] as any[],
    };

    for (const igdbId of body.igdbIds) {
      try {
        const game = await this.igdbService.getGameDetails(igdbId);
        if (!game) {
          results.failed.push({ igdbId, reason: 'Not found in IGDB' });
          continue;
        }

        const existing = await this.contentRepository.findOne({
          where: { title: game.name, content_type: ContentType.GAME },
        });
        if (existing) {
          results.skipped.push({ igdbId, title: game.name, reason: 'Already exists' });
          continue;
        }

        const contentData = this.igdbService.convertGameToContent(game);
        const content = Object.assign(new Content(), {
          ...contentData,
          content_type: ContentType.GAME,
        });
        const saved = await this.contentRepository.save(content);
        results.success.push({ igdbId, id: saved.id, title: game.name });
      } catch (error) {
        results.failed.push({ igdbId, reason: String(error) });
      }
    }

    return results;
  }
}
