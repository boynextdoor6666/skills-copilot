import { Body, Controller, Get, HttpCode, Post, UseGuards, Req, Logger } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IsEmail, IsNotEmpty, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../users/user.entity';

class LoginDto {
  @IsNotEmpty()
  usernameOrEmail: string;

  @IsNotEmpty()
  password: string;
}

class RegisterDto {
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth
      .validateUser(dto.usernameOrEmail, dto.password)
      .then((u) => this.auth.login(u));
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Get('validate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async validate(@Req() req: Request) {
    // Safe debug log (не выводим сам токен)
    if (req.headers.authorization) {
      this.logger.debug('Authorization header present');
    } else {
      this.logger.debug('Authorization header missing');
    }
    
    // req.user contains { userId, username, role } from JwtStrategy
    const userId = (req.user as any)?.userId;
    if (userId) {
      const user = await this.auth.findById(userId);
      if (user) {
        // Return full user object similar to login response
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          level: user.level,
          totalReviews: user.totalReviews,
          totalRatings: user.totalRatings,
          reputation: user.reputation,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          country: user.country,
        };
      }
    }
    
    // Fallback to token payload if DB lookup fails (should not happen)
    return req.user;
  }
}
