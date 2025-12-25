import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  getStats() {
    return this.admin.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with optional role filter' })
  getAllUsers(@Query('role') role?: UserRole) {
    return this.admin.getAllUsers(role);
  }

  @Get('users/top')
  @ApiOperation({ summary: 'Get top users by reputation' })
  getTopUsers(@Query('limit', ParseIntPipe) limit = 10) {
    return this.admin.getTopUsers(limit);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews' })
  getAllReviews() {
    return this.admin.getAllReviews();
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete review' })
  deleteReview(@Param('id', ParseIntPipe) id: number) {
    return this.admin.deleteReview(id);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Ban/unban user' })
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.admin.updateUserStatus(id, isActive);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: UserRole,
  ) {
    return this.admin.updateUserRole(id, role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user permanently' })
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.admin.deleteUser(id);
  }
}
