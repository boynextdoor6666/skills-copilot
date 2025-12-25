import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ExpectationsService } from './expectations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/expectations')
export class ExpectationsController {
  constructor(private readonly expectationsService: ExpectationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':contentId')
  async setExpectation(@Request() req, @Param('contentId') contentId: string, @Body('rating') rating: number) {
    return this.expectationsService.setExpectation(req.user.userId, +contentId, rating);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':contentId/me')
  async getMyExpectation(@Request() req, @Param('contentId') contentId: string) {
    return this.expectationsService.getExpectation(req.user.userId, +contentId);
  }

  @Get(':contentId')
  async getContentExpectations(@Param('contentId') contentId: string) {
    return this.expectationsService.getContentExpectations(+contentId);
  }
}
