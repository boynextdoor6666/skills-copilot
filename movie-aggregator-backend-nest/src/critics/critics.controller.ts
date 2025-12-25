import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, ParseIntPipe, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CriticsService } from './critics.service';

@Controller('api/critics')
export class CriticsController {
  constructor(private readonly criticsService: CriticsService) {}

  /**
   * GET /api/critics - Get all critics (public)
   */
  @Get()
  async getAllCritics() {
    return this.criticsService.getAllCritics();
  }

  /**
   * GET /api/critics/followed - Get critics followed by current user
   */
  @UseGuards(JwtAuthGuard)
  @Get('followed')
  async getFollowedCritics(@Request() req) {
    // JwtStrategy.validate returns { userId, username, role }
    return this.criticsService.getFollowedCritics(req.user.userId);
  }

  /**
   * POST /api/critics/:id/follow - Follow a critic
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async followCritic(@Request() req, @Param('id', ParseIntPipe) criticId: number) {
    return this.criticsService.followCritic(req.user.userId, criticId);
  }

  /**
   * DELETE /api/critics/:id/follow - Unfollow a critic
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unfollowCritic(@Request() req, @Param('id', ParseIntPipe) criticId: number) {
    return this.criticsService.unfollowCritic(req.user.userId, criticId);
  }

  /**
   * GET /api/critics/personalized - Get personalized ratings for multiple content items
   * Query param: contentIds (comma-separated, e.g., ?contentIds=1,2,3)
   * IMPORTANT: This MUST come BEFORE /personalized/:contentId to avoid route conflicts
   */
  @UseGuards(JwtAuthGuard)
  @Get('personalized')
  async getPersonalizedRatings(@Request() req, @Query('contentIds') contentIdsStr: string) {
    // If no contentIds but called without params, return empty
    if (!contentIdsStr) {
      return {};
    }
    const contentIds = contentIdsStr.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    return this.criticsService.getPersonalizedRatings(req.user.userId, contentIds);
  }

  /**
   * GET /api/critics/personalized/:contentId - Get personalized rating for specific content
   */
  @UseGuards(JwtAuthGuard)
  @Get('personalized/:contentId')
  async getPersonalizedRating(@Request() req, @Param('contentId', ParseIntPipe) contentId: number) {
    return this.criticsService.getPersonalizedRating(req.user.userId, contentId);
  }

  @Get('publications/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllPublications() {
    return this.criticsService.getAllPublications();
  }

  @Post('publications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createPublication(@Body() data: any) {
    return this.criticsService.createPublication(data);
  }

  @Put('publications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePublication(@Param('id') id: number, @Body() data: any) {
    return this.criticsService.updatePublication(id, data);
  }

  @Delete('publications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deletePublication(@Param('id') id: number) {
    return this.criticsService.deletePublication(id);
  }
}
