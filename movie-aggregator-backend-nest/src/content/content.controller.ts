import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/roles.decorator';
import { ContentService } from './content.service';
import { CreateContentDto, UpdateContentDto, SearchContentDto } from './dto/content.dto';
import { ContentType } from './entities/content.entity';
import { UserRole } from '../users/user.entity';

@Controller('api/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // Публичный поиск контента (для посетителей и зарегистрированных)
  @Get('search')
  async searchContent(@Query() searchDto: SearchContentDto) {
    return this.contentService.searchContent(searchDto);
  }

  // Автодополнение для поиска (быстрый поиск по заголовкам)
  @Get('autocomplete')
  async autocomplete(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.contentService.autocomplete(query, limit || 10);
  }

  // Получить список всего контента с фильтром (MUST be before :id routes)
  @Get()
  async getAllContent(
    @Query('type') type?: ContentType,
    @Query('limit') limit?: number,
  ) {
    return this.contentService.getAllContent(type, limit || 50);
  }

  // ============= DASHBOARD STATS (PUBLIC) =============
  // ВАЖНО: Этот статический маршрут должен идти ПЕРЕД динамическим ":id",
  // иначе NestJS сопоставит "stats" как :id и вернёт 500.
  @Get('stats')
  async getContentStats() {
    return this.contentService.getContentStats();
  }

  // Глобальная статистика рейтингов по странам (все контенты)
  @Get('country-stats/global')
  async getGlobalCountryStats() {
    return this.contentService.getGlobalCountryStats();
  }

  // Alias для совместимости с frontend
  @Get('country-ratings/stats')
  async getCountryRatingsStats() {
    const countryStats = await this.contentService.getGlobalCountryStats();
    
    // Рассчитываем общую статистику
    const totalCountries = countryStats.length;
    const totalRatings = countryStats.reduce((sum, c) => sum + c.reviewsCount, 0);
    const activeUsers = countryStats.reduce((sum, c) => sum + c.usersCount, 0);
    
    // Средняя разница между странами
    const allRatings = countryStats.map(c => c.avgRating);
    const globalAvg = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;
    const avgDifference = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + Math.abs(r - globalAvg), 0) / allRatings.length
      : 0;

    return {
      totalCountries,
      totalRatings,
      activeUsers,
      avgDifference: parseFloat(avgDifference.toFixed(2)),
      countries: countryStats,
    };
  }

  // Получить эмоциональное облако
  @Get(':id/emotional-cloud')
  async getEmotionalCloud(@Param('id') id: number) {
    return this.contentService.getEmotionalCloud(id);
  }

  // Получить карту восприятия
  @Get(':id/perception-map')
  async getPerceptionMap(@Param('id') id: number) {
    return this.contentService.getPerceptionMap(id);
  }

  // Получить динамику рейтингов
  @Get(':id/dynamics')
  async getDynamicsGraph(@Param('id') id: number) {
    return this.contentService.getDynamicsGraph(id);
  }

  // Получить статистику рейтингов по странам для конкретного контента
  @Get(':id/country-ratings')
  async getCountryRatings(@Param('id') id: number) {
    return this.contentService.getCountryRatings(id);
  }

  // Получить детали контента (публичный эндпоинт)
  @Get(':id')
  async getContentById(@Param('id') id: number) {
    return this.contentService.getContentById(id);
  }

  // Создать контент (только ADMIN)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createContent(@Body() createDto: CreateContentDto) {
    return this.contentService.createContent(createDto);
  }

  // Обновить контент (только ADMIN через процедуру)
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateContent(
    @Param('id') id: number,
    @Body() updateDto: UpdateContentDto,
    @Request() req,
  ) {
    return this.contentService.updateContent(id, updateDto, req.user.userId);
  }

  // Удалить контент (только ADMIN)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteContent(@Param('id') id: number) {
    return this.contentService.deleteContent(id);
  }

  // ============= HERO CAROUSEL ENDPOINTS =============
  @Get('hero-carousel/active')
  async getActiveHeroCarousel(@Query('sort') sort?: string) {
    return this.contentService.getActiveHeroCarousel(sort);
  }

  @Get('hero-carousel/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllHeroCarousel() {
    return this.contentService.getAllHeroCarousel();
  }

  @Post('hero-carousel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createHeroCarousel(@Body() data: any) {
    return this.contentService.createHeroCarousel(data);
  }

  @Put('hero-carousel/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateHeroCarousel(@Param('id') id: number, @Body() data: any) {
    return this.contentService.updateHeroCarousel(id, data);
  }

  @Delete('hero-carousel/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteHeroCarousel(@Param('id') id: number) {
    return this.contentService.deleteHeroCarousel(id);
  }

  // ============= COMING SOON ENDPOINTS =============
  @Get('coming-soon/active')
  async getActiveComingSoon() {
    return this.contentService.getActiveComingSoon();
  }

  @Get('coming-soon/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllComingSoon() {
    return this.contentService.getAllComingSoon();
  }

  @Post('coming-soon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createComingSoon(@Body() data: any) {
    return this.contentService.createComingSoon(data);
  }

  @Put('coming-soon/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateComingSoon(@Param('id') id: number, @Body() data: any) {
    return this.contentService.updateComingSoon(id, data);
  }

  @Delete('coming-soon/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteComingSoon(@Param('id') id: number) {
    return this.contentService.deleteComingSoon(id);
  }

  // ============= DASHBOARD STATS (PUBLIC) =============
  // (перемещён выше над :id)
}
