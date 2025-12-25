import { Injectable, InternalServerErrorException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class CriticsService implements OnModuleInit {
  private readonly logger = new Logger(CriticsService.name);
  constructor(@InjectConnection() private readonly conn: Connection) {}

  async onModuleInit() {
    // Best-effort: ensure required tables/columns exist to avoid 1146/1054 runtime errors
    await this.ensureCriticsSchema();
    await this.ensurePublicationsSchema();
  }

  private async ensurePublicationsSchema() {
    try {
      // publications table
      await this.conn.query(`
        CREATE TABLE IF NOT EXISTS publications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          logo_url VARCHAR(500) NULL,
          website VARCHAR(255) NULL,
          description TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Add publication_id to users if missing
      const pubCol = await this.conn.query('SHOW COLUMNS FROM users LIKE "publication_id"');
      if (!Array.isArray(pubCol) || pubCol.length === 0) {
        try { 
          await this.conn.query('ALTER TABLE users ADD COLUMN publication_id INT NULL'); 
          await this.conn.query('ALTER TABLE users ADD CONSTRAINT fk_user_publication FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE SET NULL');
        } catch {}
      }
    } catch {
      // swallow
    }
  }

  private async ensureCriticsSchema() {
    try {
      // user_critic_preferences table for follow relationships
      // Note: user_id and critic_id must match users.id type (BIGINT)
      await this.conn.query(`
        CREATE TABLE IF NOT EXISTS user_critic_preferences (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          critic_id BIGINT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_critic (user_id, critic_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Ensure columns are BIGINT (fix for existing tables created with INT)
      try {
        await this.conn.query(`ALTER TABLE user_critic_preferences MODIFY COLUMN user_id BIGINT NOT NULL`);
        await this.conn.query(`ALTER TABLE user_critic_preferences MODIFY COLUMN critic_id BIGINT NOT NULL`);
      } catch (e) {
        // ignore error if table doesn't exist or other issue
      }

      // Add FKs if possible (ignore if fail due to missing users table or existing constraints)
      try {
        const [fkUser] = await this.conn.query(`SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_critic_preferences' AND CONSTRAINT_NAME = 'fk_ucp_user'`);
        if (!fkUser) {
          // Clean up orphans first
          await this.conn.query(`DELETE FROM user_critic_preferences WHERE user_id NOT IN (SELECT id FROM users)`);
          await this.conn.query(`ALTER TABLE user_critic_preferences ADD CONSTRAINT fk_ucp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
        }
      } catch {}
      
      try {
        const [fkCritic] = await this.conn.query(`SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_critic_preferences' AND CONSTRAINT_NAME = 'fk_ucp_critic'`);
        if (!fkCritic) {
          // Clean up orphans first
          await this.conn.query(`DELETE FROM user_critic_preferences WHERE critic_id NOT IN (SELECT id FROM users)`);
          await this.conn.query(`ALTER TABLE user_critic_preferences ADD CONSTRAINT fk_ucp_critic FOREIGN KEY (critic_id) REFERENCES users(id) ON DELETE CASCADE`);
        }
      } catch {}

      // Ensure users.registration_date column exists (used in listing)
      const regCol = await this.conn.query('SHOW COLUMNS FROM users LIKE "registration_date"');
      if (!Array.isArray(regCol) || regCol.length === 0) {
        try { await this.conn.query('ALTER TABLE users ADD COLUMN registration_date DATETIME NULL'); } catch {}
      }

      // Ensure reviews.rating exists (used for AVG)
      const ratingCol = await this.conn.query('SHOW COLUMNS FROM reviews LIKE "rating"');
      if (!Array.isArray(ratingCol) || ratingCol.length === 0) {
        try { await this.conn.query('ALTER TABLE reviews ADD COLUMN rating DECIMAL(3,1) NULL'); } catch {}
      }
    } catch (err) {
      this.logger.warn(`ensureCriticsSchema failed (non-fatal): ${(err as any)?.message}`);
    }
  }

  /**
   * Get all users with role 'CRITIC'
   */
  async getAllCritics(): Promise<any[]> {
    try {
      const critics = await this.conn.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          u.registration_date,
          COUNT(DISTINCT r.id) as review_count,
          COALESCE(AVG(r.rating), 0) as avg_rating_given
        FROM users u
        LEFT JOIN reviews r ON r.user_id = u.id
        WHERE u.role = 'CRITIC'
        GROUP BY u.id, u.username, u.email, u.role, u.registration_date
        ORDER BY review_count DESC, u.username ASC
      `);
      
      // Ensure numeric values are properly formatted
      return critics.map(critic => ({
        ...critic,
        review_count: Number(critic.review_count) || 0,
        avg_rating_given: Number(critic.avg_rating_given) || 0
      }));
    } catch (err) {
      this.logger.error(`getAllCritics error: ${(err as any)?.message || err}`);
      // Try to self-heal schema and retry once
      const errno = (err as any)?.errno || (err as any)?.code;
      if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1054 || errno === 'ER_BAD_FIELD_ERROR') {
        await this.ensureCriticsSchema();
        try {
          const critics = await this.conn.query(`
            SELECT 
              u.id,
              u.username,
              u.email,
              u.role,
              u.registration_date,
              COUNT(DISTINCT r.id) as review_count,
              COALESCE(AVG(r.rating), 0) as avg_rating_given
            FROM users u
            LEFT JOIN reviews r ON r.user_id = u.id
            WHERE u.role = 'CRITIC'
            GROUP BY u.id, u.username, u.email, u.role, u.registration_date
            ORDER BY review_count DESC, u.username ASC
          `);
          return critics.map((c: any) => ({
            ...c,
            review_count: Number(c.review_count) || 0,
            avg_rating_given: Number(c.avg_rating_given) || 0
          }));
        } catch (e2) {
          this.logger.error(`retry getAllCritics failed: ${(e2 as any)?.message || e2}`);
        }
      }
      throw new InternalServerErrorException('Failed to fetch critics');
    }
  }

  /**
   * Get critics followed by a specific user
   */
  async getFollowedCritics(userId: number): Promise<any[]> {
    try {
      const followed = await this.conn.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          ucp.created_at as followed_at,
          COUNT(DISTINCT r.id) as review_count,
          COALESCE(AVG(r.rating), 0) as avg_rating_given
        FROM user_critic_preferences ucp
        JOIN users u ON u.id = ucp.critic_id
        LEFT JOIN reviews r ON r.user_id = u.id
        WHERE ucp.user_id = ? AND u.role = 'CRITIC'
        GROUP BY u.id, u.username, u.email, u.role, ucp.created_at
        ORDER BY ucp.created_at DESC
      `, [userId]);
      return followed.map((row: any) => ({
        ...row,
        review_count: Number(row.review_count) || 0,
        avg_rating_given: Number(row.avg_rating_given) || 0,
      }));
    } catch (err) {
      this.logger.error(`getFollowedCritics error: ${(err as any)?.message || err}`);
      const errno = (err as any)?.errno || (err as any)?.code;
      if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1054 || errno === 'ER_BAD_FIELD_ERROR') {
        await this.ensureCriticsSchema();
        try {
          const followed = await this.conn.query(`
            SELECT 
              u.id,
              u.username,
              u.email,
              u.role,
              ucp.created_at as followed_at,
              COUNT(DISTINCT r.id) as review_count,
              COALESCE(AVG(r.rating), 0) as avg_rating_given
            FROM user_critic_preferences ucp
            JOIN users u ON u.id = ucp.critic_id
            LEFT JOIN reviews r ON r.user_id = u.id
            WHERE ucp.user_id = ? AND u.role = 'CRITIC'
            GROUP BY u.id, u.username, u.email, u.role, ucp.created_at
            ORDER BY ucp.created_at DESC
          `, [userId]);
          return followed.map((row: any) => ({
            ...row,
            review_count: Number(row.review_count) || 0,
            avg_rating_given: Number(row.avg_rating_given) || 0,
          }));
        } catch (e2) {
          this.logger.error(`retry getFollowedCritics failed: ${(e2 as any)?.message || e2}`);
        }
      }
      throw new InternalServerErrorException('Failed to fetch followed critics');
    }
  }

  /**
   * Follow a critic
   */
  async followCritic(userId: number, criticId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Check if critic exists and has CRITIC role
      const [critic] = await this.conn.query(`
        SELECT id, role FROM users WHERE id = ? AND role = 'CRITIC'
      `, [criticId]);

      if (!critic) {
        throw new NotFoundException('Critic not found');
      }

      // Insert or ignore (IGNORE handles duplicate follows)
      await this.conn.query(`
        INSERT IGNORE INTO user_critic_preferences (user_id, critic_id, created_at)
        VALUES (?, ?, NOW())
      `, [userId, criticId]);

      return { success: true, message: 'Critic followed successfully' };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`followCritic error: ${(err as any)?.message || err}`);
      const errno = (err as any)?.errno || (err as any)?.code;
      if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1452 || errno === 'ER_NO_REFERENCED_ROW_2') {
        await this.ensureCriticsSchema();
        try {
          await this.conn.query(`
            INSERT IGNORE INTO user_critic_preferences (user_id, critic_id, created_at)
            VALUES (?, ?, NOW())
          `, [userId, criticId]);
          return { success: true, message: 'Critic followed successfully' };
        } catch (e2) {
          this.logger.error(`retry followCritic failed: ${(e2 as any)?.message || e2}`);
        }
      }
      throw new InternalServerErrorException('Failed to follow critic');
    }
  }

  /**
   * Unfollow a critic
   */
  async unfollowCritic(userId: number, criticId: number): Promise<{ success: boolean; message: string }> {
    try {
      await this.conn.query(`
        DELETE FROM user_critic_preferences
        WHERE user_id = ? AND critic_id = ?
      `, [userId, criticId]);

      return { success: true, message: 'Critic unfollowed successfully' };
    } catch (err) {
      this.logger.error(`unfollowCritic error: ${(err as any)?.message || err}`);
      throw new InternalServerErrorException('Failed to unfollow critic');
    }
  }

  /**
   * Get personalized rating for content based on user's followed critics
   * Returns weighted average of ratings from followed critics
   */
  async getPersonalizedRating(userId: number, contentId: number): Promise<{ personalRating: number | null; reviewCount: number }> {
    try {
      const [result] = await this.conn.query(`
        SELECT 
          AVG(r.rating) as personal_rating,
          COUNT(r.id) as review_count
        FROM reviews r
        JOIN user_critic_preferences ucp ON ucp.critic_id = r.user_id
        WHERE ucp.user_id = ? AND r.content_id = ? AND r.rating IS NOT NULL
      `, [userId, contentId]);

      return {
        personalRating: result?.personal_rating ? parseFloat(result.personal_rating) : null,
        reviewCount: result?.review_count || 0
      };
    } catch (err) {
      this.logger.error(`getPersonalizedRating error: ${(err as any)?.message || err}`);
      const errno = (err as any)?.errno || (err as any)?.code;
      if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1054 || errno === 'ER_BAD_FIELD_ERROR') {
        await this.ensureCriticsSchema();
        try {
          const [result] = await this.conn.query(`
            SELECT 
              AVG(r.rating) as personal_rating,
              COUNT(r.id) as review_count
            FROM reviews r
            JOIN user_critic_preferences ucp ON ucp.critic_id = r.user_id
            WHERE ucp.user_id = ? AND r.content_id = ? AND r.rating IS NOT NULL
          `, [userId, contentId]);
  
          return {
            personalRating: result?.personal_rating ? parseFloat(result.personal_rating) : null,
            reviewCount: result?.review_count || 0
          };
        } catch (e2) {
          this.logger.error(`retry getPersonalizedRating failed: ${(e2 as any)?.message || e2}`);
        }
      }
      throw new InternalServerErrorException('Failed to calculate personalized rating');
    }
  }

  /**
   * Get personalized ratings for multiple content items (for listing pages)
   */
  async getPersonalizedRatings(userId: number, contentIds: number[]): Promise<Record<number, { personalRating: number | null; reviewCount: number }>> {
    if (!contentIds.length) return {};

    try {
      const placeholders = contentIds.map(() => '?').join(',');
      const results = await this.conn.query(`
        SELECT 
          r.content_id,
          AVG(r.rating) as personal_rating,
          COUNT(r.id) as review_count
        FROM reviews r
        JOIN user_critic_preferences ucp ON ucp.critic_id = r.user_id
        WHERE ucp.user_id = ? AND r.content_id IN (${placeholders}) AND r.rating IS NOT NULL
        GROUP BY r.content_id
      `, [userId, ...contentIds]);

      const ratingsMap: Record<number, { personalRating: number | null; reviewCount: number }> = {};
      results.forEach((row: any) => {
        ratingsMap[row.content_id] = {
          personalRating: row.personal_rating ? parseFloat(row.personal_rating) : null,
          reviewCount: row.review_count || 0
        };
      });

      return ratingsMap;
    } catch (err) {
      this.logger.error(`getPersonalizedRatings error: ${(err as any)?.message || err}`);
      const errno = (err as any)?.errno || (err as any)?.code;
      if (errno === 1146 || errno === 'ER_NO_SUCH_TABLE' || errno === 1054 || errno === 'ER_BAD_FIELD_ERROR') {
        await this.ensureCriticsSchema();
        try {
          const placeholders = contentIds.map(() => '?').join(',');
          const results = await this.conn.query(`
            SELECT 
              r.content_id,
              AVG(r.rating) as personal_rating,
              COUNT(r.id) as review_count
            FROM reviews r
            JOIN user_critic_preferences ucp ON ucp.critic_id = r.user_id
            WHERE ucp.user_id = ? AND r.content_id IN (${placeholders}) AND r.rating IS NOT NULL
            GROUP BY r.content_id
          `, [userId, ...contentIds]);
  
          const ratingsMap: Record<number, { personalRating: number | null; reviewCount: number }> = {};
          results.forEach((row: any) => {
            ratingsMap[row.content_id] = {
              personalRating: row.personal_rating ? parseFloat(row.personal_rating) : null,
              reviewCount: row.review_count || 0
            };
          });
          return ratingsMap;
        } catch (e2) {
          this.logger.error(`retry getPersonalizedRatings failed: ${(e2 as any)?.message || e2}`);
        }
      }
      throw new InternalServerErrorException('Failed to calculate personalized ratings');
    }
  }

  // Admin methods for Publications
  async getAllPublications() {
    return this.conn.query('SELECT * FROM publications ORDER BY name ASC');
  }

  async createPublication(data: any) {
    const res = await this.conn.query(
      'INSERT INTO publications (name, logo_url, website, description) VALUES (?, ?, ?, ?)',
      [data.name, data.logo_url, data.website, data.description]
    );
    return { id: res.insertId, ...data };
  }

  async updatePublication(id: number, data: any) {
    await this.conn.query(
      'UPDATE publications SET name = ?, logo_url = ?, website = ?, description = ? WHERE id = ?',
      [data.name, data.logo_url, data.website, data.description, id]
    );
    return { id, ...data };
  }

  async deletePublication(id: number) {
    await this.conn.query('DELETE FROM publications WHERE id = ?', [id]);
    return { message: 'Publication deleted' };
  }
}
