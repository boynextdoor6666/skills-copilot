import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { Content, ContentType } from '../content/entities/content.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Review) private reviews: Repository<Review>,
    @InjectRepository(Content) private content: Repository<Content>,
  ) {}

  async getDashboardStats() {
    const userStats = await this.getUserStats();
    const contentStats = await this.getContentStats();
    const reviewStats = await this.getReviewStats();
    
    // Mock system health for now (or check DB connection)
    const systemHealth = {
      database: 'connected',
      tmdb: process.env.TMDB_API_KEY ? 'configured' : 'missing',
      igdb: (process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET) ? 'configured' : 'missing',
      version: '1.0.0'
    };

    return {
      users: userStats,
      content: contentStats,
      reviews: reviewStats,
      system: systemHealth
    };
  }

  async getContentStats() {
    const [total, movies, series, games] = await Promise.all([
      this.content.count(),
      this.content.count({ where: { content_type: ContentType.MOVIE } }),
      this.content.count({ where: { content_type: ContentType.TV_SERIES } }),
      this.content.count({ where: { content_type: ContentType.GAME } }),
    ]);

    return {
      total,
      byType: {
        movies,
        series,
        games
      }
    };
  }

  async getReviewStats() {
    const total = await this.reviews.count();
    const avgRatingResult = await this.reviews
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .getRawOne();
    
    const avgRating = avgRatingResult ? parseFloat(avgRatingResult.avg).toFixed(1) : 0;

    // Last 7 days activity
    const last7Days = await this.reviews
      .createQueryBuilder('review')
      .select("DATE_FORMAT(review.created_at, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('review.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      total,
      avgRating,
      activity: last7Days
    };
  }

  async getAllUsers(role?: UserRole) {
    const query = this.users.createQueryBuilder('user');
    if (role) {
      query.where('user.role = :role', { role });
    }
    return query.orderBy('user.registrationDate', 'DESC').getMany();
  }

  async getAllReviews() {
    return this.reviews.find({
      relations: ['user', 'contentEntity'],
      order: { created_at: 'DESC' },
      take: 100, // Limit to last 100 for performance
    });
  }

  async deleteReview(id: number) {
    const review = await this.reviews.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviews.remove(review);
    return { message: 'Review deleted' };
  }

  async getUserStats() {
    const [total, active, admins, critics, regularUsers] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { isActive: true } }),
      this.users.count({ where: { role: UserRole.ADMIN } }),
      this.users.count({ where: { role: UserRole.CRITIC } }),
      this.users.count({ where: { role: UserRole.USER } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byRole: {
        admins,
        critics,
        users: regularUsers,
      },
    };
  }

  async updateUserStatus(userId: number, isActive: boolean) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = isActive;
    return this.users.save(user);
  }

  async updateUserRole(userId: number, role: UserRole) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    return this.users.save(user);
  }

  async deleteUser(userId: number) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.users.remove(user);
    return { message: 'User deleted successfully', userId };
  }

  async getTopUsers(limit = 10) {
    return this.users
      .createQueryBuilder('user')
      .where('user.isActive = :active', { active: true })
      .orderBy('user.reputation', 'DESC')
      .limit(limit)
      .getMany();
  }
}
