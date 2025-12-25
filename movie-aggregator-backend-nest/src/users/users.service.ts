import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository, InjectConnection } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectConnection() private connection: Connection,
  ) {}

  async onModuleInit() {
    await this.ensureUserColumns();
    await this.ensureWatchlistTable();
    await this.ensureWatchlistColumns();
  }

  private async ensureWatchlistColumns() {
    try {
      const check = await this.connection.query("SHOW COLUMNS FROM watchlist LIKE 'content_id'");
      if (!Array.isArray(check) || check.length === 0) {
        // Check if we have movie_id instead
        const checkMovie = await this.connection.query("SHOW COLUMNS FROM watchlist LIKE 'movie_id'");
        if (Array.isArray(checkMovie) && checkMovie.length > 0) {
          
          // 1. Find and drop foreign keys on movie_id
          // Try to drop known FK names proactively to avoid "incompatible" errors
          try { await this.connection.query("ALTER TABLE watchlist DROP FOREIGN KEY `watchlist_ibfk_2`"); } catch (_) {}
          try { await this.connection.query("ALTER TABLE watchlist DROP FOREIGN KEY `fk_watchlist_movie`"); } catch (_) {}

          const fks = await this.connection.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'watchlist' 
            AND COLUMN_NAME = 'movie_id' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
          `);
          
          if (Array.isArray(fks)) {
            for (const fk of fks) {
              try {
                await this.connection.query(`ALTER TABLE watchlist DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
              } catch (e) {
                console.warn(`Failed to drop FK ${fk.CONSTRAINT_NAME}:`, e);
              }
            }
          }

          // 2. Rename movie_id to content_id
          try {
             await this.connection.query("ALTER TABLE watchlist CHANGE COLUMN `movie_id` `content_id` INT NOT NULL");
          } catch (e) {
             // If rename fails, maybe it's because of a lingering FK or index?
             // Try to just add content_id if it doesn't exist
             const checkContent = await this.connection.query("SHOW COLUMNS FROM watchlist LIKE 'content_id'");
             if (!Array.isArray(checkContent) || checkContent.length === 0) {
                await this.connection.query("ALTER TABLE watchlist ADD COLUMN `content_id` INT NOT NULL");
                // We might have both columns now, but at least the app will work
             }
          }
          
          // 3. Drop old index if exists and add new unique key
          try { await this.connection.query("ALTER TABLE watchlist DROP INDEX uniq_user_movie"); } catch (_) {}
          try { await this.connection.query("ALTER TABLE watchlist ADD UNIQUE KEY uniq_user_content (user_id, content_id)"); } catch (_) {}
        } else {
          // Add content_id column
          await this.connection.query("ALTER TABLE watchlist ADD COLUMN `content_id` INT NOT NULL");
          try { await this.connection.query("ALTER TABLE watchlist ADD UNIQUE KEY uniq_user_content (user_id, content_id)"); } catch (_) {}
        }
      }

      // Ensure created_at exists
      const checkCreated = await this.connection.query("SHOW COLUMNS FROM watchlist LIKE 'created_at'");
      if (!Array.isArray(checkCreated) || checkCreated.length === 0) {
        await this.connection.query("ALTER TABLE watchlist ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP");
      }
    } catch (e) {
      console.error('Error ensuring watchlist columns:', e);
    }
  }

  private async ensureWatchlistTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS watchlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_content (user_id, content_id),
        INDEX idx_watchlist_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    try {
      await this.connection.query(sql);
    } catch (_) {}
  }

  async addToWatchlist(userId: number, contentId: number) {
    try {
      await this.connection.query(
        'INSERT IGNORE INTO watchlist (user_id, content_id) VALUES (?, ?)',
        [userId, contentId]
      );
      return { status: 'added' };
    } catch (e) {
      throw e;
    }
  }

  async removeFromWatchlist(userId: number, contentId: number) {
    await this.connection.query(
      'DELETE FROM watchlist WHERE user_id = ? AND content_id = ?',
      [userId, contentId]
    );
    return { status: 'removed' };
  }

  async getWatchlist(userId: number) {
    // Join with content table to get details
    // Assuming 'content' table exists and has title, poster_url etc.
    // If content table is not reliable, we might need to join with movies/games tables or just return IDs
    // For now, let's try to join with 'content' table which seems to be the unified table
    try {
      const rows = await this.connection.query(
        `SELECT w.content_id, w.created_at, c.title, c.poster_url, c.content_type, c.avg_rating
         FROM watchlist w
         LEFT JOIN content c ON w.content_id = c.id
         WHERE w.user_id = ?
         ORDER BY w.created_at DESC`,
        [userId]
      );
      return rows;
    } catch (e) {
      // Fallback if content table join fails
      return await this.connection.query('SELECT * FROM watchlist WHERE user_id = ?', [userId]);
    }
  }

  private async ensureUserColumns() {
    try {
      const columnsToCheck = [
        { name: 'country', type: 'VARCHAR(100) NULL' },
        { name: 'level', type: "ENUM('NOVICE', 'ENTHUSIAST', 'EXPERT', 'LEGEND') DEFAULT 'NOVICE'" },
        { name: 'total_reviews', type: 'INT DEFAULT 0' },
        { name: 'total_ratings', type: 'INT DEFAULT 0' },
        { name: 'reputation', type: 'INT DEFAULT 0' },
        { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'is_verified', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'avatar_url', type: 'VARCHAR(500) NULL' },
        { name: 'bio', type: 'TEXT NULL' },
        { name: 'registration_date', type: 'DATETIME NULL' },
        { name: 'last_login', type: 'DATETIME NULL' },
        { name: 'publication_id', type: 'INT NULL' }
      ];

      for (const col of columnsToCheck) {
        const check = await this.connection.query(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
        if (!Array.isArray(check) || check.length === 0) {
          console.log(`Adding missing column ${col.name} to users table...`);
          await this.connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        }
      }
    } catch (e) {
      console.error('Error ensuring user columns:', e);
    }
  }

  findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<User>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async updateById(id: number, data: Partial<User>) {
    // remove undefined props
    const toSet: any = {};
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v !== undefined) toSet[k] = v;
    });
    if (Object.keys(toSet).length === 0) {
      // nothing to update, return existing user instead of throwing
      return this.findById(id);
    }
    await this.repo.update(id, toSet);
    return this.findById(id);
  }

  async changePassword(id: number, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.repo.update(id, { password: hashed });
    return this.findById(id);
  }
}
