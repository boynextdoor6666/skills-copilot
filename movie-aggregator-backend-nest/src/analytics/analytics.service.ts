import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(@InjectConnection() private connection: Connection) {}

  async getWorldRatings(contentId?: number) {
    // Aggregate avg rating by user country
    // If contentId is provided, filter by that content
    // Else, global average by country
    let sql = `
      SELECT 
        u.country,
        COUNT(r.id) as review_count,
        AVG(r.rating) as avg_rating
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE u.country IS NOT NULL AND r.rating IS NOT NULL
    `;
    const params: any[] = [];
    if (contentId) {
      sql += ` AND r.content_id = ?`;
      params.push(contentId);
    }
    sql += ` GROUP BY u.country ORDER BY avg_rating DESC`;
    
    return this.connection.query(sql, params);
  }

  async getAntiRating(limit: number = 10) {
    // Content with lowest average rating (min 1 review to be fair)
    return this.connection.query(`
      SELECT 
        c.id, c.title, c.poster_url, c.content_type,
        c.avg_rating, c.reviews_count
      FROM content c
      WHERE c.reviews_count >= 1
      ORDER BY c.avg_rating ASC
      LIMIT ?
    `, [limit]);
  }

  async getHypeTop(limit: number = 10) {
    // Content with highest hype_index
    return this.connection.query(`
      SELECT 
        c.id, c.title, c.poster_url, c.content_type,
        c.hype_index, c.reviews_count
      FROM content c
      ORDER BY c.hype_index DESC
      LIMIT ?
    `, [limit]);
  }
}
