"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    constructor(repo, connection) {
        this.repo = repo;
        this.connection = connection;
    }
    async onModuleInit() {
        await this.ensureUserColumns();
        await this.ensureWatchlistTable();
        await this.ensureWatchlistColumns();
    }
    async ensureWatchlistColumns() {
        try {
            const check = await this.connection.query("SHOW COLUMNS FROM watchlist LIKE 'content_id'");
            if (!Array.isArray(check) || check.length === 0) {
                const checkMovie = await this.connection.query("SHOW COLUMNS FROM watchlist LIKE 'movie_id'");
                if (Array.isArray(checkMovie) && checkMovie.length > 0) {
                    try {
                        await this.connection.query("ALTER TABLE watchlist DROP FOREIGN KEY `watchlist_ibfk_2`");
                    }
                    catch (_) { }
                    try {
                        await this.connection.query("ALTER TABLE watchlist DROP FOREIGN KEY `fk_watchlist_movie`");
                    }
                    catch (_) { }
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
                            }
                            catch (e) {
                                console.warn(`Failed to drop FK ${fk.CONSTRAINT_NAME}:`, e);
                            }
                        }
                    }
                    try {
                        await this.connection.query("ALTER TABLE watchlist CHANGE COLUMN `movie_id` `content_id` INT NOT NULL");
                    }
                    catch (e) {
                        const checkContent = await this.connection.query("SHOW COLUMNS FROM watchlist LIKE 'content_id'");
                        if (!Array.isArray(checkContent) || checkContent.length === 0) {
                            await this.connection.query("ALTER TABLE watchlist ADD COLUMN `content_id` INT NOT NULL");
                        }
                    }
                    try {
                        await this.connection.query("ALTER TABLE watchlist DROP INDEX uniq_user_movie");
                    }
                    catch (_) { }
                    try {
                        await this.connection.query("ALTER TABLE watchlist ADD UNIQUE KEY uniq_user_content (user_id, content_id)");
                    }
                    catch (_) { }
                }
                else {
                    await this.connection.query("ALTER TABLE watchlist ADD COLUMN `content_id` INT NOT NULL");
                    try {
                        await this.connection.query("ALTER TABLE watchlist ADD UNIQUE KEY uniq_user_content (user_id, content_id)");
                    }
                    catch (_) { }
                }
            }
            const checkCreated = await this.connection.query("SHOW COLUMNS FROM watchlist LIKE 'created_at'");
            if (!Array.isArray(checkCreated) || checkCreated.length === 0) {
                await this.connection.query("ALTER TABLE watchlist ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP");
            }
        }
        catch (e) {
            console.error('Error ensuring watchlist columns:', e);
        }
    }
    async ensureWatchlistTable() {
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
        }
        catch (_) { }
    }
    async addToWatchlist(userId, contentId) {
        try {
            await this.connection.query('INSERT IGNORE INTO watchlist (user_id, content_id) VALUES (?, ?)', [userId, contentId]);
            return { status: 'added' };
        }
        catch (e) {
            throw e;
        }
    }
    async removeFromWatchlist(userId, contentId) {
        await this.connection.query('DELETE FROM watchlist WHERE user_id = ? AND content_id = ?', [userId, contentId]);
        return { status: 'removed' };
    }
    async getWatchlist(userId) {
        try {
            const rows = await this.connection.query(`SELECT w.content_id, w.created_at, c.title, c.poster_url, c.content_type, c.avg_rating
         FROM watchlist w
         LEFT JOIN content c ON w.content_id = c.id
         WHERE w.user_id = ?
         ORDER BY w.created_at DESC`, [userId]);
            return rows;
        }
        catch (e) {
            return await this.connection.query('SELECT * FROM watchlist WHERE user_id = ?', [userId]);
        }
    }
    async ensureUserColumns() {
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
        }
        catch (e) {
            console.error('Error ensuring user columns:', e);
        }
    }
    findByUsername(username) {
        return this.repo.findOne({ where: { username } });
    }
    findByEmail(email) {
        return this.repo.findOne({ where: { email } });
    }
    findById(id) {
        return this.repo.findOne({ where: { id } });
    }
    async create(data) {
        const user = this.repo.create(data);
        return this.repo.save(user);
    }
    async updateById(id, data) {
        const toSet = {};
        Object.entries(data || {}).forEach(([k, v]) => {
            if (v !== undefined)
                toSet[k] = v;
        });
        if (Object.keys(toSet).length === 0) {
            return this.findById(id);
        }
        await this.repo.update(id, toSet);
        return this.findById(id);
    }
    async changePassword(id, newPassword) {
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.repo.update(id, { password: hashed });
        return this.findById(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], UsersService);
//# sourceMappingURL=users.service.js.map