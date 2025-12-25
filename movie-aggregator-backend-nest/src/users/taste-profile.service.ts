import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

export interface TasteProfile {
  userId: number;
  favoriteGenres: Array<{ genre: string; count: number; avgRating: number }>;
  favoriteAspects: { [key: string]: number }; // Average scores for each aspect
  dominantEmotions: Array<{ emotion: string; intensity: number; count: number }>;
  preferredContentTypes: Array<{ type: string; count: number; avgRating: number }>;
  ratingTendency: {
    average: number;
    min: number;
    max: number;
    distribution: { harsh: number; balanced: number; generous: number };
  };
  totalReviews: number;
}

export interface Recommendation {
  contentId: number;
  title: string;
  contentType: string;
  genre: string;
  avgRating: number;
  matchScore: number; // 0-100
  matchReasons: string[];
  posterUrl?: string;
  releaseYear?: number;
}

@Injectable()
export class TasteProfileService {
  private readonly logger = new Logger(TasteProfileService.name);
  constructor(@InjectConnection() private readonly conn: Connection) {}

  /**
   * Analyze user's review history to build taste profile
   */
  async getUserTasteProfile(userId: number): Promise<TasteProfile> {
    try {
      // Get favorite genres
      const genreStats = await this.conn.query(`
        SELECT 
          c.genre,
          COUNT(*) as count,
          AVG(r.rating) as avg_rating
        FROM reviews r
        JOIN content c ON c.id = r.content_id
        WHERE r.user_id = ? AND c.genre IS NOT NULL AND r.rating IS NOT NULL
        GROUP BY c.genre
        ORDER BY count DESC, avg_rating DESC
        LIMIT 5
      `, [userId]);

      // Get content type preferences
      const typeStats = await this.conn.query(`
        SELECT 
          c.content_type as type,
          COUNT(*) as count,
          AVG(r.rating) as avg_rating
        FROM reviews r
        JOIN content c ON c.id = r.content_id
        WHERE r.user_id = ? AND r.rating IS NOT NULL
        GROUP BY c.content_type
        ORDER BY count DESC
      `, [userId]);

      // Get aspect preferences (from JSON aspects field)
      const aspectsData = await this.conn.query(`
        SELECT aspects FROM reviews 
        WHERE user_id = ? AND aspects IS NOT NULL
      `, [userId]);

      const aspectAverages: { [key: string]: { sum: number; count: number } } = {};
      aspectsData.forEach((row: any) => {
        try {
          const aspects = typeof row.aspects === 'string' ? JSON.parse(row.aspects) : row.aspects;
          if (aspects && typeof aspects === 'object') {
            Object.entries(aspects).forEach(([key, value]) => {
              if (typeof value === 'number') {
                if (!aspectAverages[key]) aspectAverages[key] = { sum: 0, count: 0 };
                aspectAverages[key].sum += value;
                aspectAverages[key].count += 1;
              }
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });

      const favoriteAspects: { [key: string]: number } = {};
      Object.entries(aspectAverages).forEach(([key, { sum, count }]) => {
        favoriteAspects[key] = parseFloat((sum / count).toFixed(2));
      });

      // Get emotion preferences
      const emotionsData = await this.conn.query(`
        SELECT emotions FROM reviews 
        WHERE user_id = ? AND emotions IS NOT NULL
      `, [userId]);

      const emotionStats: { [key: string]: { sum: number; count: number } } = {};
      emotionsData.forEach((row: any) => {
        try {
          const emotions = typeof row.emotions === 'string' ? JSON.parse(row.emotions) : row.emotions;
          if (emotions && typeof emotions === 'object') {
            Object.entries(emotions).forEach(([key, value]) => {
              if (typeof value === 'number' && value > 0) {
                if (!emotionStats[key]) emotionStats[key] = { sum: 0, count: 0 };
                emotionStats[key].sum += value;
                emotionStats[key].count += 1;
              }
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });

      const dominantEmotions = Object.entries(emotionStats)
        .map(([emotion, { sum, count }]) => ({
          emotion,
          intensity: parseFloat((sum / count).toFixed(2)),
          count,
        }))
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 5);

      // Get rating tendency
      const [ratingStats] = await this.conn.query(`
        SELECT 
          AVG(rating) as avg_rating,
          MIN(rating) as min_rating,
          MAX(rating) as max_rating,
          SUM(CASE WHEN rating < 5 THEN 1 ELSE 0 END) as harsh_count,
          SUM(CASE WHEN rating >= 5 AND rating <= 7 THEN 1 ELSE 0 END) as balanced_count,
          SUM(CASE WHEN rating > 7 THEN 1 ELSE 0 END) as generous_count,
          COUNT(*) as total_reviews
        FROM reviews
        WHERE user_id = ? AND rating IS NOT NULL
      `, [userId]);

      const totalReviews = ratingStats?.total_reviews || 0;
      const ratingTendency = {
        average: ratingStats?.avg_rating ? parseFloat(ratingStats.avg_rating) : 0,
        min: ratingStats?.min_rating || 0,
        max: ratingStats?.max_rating || 0,
        distribution: {
          harsh: totalReviews > 0 ? Math.round((ratingStats?.harsh_count || 0) / totalReviews * 100) : 0,
          balanced: totalReviews > 0 ? Math.round((ratingStats?.balanced_count || 0) / totalReviews * 100) : 0,
          generous: totalReviews > 0 ? Math.round((ratingStats?.generous_count || 0) / totalReviews * 100) : 0,
        },
      };

      return {
        userId,
        favoriteGenres: genreStats.map((g: any) => ({
          genre: g.genre,
          count: g.count,
          avgRating: parseFloat(g.avg_rating),
        })),
        favoriteAspects,
        dominantEmotions,
        preferredContentTypes: typeStats.map((t: any) => ({
          type: t.type,
          count: t.count,
          avgRating: parseFloat(t.avg_rating),
        })),
        ratingTendency,
        totalReviews,
      };
    } catch (err) {
      this.logger.error(`getUserTasteProfile error: ${(err as any)?.message || err}`);
      return {
        userId,
        favoriteGenres: [],
        favoriteAspects: {},
        dominantEmotions: [],
        preferredContentTypes: [],
        ratingTendency: { average: 0, min: 0, max: 0, distribution: { harsh: 0, balanced: 0, generous: 0 } },
        totalReviews: 0,
      };
    }
  }

  /**
   * Generate personalized recommendations based on taste profile
   */
  async getPersonalizedRecommendations(userId: number, limit: number = 10): Promise<Recommendation[]> {
    try {
      const profile = await this.getUserTasteProfile(userId);

      if (profile.totalReviews === 0) {
        // No reviews yet, return popular content
        const popular = await this.conn.query(`
          SELECT 
            id as contentId,
            title,
            content_type as contentType,
            genre,
            avg_rating as avgRating,
            poster_url as posterUrl,
            release_year as releaseYear
          FROM content
          WHERE avg_rating >= 7
          ORDER BY reviews_count DESC, avg_rating DESC
          LIMIT ?
        `, [limit]);

        return popular.map((c: any) => ({
          ...c,
          matchScore: 0,
          matchReasons: ['Популярный контент с высоким рейтингом'],
        }));
      }

      // Get content user hasn't reviewed yet
      const favoriteGenres = profile.favoriteGenres.map((g) => g.genre);
      const genreFilter = favoriteGenres.length > 0 ? `AND c.genre IN (${favoriteGenres.map(() => '?').join(',')})` : '';

      const candidates = await this.conn.query(`
        SELECT 
          c.id as contentId,
          c.title,
          c.content_type as contentType,
          c.genre,
          c.avg_rating as avgRating,
          c.poster_url as posterUrl,
          c.release_year as releaseYear,
          c.perception_map as perceptionMap,
          c.emotional_cloud as emotionalCloud
        FROM content c
        WHERE c.id NOT IN (SELECT content_id FROM reviews WHERE user_id = ?)
          ${genreFilter}
          AND c.avg_rating >= ${profile.ratingTendency.average - 1}
        ORDER BY c.avg_rating DESC, c.reviews_count DESC
        LIMIT ${limit * 3}
      `, [userId, ...favoriteGenres]);

      // Calculate match scores
      const recommendations: Recommendation[] = candidates.map((content: any) => {
        let matchScore = 0;
        const matchReasons: string[] = [];

        // Genre match (40 points max)
        const genreMatch = profile.favoriteGenres.find((g) => g.genre === content.genre);
        if (genreMatch) {
          const genreScore = Math.min((genreMatch.count / profile.totalReviews) * 40, 40);
          matchScore += genreScore;
          matchReasons.push(`Ваш любимый жанр: ${content.genre}`);
        }

        // Rating alignment (20 points max)
        const avgRating = parseFloat(content.avgRating);
        const ratingDiff = Math.abs(avgRating - profile.ratingTendency.average);
        const ratingScore = Math.max(20 - ratingDiff * 5, 0);
        matchScore += ratingScore;
        if (ratingScore > 10) {
          matchReasons.push(`Рейтинг соответствует вашим предпочтениям (${avgRating.toFixed(1)})`);
        }

        // Aspect match (30 points max)
        if (content.perceptionMap) {
          try {
            const perceptionMap = typeof content.perceptionMap === 'string' ? JSON.parse(content.perceptionMap) : content.perceptionMap;
            if (perceptionMap && typeof perceptionMap === 'object') {
              let aspectScore = 0;
              let matchingAspects = 0;
              Object.entries(profile.favoriteAspects).forEach(([aspect, userPref]) => {
                if (perceptionMap[aspect] && Math.abs(perceptionMap[aspect] - userPref) < 2) {
                  aspectScore += 6;
                  matchingAspects++;
                }
              });
              matchScore += Math.min(aspectScore, 30);
              if (matchingAspects > 0) {
                matchReasons.push(`Совпадение по ${matchingAspects} аспектам`);
              }
            }
          } catch (e) {
            // Skip invalid perception map
          }
        }

        // Emotion match (10 points max)
        if (content.emotionalCloud && profile.dominantEmotions.length > 0) {
          try {
            const emotionalCloud = typeof content.emotionalCloud === 'string' ? JSON.parse(content.emotionalCloud) : content.emotionalCloud;
            if (emotionalCloud && typeof emotionalCloud === 'object') {
              const topEmotion = profile.dominantEmotions[0].emotion;
              if (emotionalCloud[topEmotion] && emotionalCloud[topEmotion] > 30) {
                matchScore += 10;
                matchReasons.push(`Вызывает эмоцию: ${topEmotion}`);
              }
            }
          } catch (e) {
            // Skip invalid emotional cloud
          }
        }

        return {
          contentId: content.contentId,
          title: content.title,
          contentType: content.contentType,
          genre: content.genre,
          avgRating: parseFloat(content.avgRating),
          posterUrl: content.posterUrl,
          releaseYear: content.releaseYear,
          matchScore: Math.round(matchScore),
          matchReasons,
        };
      });

      // Sort by match score and return top N
      return recommendations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (err) {
      this.logger.error(`getPersonalizedRecommendations error: ${(err as any)?.message || err}`);
      return [];
    }
  }
}
