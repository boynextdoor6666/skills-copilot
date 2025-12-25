import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/roles.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, PublishProReviewDto } from './dto/review.dto';
import { UserRole } from '../users/user.entity';

@Controller('api/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Добавить отзыв зрителя (USER, CRITIC, ADMIN)
  @Post()
  @UseGuards(JwtAuthGuard)
  async addReview(@Request() req, @Body() createDto: CreateReviewDto) {
    return this.reviewsService.addViewerReview(req.user.userId, createDto);
  }

  // Опубликовать профессиональный отзыв (только CRITIC)
  @Post('pro')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CRITIC)
  async publishProReview(@Request() req, @Body() publishDto: PublishProReviewDto) {
    return this.reviewsService.publishProReview(req.user.userId, publishDto);
  }

  // Удалить отзыв (только ADMIN)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteReview(
    @Param('id') id: number,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    return this.reviewsService.deleteReview(id, req.user.userId, reason);
  }

  // Получить отзывы для контента (публичный)
  @Get('content/:contentId')
  async getReviewsByContent(@Param('contentId') contentId: number) {
    return this.reviewsService.getReviewsByContent(contentId);
  }

  // Получить отзывы пользователя (публичный или защищённый)
  @Get('user/:userId')
  async getReviewsByUser(@Param('userId') userId: number) {
    return this.reviewsService.getReviewsByUser(userId);
  }

  // Получить мои отзывы (защищённый)
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(@Request() req) {
    return this.reviewsService.getReviewsByUser(req.user.userId);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  async voteReview(
    @Param('id') id: number,
    @Request() req,
    @Body('type') type: 'LIKE' | 'DISLIKE',
  ) {
    if (!['LIKE', 'DISLIKE'].includes(type)) {
      throw new BadRequestException('Invalid vote type');
    }
    return this.reviewsService.voteReview(req.user.userId, id, type);
  }
}
