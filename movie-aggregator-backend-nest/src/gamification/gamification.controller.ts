import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('api/gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-achievements')
  async getMyAchievements(@Request() req) {
    return this.gamificationService.getUserAchievements(req.user.userId);
  }

  @Get('user/:id')
  async getUserAchievements(@Param('id') id: string) {
    return this.gamificationService.getUserAchievements(+id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllAchievements() {
    return this.gamificationService.getAllAchievements();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createAchievement(@Body() data: any) {
    return this.gamificationService.createAchievement(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateAchievement(@Param('id') id: number, @Body() data: any) {
    return this.gamificationService.updateAchievement(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteAchievement(@Param('id') id: number) {
    return this.gamificationService.deleteAchievement(id);
  }
}
