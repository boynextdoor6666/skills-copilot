import { Controller, Get, Param, UseGuards, Req, Patch, Body, UnauthorizedException, BadRequestException, Query, ParseIntPipe, Post, Delete } from '@nestjs/common';
import { IsOptional, IsString, MinLength, ValidateIf, IsEmail } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { GamificationService } from '../gamification/gamification.service';
import { TasteProfileService } from './taste-profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @ValidateIf(o => o.email && o.email.length > 0)
  @IsEmail({}, { message: 'Некорректный email' })
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  @IsString()
  country?: string | null;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly gamification: GamificationService,
    private readonly tasteProfile: TasteProfileService,
  ) {}
  @Get('me')
  async me(@Req() req: Request) {
    // req.user is set by JwtStrategy validate
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedException();
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  @Patch('me')
  async updateMe(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    console.log('updateMe called with dto:', JSON.stringify(dto));
    const userId = (req.user as any)?.userId;
    console.log('userId from token:', userId);
    if (!userId) throw new UnauthorizedException();
    // sanitize: trim strings, convert empty avatar/bio to null, ignore empty username/email
    const payload: any = {};
    if (typeof dto.username === 'string' && dto.username.trim()) payload.username = dto.username.trim();
    if (typeof dto.email === 'string' && dto.email.trim()) payload.email = dto.email.trim();
    if (typeof dto.avatarUrl === 'string') {
      const v = dto.avatarUrl.trim();
      if (v.length === 0) payload.avatarUrl = null; else payload.avatarUrl = v;
    }
    if (typeof dto.bio === 'string') {
      const v = dto.bio.trim();
      payload.bio = v.length === 0 ? null : v;
    }
    if (typeof dto.country === 'string') {
      const v = dto.country.trim();
      payload.country = v.length === 0 ? null : v;
    }
    return this.users.updateById(userId, payload);
  }

  @Patch('me/password')
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedException();
    const user = await this.users.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    // validate current password
    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException('Current and new passwords are required');
    }
    const bcrypt = require('bcrypt');
    const ok = await bcrypt.compare(String(dto.currentPassword), String(user.password || ''));
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.users.changePassword(userId, dto.newPassword);
    return { message: 'Password changed successfully' };
  }

  // moved this route after /me to avoid shadowing the literal 'me' path
  @Get('by-username/:username')
  findOne(@Param('username') username: string) {
    return this.users.findByUsername(username);
  }

  // Gamification endpoints
  @Get('me/level')
  async getMyLevel(@Req() req: Request) {
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedException();
    return this.gamification.getUserLevel(userId);
  }

  @Get('me/achievements')
  async getMyAchievements(@Req() req: Request) {
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedException();
    return this.gamification.getUserAchievements(userId);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.gamification.getLeaderboard(10);
  }

  // Taste Profile endpoints
  @Get('me/taste-profile')
  async getMyTasteProfile(@Req() req: Request) {
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedException();
    return this.tasteProfile.getUserTasteProfile(userId);
  }

  @Get('me/recommendations')
  async getMyRecommendations(@Req() req: Request, @Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedException();
    return this.tasteProfile.getPersonalizedRecommendations(userId, limit || 10);
  }

  @Get('me/watchlist')
  async getMyWatchlist(@Req() req: Request) {
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedException();
    return this.users.getWatchlist(userId);
  }

  @Post('me/watchlist/:contentId')
  async addToWatchlist(@Req() req: Request, @Param('contentId', ParseIntPipe) contentId: number) {
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedException();
    return this.users.addToWatchlist(userId, contentId);
  }

  @Delete('me/watchlist/:contentId')
  async removeFromWatchlist(@Req() req: Request, @Param('contentId', ParseIntPipe) contentId: number) {
    const userId = (req.user as any)?.userId;
    if (!userId) throw new UnauthorizedException();
    return this.users.removeFromWatchlist(userId, contentId);
  }
}
