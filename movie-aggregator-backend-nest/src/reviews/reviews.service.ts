import { Injectable, OnModuleInit, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository, InjectConnection } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto, PublishProReviewDto } from './dto/review.dto';
import { GamificationService } from '../gamification/gamification.service';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class ReviewsService implements OnModuleInit {
  private readonly logger = new Logger(ReviewsService.name);
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectConnection()
    private connection: Connection,
    private readonly gamificationService: GamificationService,
    private readonly kafkaService: KafkaService,
  ) {}

  async onModuleInit() {
    await this.ensureReviewsTable();
    await this.ensureReviewVotesTable();
    await this.ensureReviewVotesColumns();
  }

  private async ensureReviewVotesColumns() {
    try {
      const check = await this.connection.query("SHOW COLUMNS FROM review_votes LIKE 'vote_type'");
      if (!Array.isArray(check) || check.length === 0) {
        // Try to find 'type' column which might be the old name
        const checkType = await this.connection.query("SHOW COLUMNS FROM review_votes LIKE 'type'");
        if (Array.isArray(checkType) && checkType.length > 0) {
          await this.connection.query("ALTER TABLE review_votes CHANGE COLUMN `type` `vote_type` ENUM('LIKE', 'DISLIKE') NOT NULL");
        } else {
          await this.connection.query("ALTER TABLE review_votes ADD COLUMN `vote_type` ENUM('LIKE', 'DISLIKE') NOT NULL");
        }
      }
    } catch (e) {
      this.logger.warn(`ensureReviewVotesColumns failed: ${(e as any).message}`);
    }
  }

  private async ensureReviewVotesTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS review_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        review_id INT NOT NULL,
        vote_type ENUM('LIKE', 'DISLIKE') NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_review (user_id, review_id),
        INDEX idx_votes_review (review_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    try {
      await this.connection.query(sql);
    } catch (_) {}
  }

  async voteReview(userId: number, reviewId: number, voteType: 'LIKE' | 'DISLIKE') {
    // Check if vote exists
    const existing = await this.connection.query(
      'SELECT id, vote_type FROM review_votes WHERE user_id = ? AND review_id = ?',
      [userId, reviewId]
    );

    if (existing && Array.isArray(existing) && existing.length > 0) {
      if (existing[0].vote_type === voteType) {
        // Remove vote if same type (toggle)
        await this.connection.query('DELETE FROM review_votes WHERE id = ?', [existing[0].id]);
        return { status: 'removed' };
      } else {
        // Change vote type
        await this.connection.query('UPDATE review_votes SET vote_type = ? WHERE id = ?', [voteType, existing[0].id]);
        return { status: 'updated', vote: voteType };
      }
    } else {
      // Insert new vote
      await this.connection.query(
        'INSERT INTO review_votes (user_id, review_id, vote_type) VALUES (?, ?, ?)',
        [userId, reviewId, voteType]
      );
      return { status: 'added', vote: voteType };
    }
  }

  async getReviewVotes(reviewId: number) {
    const rows = await this.connection.query(
      `SELECT 
        SUM(CASE WHEN vote_type = 'LIKE' THEN 1 ELSE 0 END) as likes,
        SUM(CASE WHEN vote_type = 'DISLIKE' THEN 1 ELSE 0 END) as dislikes
       FROM review_votes WHERE review_id = ?`,
      [reviewId]
    );
    return rows[0] || { likes: 0, dislikes: 0 };
  }

  // Recalculate aggregated ratings in the unified `content` table after review changes
  private async recalcContentAggregates(contentId: number) {
    if (!contentId) return;
    try {
      await this.connection.query(
        `
        UPDATE content c
        LEFT JOIN (
          SELECT 
            r.content_id,
            ROUND(AVG(r.rating), 2) as avg_rating,
            ROUND(AVG(CASE WHEN u.role = 'CRITIC' THEN r.rating END), 2) as critics_rating,
            ROUND(AVG(CASE WHEN u.role = 'USER' THEN r.rating END), 2) as audience_rating,
            COUNT(*) as reviews_count
          FROM reviews r
          LEFT JOIN users u ON u.id = r.user_id
          WHERE r.content_id = ? AND r.rating IS NOT NULL
        ) x ON x.content_id = c.id
        SET 
          c.avg_rating = COALESCE(x.avg_rating, 0),
          c.critics_rating = COALESCE(x.critics_rating, 0),
          c.audience_rating = COALESCE(x.audience_rating, 0),
          c.reviews_count = COALESCE(x.reviews_count, 0),
          c.updated_at = CURRENT_TIMESTAMP
        WHERE c.id = ?
        `,
        [contentId, contentId],
      );
    } catch (e) {
      this.logger.error(`recalcContentAggregates error: ${(e as any)?.message || e}`);
    }
  }

  // Ensure 'reviews' table exists with minimal required columns
  private async ensureReviewsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NULL,
        movie_id INT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        aspects JSON NULL,
        emotions JSON NULL,
        rating DECIMAL(3,1) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reviews_content (content_id),
        INDEX idx_reviews_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    try {
      await this.connection.query(sql);
    } catch (_) {
      // ignore to avoid crashing
    }
  }

  // Ensure important columns exist (idempotent) and align types
  private async ensureReviewsColumns() {
    const addIfMissing = async (col: string, ddl: string) => {
      const check = await this.connection.query('SHOW COLUMNS FROM reviews LIKE ?', [col]);
      if (!Array.isArray(check) || check.length === 0) {
        await this.connection.query(`ALTER TABLE reviews ADD COLUMN ${ddl}`);
      }
    };
    try {
      await addIfMissing('content_id', 'content_id INT NULL');
      await addIfMissing('movie_id', 'movie_id INT NULL');
      await addIfMissing('user_id', 'user_id INT NOT NULL');
      await addIfMissing('content', 'content TEXT NOT NULL');
      await addIfMissing('aspects', 'aspects JSON NULL');
      await addIfMissing('emotions', 'emotions JSON NULL');
      await addIfMissing('rating', 'rating DECIMAL(3,1) NULL');
      await addIfMissing('created_at', 'created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    } catch (_) {
      // ignore DDL failures
    }
  }

  // Return the set of existing columns for 'reviews' table (ensuring table first)
  private async getReviewColumnsMeta(): Promise<Record<string, { nullable: boolean; type?: string; default?: any }>> {
    const meta: Record<string, { nullable: boolean; type?: string; default?: any }> = {};
    try {
      const rows: Array<{ Field: string; Null: string; Type: string; Default: any }> = await this.connection.query('SHOW COLUMNS FROM reviews');
      if (Array.isArray(rows)) {
        rows.forEach((r: any) => {
          meta[r.Field] = { nullable: String(r.Null).toUpperCase() !== 'NO' ? true : false, type: r.Type, default: r.Default };
        });
      }
    } catch (err) {
      const code = (err as any)?.code; const errno = (err as any)?.errno;
      if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
        await this.ensureReviewsTable();
        const rows2: Array<{ Field: string; Null: string; Type: string; Default: any }> = await this.connection.query('SHOW COLUMNS FROM reviews');
        if (Array.isArray(rows2)) {
          rows2.forEach((r: any) => {
            meta[r.Field] = { nullable: String(r.Null).toUpperCase() !== 'NO' ? true : false, type: r.Type, default: r.Default };
          });
        }
      }
    }
    return meta;
  }

  // Relax unexpected NOT NULL columns by making them NULL DEFAULT NULL (except critical ones we always provide)
  private async relaxReviewsNotNullColumns() {
    try {
      const meta = await this.getReviewColumnsMeta();
      const skip = new Set(['id', 'user_id', 'content', 'content_id', 'movie_id']);
      const alters: string[] = [];
      for (const [field, info] of Object.entries(meta)) {
        if (skip.has(field)) continue;
        const isNotNull = info.nullable === false;
        const hasDefault = typeof info.default !== 'undefined' && info.default !== null;
        if (isNotNull && !hasDefault && info.type) {
          alters.push(`MODIFY COLUMN \`${field}\` ${info.type} NULL DEFAULT NULL`);
        }
      }
      if (alters.length > 0) {
        const sql = `ALTER TABLE reviews ${alters.join(', ')}`;
        await this.connection.query(sql);
      }
    } catch (_) {
      // swallow DDL errors
    }
  }

  private async ensureMoviesColumns() {
    const addIfMissing = async (col: string, ddl: string) => {
      const check = await this.connection.query('SHOW COLUMNS FROM movies LIKE ?', [col]);
      if (!Array.isArray(check) || check.length === 0) {
        await this.connection.query(`ALTER TABLE movies ADD COLUMN ${ddl}`);
      }
    };
    try {
      await addIfMissing('reviews_count', 'reviews_count INT DEFAULT 0');
      await addIfMissing('overall_rating', 'overall_rating DECIMAL(5,2) DEFAULT 0');
      await addIfMissing('audience_rating', 'audience_rating DECIMAL(5,2) DEFAULT 0');
      await addIfMissing('critics_rating', 'critics_rating DECIMAL(5,2) DEFAULT 0');
      await addIfMissing('hype_index', 'hype_index INT DEFAULT 0');
      await addIfMissing('emotional_cloud', 'emotional_cloud JSON NULL');
      await addIfMissing('perception_map', 'perception_map JSON NULL');
    } catch (_) {}
  }

  // Build a safe INSERT statement including only existing columns
  private buildInsertForReviews(
    columns: Record<string, { nullable: boolean }>,
    data: {
      content_id?: number | null;
      movie_id?: number | null;
      user_id?: number;
      content?: string;
      aspects?: any;
      emotions?: any;
      rating?: number | null;
    },
  ): { sql: string; values: any[] } {
    const fields: string[] = [];
    const values: any[] = [];

    const hasContentId = Object.prototype.hasOwnProperty.call(columns, 'content_id');
    const hasMovieId = Object.prototype.hasOwnProperty.call(columns, 'movie_id');
    const movieNotNull = hasMovieId && columns['movie_id']?.nullable === false;

    // Always set at least one foreign key column; prefer content_id
    if (hasContentId) {
      fields.push('`content_id`'); values.push(typeof data.content_id !== 'undefined' ? data.content_id : null);
    } else if (hasMovieId) {
      fields.push('`movie_id`'); values.push(typeof data.movie_id !== 'undefined' ? data.movie_id : (typeof data.content_id !== 'undefined' ? data.content_id : null));
    }

    // If movie_id exists and is NOT NULL, also provide it (mirror content_id when needed)
    if (hasMovieId) {
      // avoid duplicate if we already added movie_id above
      const alreadyHasMovie = fields.includes('`movie_id`');
      if (!alreadyHasMovie) {
        // Include movie_id if it's required or explicitly provided
        if (movieNotNull || typeof data.movie_id !== 'undefined') {
          fields.push('`movie_id`');
          const mv = typeof data.movie_id !== 'undefined' ? data.movie_id : (typeof data.content_id !== 'undefined' ? data.content_id : null);
          values.push(mv);
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(columns, 'user_id') && typeof data.user_id !== 'undefined') {
      fields.push('`user_id`'); values.push(data.user_id);
    }
    if (Object.prototype.hasOwnProperty.call(columns, 'content') && typeof data.content !== 'undefined') {
      fields.push('`content`'); values.push(data.content);
    }
    if (Object.prototype.hasOwnProperty.call(columns, 'aspects') && typeof data.aspects !== 'undefined') {
      fields.push('`aspects`'); values.push(data.aspects);
    }
    if (Object.prototype.hasOwnProperty.call(columns, 'emotions') && typeof data.emotions !== 'undefined') {
      fields.push('`emotions`'); values.push(data.emotions);
    }
    if (Object.prototype.hasOwnProperty.call(columns, 'rating') && typeof data.rating !== 'undefined') {
      fields.push('`rating`'); values.push(data.rating);
    }

    const placeholders = fields.map(() => '?').join(', ');
    const fieldList = fields.join(', ');
    const sql = `INSERT INTO reviews (${fieldList}) VALUES (${placeholders})`;
    return { sql, values };
  }

  // Helper to check and award achievements
  private async checkReviewAchievements(userId: number, reviewData?: { content?: string, rating?: number }) {
    try {
      // We need to count all reviews by this user. 
      // Since we might have just inserted one via raw SQL or procedure, 
      // we should ensure we count the new one too.
      const count = await this.reviewRepository.count({ where: { user_id: userId } });
      const results = await this.gamificationService.checkAndAward(userId, 'review_count', count);

      if (reviewData) {
        if (reviewData.content) {
           const lengthResults = await this.gamificationService.checkAndAward(userId, 'review_length', reviewData.content.length);
           results.push(...lengthResults);
        }
        if (reviewData.rating !== undefined && reviewData.rating !== null) {
           const ratingResults = await this.gamificationService.checkAndAward(userId, 'rating_value', Number(reviewData.rating));
           results.push(...ratingResults);
        }
      }

      return results;
    } catch (e) {
      this.logger.error(`Failed to check achievements for user ${userId}: ${(e as any).message}`);
      return [];
    }
  }

  // Добавить отзыв зрителя (вызов процедуры add_review_viewer)
  async addViewerReview(userId: number, createDto: CreateReviewDto) {
    const { content_id, content, aspects, emotions, rating } = createDto;
    try {
      this.logger.log(`CALL add_review_viewer user=${userId} content=${content_id}`);
      const result = await this.connection.query(
        'CALL add_review_viewer(?, ?, ?, ?, ?, ?)',
        [
          userId,
          content_id,
          aspects ? JSON.stringify(aspects) : null,
          emotions ? JSON.stringify(emotions) : null,
          rating ?? null,
          content,
        ],
      );
      this.logger.log(`add_review_viewer OK content=${content_id} review_id=${result?.[0]?.[0]?.review_id ?? '-'} `);
      // Even if DB procedure updates legacy `movies`, ensure our unified `content` table stays in sync
      await this.recalcContentAggregates(content_id);
      
      // Check achievements
      const newAchievements = await this.checkReviewAchievements(userId, { content, rating: rating ?? undefined });

      // Award base XP for activity (e.g. 5 XP for review)
      await this.gamificationService.awardXp(userId, 5);

      // Emit Kafka event for analytics
      await this.kafkaService.emitReviewCreated(
        userId,
        content_id,
        'UNKNOWN', // content type would need to be fetched
        rating ?? 0,
        emotions,
        aspects,
      );

      return { ...result[0][0], newAchievements }; // { review_id, status, newAchievements }
    } catch (e) {
      this.logger.warn(`add_review_viewer failed, using fallback insert. code=${(e as any)?.code} errno=${(e as any)?.errno} msg=${(e as any)?.sqlMessage || (e as any)?.message}`);
      // Fallback: dynamic raw insert that only uses existing columns
      // Ensure base columns exist, then detect columns and insert
  await this.ensureReviewsTable();
  await this.ensureReviewsColumns();
  // Proactively ensure reviews_count exists to satisfy legacy triggers (content/movies)
  try { await this.connection.query('ALTER TABLE content ADD COLUMN reviews_count INT DEFAULT 0'); } catch (_) {}
  try { await this.connection.query('ALTER TABLE movies ADD COLUMN reviews_count INT DEFAULT 0'); } catch (_) {}
  await this.ensureMoviesColumns();
  await this.relaxReviewsNotNullColumns();
  const colMeta = await this.getReviewColumnsMeta();
      const { sql, values } = this.buildInsertForReviews(colMeta, {
        content_id,
        movie_id: content_id,
        user_id: userId,
        content,
        aspects: aspects ? JSON.stringify(aspects) : undefined,
        emotions: emotions ? JSON.stringify(emotions) : undefined,
        rating: typeof rating === 'number' ? rating : (rating == null ? null : Number(rating)),
      });
      try {
        const res = await this.connection.query(sql, values);
        this.logger.log(`fallback insert OK content=${content_id} review_id=${(res as any).insertId}`);
        await this.recalcContentAggregates(content_id);
        
        // Check achievements
        const newAchievements = await this.checkReviewAchievements(userId, { content, rating: rating ?? undefined });

        // Award base XP for activity
        await this.gamificationService.awardXp(userId, 5);

        return { review_id: (res as any).insertId, status: 'inserted', newAchievements } as any;
      } catch (err) {
        // If trigger references content.reviews_count and it's missing, add it and retry once
        const code = (err as any)?.code; const errno = (err as any)?.errno; const msg = (err as any)?.sqlMessage || (err as any)?.message || '';
        if (code === 'ER_BAD_FIELD_ERROR' || errno === 1054) {
          try {
            if (/reviews_count/.test(String(msg))) {
              await this.connection.query('ALTER TABLE content ADD COLUMN reviews_count INT DEFAULT 0');
              await this.connection.query('ALTER TABLE movies ADD COLUMN reviews_count INT DEFAULT 0');
            }
            if (/overall_rating|audience_rating|critics_rating|hype_index|emotional_cloud|perception_map/.test(String(msg))) {
              await this.ensureMoviesColumns();
            }
            const resRetry = await this.connection.query(sql, values);
            this.logger.log(`fallback retry insert OK content=${content_id} review_id=${(resRetry as any).insertId}`);
            await this.recalcContentAggregates(content_id);
            
            // Check achievements
            const newAchievements = await this.checkReviewAchievements(userId, { content, rating: rating ?? undefined });

            return { review_id: (resRetry as any).insertId, status: 'inserted', newAchievements } as any;
          } catch (_) {
            // fall through to log
          }
        }
        // Log diagnostic context (without raw SQL text in message)
        this.logger.error(`addViewerReview insert failed code=${(err as any)?.code} errno=${(err as any)?.errno} msg=${(err as any)?.sqlMessage || (err as any)?.message}`);
        throw new InternalServerErrorException((err as any)?.sqlMessage || (err as any)?.message || 'Insert failed');
      }
    }
  }

  // Опубликовать профессиональный отзыв критика (publish_pro_review)
  async publishProReview(userId: number, publishDto: PublishProReviewDto) {
    const { content_id, review_text, aspects, emotions, rating } = publishDto;
    try {
      this.logger.log(`CALL publish_pro_review critic=${userId} content=${content_id}`);
      const result = await this.connection.query(
        'CALL publish_pro_review(?, ?, ?, ?, ?, ?)',
        [
          content_id,
          userId,
          review_text,
          JSON.stringify(aspects ?? {}),
          JSON.stringify(emotions ?? {}),
          rating ?? null,
        ],
      );
      this.logger.log(`publish_pro_review OK content=${content_id} review_id=${result?.[0]?.[0]?.review_id ?? '-'}`);
      await this.recalcContentAggregates(content_id);
      
      // Check achievements
      const newAchievements = await this.checkReviewAchievements(userId, { content: review_text, rating: rating ?? undefined });

      // Award base XP for pro review (more than regular)
      await this.gamificationService.awardXp(userId, 15);

      return { ...result[0][0], newAchievements }; // { review_id, status, newAchievements }
    } catch (e) {
      this.logger.warn(`publish_pro_review failed, using fallback insert. code=${(e as any)?.code} errno=${(e as any)?.errno} msg=${(e as any)?.sqlMessage || (e as any)?.message}`);
      // Fallback: dynamic raw insert
  await this.ensureReviewsTable();
  await this.ensureReviewsColumns();
  try { await this.connection.query('ALTER TABLE content ADD COLUMN reviews_count INT DEFAULT 0'); } catch (_) {}
  try { await this.connection.query('ALTER TABLE movies ADD COLUMN reviews_count INT DEFAULT 0'); } catch (_) {}
  await this.ensureMoviesColumns();
  await this.relaxReviewsNotNullColumns();
  const colMeta = await this.getReviewColumnsMeta();
      const { sql, values } = this.buildInsertForReviews(colMeta, {
        content_id,
        movie_id: content_id,
        user_id: userId,
        content: review_text,
        aspects: aspects ? JSON.stringify(aspects) : undefined,
        emotions: emotions ? JSON.stringify(emotions) : undefined,
        rating: typeof rating === 'number' ? rating : (rating == null ? null : Number(rating)),
      });
      try {
        const res = await this.connection.query(sql, values);
        this.logger.log(`fallback insert (pro) OK content=${content_id} review_id=${(res as any).insertId}`);
        await this.recalcContentAggregates(content_id);
        
        // Check achievements
        const newAchievements = await this.checkReviewAchievements(userId, { content: review_text, rating: rating ?? undefined });

        // Award base XP for pro review
        await this.gamificationService.awardXp(userId, 15);

        return { review_id: (res as any).insertId, status: 'inserted', newAchievements } as any;
      } catch (err) {
        const code = (err as any)?.code; const errno = (err as any)?.errno; const msg = (err as any)?.sqlMessage || (err as any)?.message || '';
        if (code === 'ER_BAD_FIELD_ERROR' || errno === 1054) {
          try {
            if (/reviews_count/.test(String(msg))) {
              await this.connection.query('ALTER TABLE content ADD COLUMN reviews_count INT DEFAULT 0');
              await this.connection.query('ALTER TABLE movies ADD COLUMN reviews_count INT DEFAULT 0');
            }
            if (/overall_rating|audience_rating|critics_rating|hype_index|emotional_cloud|perception_map/.test(String(msg))) {
              await this.ensureMoviesColumns();
            }
            const resRetry = await this.connection.query(sql, values);
            this.logger.log(`fallback retry insert (pro) OK content=${content_id} review_id=${(resRetry as any).insertId}`);
            await this.recalcContentAggregates(content_id);
            
            // Check achievements
            const newAchievements = await this.checkReviewAchievements(userId, { content: review_text, rating: rating ?? undefined });

            return { review_id: (resRetry as any).insertId, status: 'inserted', newAchievements } as any;
          } catch (_) {}
        }
        this.logger.error(`publishProReview insert failed code=${(err as any)?.code} errno=${(err as any)?.errno} msg=${(err as any)?.sqlMessage || (err as any)?.message}`);
        throw new InternalServerErrorException((err as any)?.sqlMessage || (err as any)?.message || 'Insert failed');
      }
    }
  }

  // Удалить отзыв (админ через процедуру admin_delete_review)
  async deleteReview(reviewId: number, adminId: number, reason: string) {
    try {
      const result = await this.connection.query(
        'CALL admin_delete_review(?, ?, ?)',
        [reviewId, adminId, reason],
      );
      return result[0][0];
    } catch (e) {
      // Fallback: прямое удаление
      try {
        await this.connection.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
        return { status: 'deleted' } as any;
      } catch (err) {
        const code = (err as any)?.code; const errno = (err as any)?.errno;
        if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
          await this.ensureReviewsTable();
          return { status: 'noop' } as any;
        }
        throw err;
      }
    }
  }

  // Получить отзывы для контента
  async getReviewsByContent(contentId: number) {
    // Prefer raw SQL with fallback for legacy column name
    try {
      const rows = await this.connection.query(
        `SELECT 
           r.*, 
           u.username, 
           u.avatar_url,
           (SELECT COUNT(*) FROM review_votes rv WHERE rv.review_id = r.id AND rv.vote_type = 'LIKE') as likes,
           (SELECT COUNT(*) FROM review_votes rv WHERE rv.review_id = r.id AND rv.vote_type = 'DISLIKE') as dislikes
         FROM reviews r 
         LEFT JOIN users u ON r.user_id = u.id 
         WHERE r.content_id = ? 
         ORDER BY r.id DESC`,
        [contentId],
      );
      return rows;
    } catch (e) {
      try {
        const rows2 = await this.connection.query(
          `SELECT 
             r.*, 
             u.username, 
             u.avatar_url,
             (SELECT COUNT(*) FROM review_votes rv WHERE rv.review_id = r.id AND rv.vote_type = 'LIKE') as likes,
             (SELECT COUNT(*) FROM review_votes rv WHERE rv.review_id = r.id AND rv.vote_type = 'DISLIKE') as dislikes
           FROM reviews r 
           LEFT JOIN users u ON r.user_id = u.id 
           WHERE r.movie_id = ? 
           ORDER BY r.id DESC`,
          [contentId],
        );
        return rows2;
      } catch (err) {
        const code = (err as any)?.code; const errno = (err as any)?.errno;
        if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
          await this.ensureReviewsTable();
          return [];
        }
        throw err;
      }
    }
  }

  // Получить отзывы пользователя
  async getReviewsByUser(userId: number) {
    try {
      return await this.reviewRepository.find({
        where: { user_id: userId },
        order: { id: 'DESC' },
      });
    } catch (err) {
      const code = (err as any)?.code; const errno = (err as any)?.errno;
      if (code === 'ER_NO_SUCH_TABLE' || errno === 1146) {
        await this.ensureReviewsTable();
        return [];
      }
      throw err;
    }
  }
}
