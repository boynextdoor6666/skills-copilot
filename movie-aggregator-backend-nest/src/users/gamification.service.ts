import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'reviews' | 'critics' | 'diversity' | 'engagement' | 'special';
  requirement: number;
  unlockedAt?: Date;
  progress?: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);
  constructor(@InjectConnection() private readonly conn: Connection) {}

  private achievements: Achievement[] = [
    // Review Milestones
    { id: 'first_review', title: 'Первый шаг', description: 'Оставьте свой первый отзыв', icon: '✍️', category: 'reviews', requirement: 1 },
    { id: 'review_5', title: 'Активный зритель', description: 'Оставьте 5 отзывов', icon: '📝', category: 'reviews', requirement: 5 },
    { id: 'review_10', title: 'Заядлый критик', description: 'Оставьте 10 отзывов', icon: '🎬', category: 'reviews', requirement: 10 },
    { id: 'review_25', title: 'Эксперт', description: 'Оставьте 25 отзывов', icon: '⭐', category: 'reviews', requirement: 25 },
    { id: 'review_50', title: 'Мастер рецензий', description: 'Оставьте 50 отзывов', icon: '🏆', category: 'reviews', requirement: 50 },
    { id: 'review_100', title: 'Легенда', description: 'Оставьте 100 отзывов', icon: '👑', category: 'reviews', requirement: 100 },

    // Critic Following
    { id: 'first_follow', title: 'Ищущий вкус', description: 'Подпишитесь на первого критика', icon: '👤', category: 'critics', requirement: 1 },
    { id: 'follow_5', title: 'Знаток мнений', description: 'Подпишитесь на 5 критиков', icon: '👥', category: 'critics', requirement: 5 },
    { id: 'follow_10', title: 'Коллекционер вкусов', description: 'Подпишитесь на 10 критиков', icon: '🎭', category: 'critics', requirement: 10 },

    // Genre Diversity
    { id: 'genre_3', title: 'Открытый разум', description: 'Оставьте отзывы на контент 3 разных жанров', icon: '🌈', category: 'diversity', requirement: 3 },
    { id: 'genre_5', title: 'Универсал', description: 'Оставьте отзывы на контент 5 разных жанров', icon: '🎨', category: 'diversity', requirement: 5 },
    { id: 'all_types', title: 'Всеядный', description: 'Оставьте отзывы на фильмы, сериалы и игры', icon: '🎯', category: 'diversity', requirement: 3 },

    // Engagement
    { id: 'detailed_review', title: 'Детальный анализ', description: 'Оставьте отзыв со всеми аспектами и эмоциями', icon: '📊', category: 'engagement', requirement: 1 },
    { id: 'weekly_active', title: 'Еженедельник', description: 'Оставляйте отзывы 7 дней подряд', icon: '📅', category: 'engagement', requirement: 7 },
    
    // Special
    { id: 'early_bird', title: 'Первопроходец', description: 'Оставьте первый отзыв на новый контент', icon: '🚀', category: 'special', requirement: 1 },
    { id: 'gem_finder', title: 'Охотник за сокровищами', description: 'Найдите 3 скрытые жемчужины (высокий рейтинг, низкий хайп)', icon: '💎', category: 'special', requirement: 3 },
  ];

  /**
   * Get user's current level based on total reviews
   */
  async getUserLevel(userId: number): Promise<{ level: number; currentXP: number; nextLevelXP: number; title: string }> {
    try {
      const [result] = await this.conn.query(`
        SELECT COUNT(*) as review_count FROM reviews WHERE user_id = ?
      `, [userId]);

      const reviewCount = result?.review_count || 0;
      
      // XP = reviews * 10
      const xp = reviewCount * 10;
      
      // Level formula: level = floor(sqrt(xp / 100))
      const level = Math.floor(Math.sqrt(xp / 100)) + 1;
      const nextLevelXP = Math.pow(level, 2) * 100;
      const currentXP = xp;

      const titles = [
        'Новичок', 'Зритель', 'Любитель', 'Знаток', 'Эксперт',
        'Мастер', 'Гуру', 'Легенда', 'Титан', 'Божество кино'
      ];
      const title = titles[Math.min(level - 1, titles.length - 1)];

      return { level, currentXP, nextLevelXP, title };
    } catch (err) {
      this.logger.error(`getUserLevel error: ${(err as any)?.message || err}`);
      return { level: 1, currentXP: 0, nextLevelXP: 100, title: 'Новичок' };
    }
  }

  /**
   * Get user's achievements with progress
   */
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    try {
      // Get user stats
      const [reviewStats] = await this.conn.query(`
        SELECT 
          COUNT(*) as total_reviews,
          COUNT(DISTINCT CASE WHEN c.genre IS NOT NULL THEN c.genre END) as unique_genres,
          COUNT(DISTINCT CASE WHEN c.content_type IS NOT NULL THEN c.content_type END) as unique_types,
          SUM(CASE WHEN r.aspects IS NOT NULL AND r.emotions IS NOT NULL THEN 1 ELSE 0 END) as detailed_reviews
        FROM reviews r
        LEFT JOIN content c ON c.id = r.content_id
        WHERE r.user_id = ?
      `, [userId]);

      const [followStats] = await this.conn.query(`
        SELECT COUNT(*) as follow_count FROM user_critic_preferences WHERE user_id = ?
      `, [userId]);

      const stats = {
        reviews: reviewStats?.total_reviews || 0,
        genres: reviewStats?.unique_genres || 0,
        types: reviewStats?.unique_types || 0,
        detailedReviews: reviewStats?.detailed_reviews || 0,
        follows: followStats?.follow_count || 0,
      };

      // Calculate progress for each achievement
      return this.achievements.map(achievement => {
        let progress = 0;
        let unlocked = false;

        switch (achievement.category) {
          case 'reviews':
            progress = Math.min(stats.reviews, achievement.requirement);
            unlocked = stats.reviews >= achievement.requirement;
            break;
          case 'critics':
            progress = Math.min(stats.follows, achievement.requirement);
            unlocked = stats.follows >= achievement.requirement;
            break;
          case 'diversity':
            if (achievement.id === 'all_types') {
              progress = stats.types;
              unlocked = stats.types >= 3;
            } else {
              progress = Math.min(stats.genres, achievement.requirement);
              unlocked = stats.genres >= achievement.requirement;
            }
            break;
          case 'engagement':
            if (achievement.id === 'detailed_review') {
              progress = Math.min(stats.detailedReviews, 1);
              unlocked = stats.detailedReviews >= 1;
            }
            break;
        }

        return {
          ...achievement,
          progress,
          unlockedAt: unlocked ? new Date() : undefined,
        };
      });
    } catch (err) {
      this.logger.error(`getUserAchievements error: ${(err as any)?.message || err}`);
      return this.achievements.map(a => ({ ...a, progress: 0 }));
    }
  }

  /**
   * Get leaderboard top users
   */
  async getLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      const leaderboard = await this.conn.query(`
        SELECT 
          u.id,
          u.username,
          COUNT(r.id) as review_count,
          AVG(r.rating) as avg_rating
        FROM users u
        LEFT JOIN reviews r ON r.user_id = u.id
        WHERE u.role IN ('VIEWER', 'CRITIC')
        GROUP BY u.id, u.username
        HAVING review_count > 0
        ORDER BY review_count DESC, avg_rating DESC
        LIMIT ?
      `, [limit]);

      return leaderboard.map((user: any, index: number) => ({
        rank: index + 1,
        userId: user.id,
        username: user.username,
        reviewCount: user.review_count,
        avgRating: user.avg_rating ? parseFloat(user.avg_rating).toFixed(1) : 'N/A',
        xp: user.review_count * 10,
      }));
    } catch (err) {
      this.logger.error(`getLeaderboard error: ${(err as any)?.message || err}`);
      return [];
    }
  }
}
