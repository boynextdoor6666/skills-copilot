"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const achievement_entity_1 = require("./entities/achievement.entity");
const user_achievement_entity_1 = require("./entities/user-achievement.entity");
const user_entity_1 = require("../users/user.entity");
let GamificationService = class GamificationService {
    constructor(achievementRepository, userAchievementRepository, userRepository) {
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.userRepository = userRepository;
    }
    async onModuleInit() {
        await this.ensureAchievementsSchema();
        await this.seedAchievements();
    }
    async ensureAchievementsSchema() {
        try {
            const resultIcon = await this.achievementRepository.query(`
        SELECT count(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = 'achievements' 
        AND column_name = 'icon_name'
      `);
            if (resultIcon[0].count === 0) {
                console.log('Adding icon_name column to achievements table...');
                await this.achievementRepository.query(`
          ALTER TABLE achievements 
          ADD COLUMN icon_name VARCHAR(50) NULL AFTER description
        `);
            }
            const resultXp = await this.achievementRepository.query(`
        SELECT count(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = 'achievements' 
        AND column_name = 'xp_reward'
      `);
            if (resultXp[0].count === 0) {
                console.log('Adding xp_reward column to achievements table...');
                await this.achievementRepository.query(`
          ALTER TABLE achievements 
          ADD COLUMN xp_reward INT DEFAULT 0 AFTER icon_name
        `);
            }
            const resultCreatedAt = await this.achievementRepository.query(`
        SELECT count(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = 'achievements' 
        AND column_name = 'created_at'
      `);
            if (resultCreatedAt[0].count === 0) {
                console.log('Adding created_at column to achievements table...');
                await this.achievementRepository.query(`
          ALTER TABLE achievements 
          ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        `);
            }
            const resultCategory = await this.achievementRepository.query(`
        SELECT count(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = 'achievements' 
        AND column_name = 'category'
      `);
            if (resultCategory[0].count === 0) {
                console.log('Adding category column to achievements table...');
                await this.achievementRepository.query(`
          ALTER TABLE achievements 
          ADD COLUMN category VARCHAR(50) DEFAULT 'general' AFTER xp_reward
        `);
                await this.achievementRepository.query(`UPDATE achievements SET category = 'reviews' WHERE name IN ('Первый шаг', 'Киноманьяк', 'Критик')`);
                await this.achievementRepository.query(`UPDATE achievements SET category = 'engagement' WHERE name IN ('Популярный')`);
            }
            const resultType = await this.achievementRepository.query(`
        SELECT DATA_TYPE 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = 'achievements' 
        AND column_name = 'type'
      `);
            if (resultType.length > 0) {
                console.log('Fixing legacy type column...');
                const dataType = resultType[0].DATA_TYPE;
                if (dataType === 'varchar' || dataType === 'text' || dataType === 'char') {
                    await this.achievementRepository.query(`ALTER TABLE achievements MODIFY COLUMN type ${dataType}(50) DEFAULT 'general'`);
                }
                else if (dataType === 'int' || dataType === 'tinyint' || dataType === 'smallint') {
                    await this.achievementRepository.query(`ALTER TABLE achievements MODIFY COLUMN type ${dataType} DEFAULT 0`);
                }
                else {
                    await this.achievementRepository.query(`ALTER TABLE achievements MODIFY COLUMN type ${dataType} NULL`);
                }
            }
        }
        catch (e) {
            console.error('Error ensuring achievements schema:', e);
        }
    }
    async seedAchievements() {
        const achievements = [
            { name: 'Первый шаг', description: 'Оставьте свой первый отзыв', icon_name: 'footprints', xp_reward: 10, category: 'reviews' },
            { name: 'Киноманьяк', description: 'Оставьте 10 отзывов', icon_name: 'film', xp_reward: 50, category: 'reviews' },
            { name: 'Критик', description: 'Оставьте 50 отзывов', icon_name: 'star', xp_reward: 200, category: 'reviews' },
            { name: 'Популярный', description: 'Получите 10 лайков на отзыв', icon_name: 'heart', xp_reward: 30, category: 'engagement' },
            { name: 'Разносторонний', description: 'Оцените фильмы 5 разных жанров', icon_name: 'palette', xp_reward: 40, category: 'diversity' },
            { name: 'В тренде', description: 'Оцените 3 фильма с высоким хайпом', icon_name: 'flame', xp_reward: 30, category: 'special' },
            { name: 'Графоман', description: 'Напишите отзыв длиннее 500 символов', icon_name: 'feather', xp_reward: 25, category: 'reviews' },
            { name: 'Перфекционист', description: 'Поставьте оценку 10/10', icon_name: 'trophy', xp_reward: 20, category: 'reviews' },
            { name: 'Суровый судья', description: 'Поставьте оценку 2/10 или ниже', icon_name: 'gavel', xp_reward: 20, category: 'reviews' },
            { name: 'Душа компании', description: 'Получите 5 лайков на отзыв', icon_name: 'users', xp_reward: 15, category: 'engagement' },
        ];
        for (const achievement of achievements) {
            const exists = await this.achievementRepository.findOne({ where: { name: achievement.name } });
            if (!exists) {
                await this.achievementRepository.save(achievement);
            }
            else {
                await this.achievementRepository.update(exists.id, {
                    icon_name: achievement.icon_name,
                    category: achievement.category,
                    xp_reward: achievement.xp_reward,
                    description: achievement.description
                });
            }
        }
    }
    async getUserAchievements(userId) {
        const allAchievements = await this.achievementRepository.find();
        const userAchievements = await this.userAchievementRepository.find({
            where: { user_id: userId },
        });
        const unlockedMap = new Map(userAchievements.map(ua => [ua.achievement_id, ua]));
        return allAchievements.map(achievement => {
            const unlocked = unlockedMap.get(achievement.id);
            return {
                id: achievement.id,
                title: achievement.name,
                description: achievement.description,
                icon: achievement.icon_name,
                category: achievement.category || 'general',
                xp: achievement.xp_reward,
                unlockedAt: unlocked ? unlocked.earned_at : undefined,
                progress: unlocked ? 100 : 0,
                requirement: 100,
            };
        });
    }
    async getAllAchievements() {
        return this.achievementRepository.find({ order: { xp_reward: 'ASC' } });
    }
    async createAchievement(data) {
        const achievement = this.achievementRepository.create(data);
        return this.achievementRepository.save(achievement);
    }
    async updateAchievement(id, data) {
        await this.achievementRepository.update(id, data);
        return this.achievementRepository.findOne({ where: { id } });
    }
    async deleteAchievement(id) {
        return this.achievementRepository.delete(id);
    }
    async getLeaderboard(limit = 10) {
        const users = await this.userRepository.find({
            order: { reputation: 'DESC' },
            take: limit,
        });
        return users.map((user, index) => ({
            userId: user.id,
            username: user.username,
            rank: index + 1,
            xp: user.reputation,
            reviewCount: user.totalReviews,
            avgRating: 0,
        }));
    }
    async getUserLevel(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            return null;
        const xp = user.reputation;
        let level = 1;
        let title = 'Новичок';
        let nextLevelXP = 100;
        if (xp >= 1000) {
            level = 4;
            title = 'Легенда';
            nextLevelXP = 5000;
        }
        else if (xp >= 500) {
            level = 3;
            title = 'Эксперт';
            nextLevelXP = 1000;
        }
        else if (xp >= 100) {
            level = 2;
            title = 'Энтузиаст';
            nextLevelXP = 500;
        }
        return {
            level,
            title,
            currentXP: xp,
            nextLevelXP,
        };
    }
    async awardXp(userId, amount) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            return;
        user.reputation += amount;
        if (user.reputation >= 1000)
            user.level = user_entity_1.UserLevel.LEGEND;
        else if (user.reputation >= 500)
            user.level = user_entity_1.UserLevel.EXPERT;
        else if (user.reputation >= 100)
            user.level = user_entity_1.UserLevel.ENTHUSIAST;
        else
            user.level = user_entity_1.UserLevel.NOVICE;
        await this.userRepository.save(user);
        return user;
    }
    async checkAndAward(userId, trigger, value) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            return [];
        const existingUserAchievements = await this.userAchievementRepository.find({ where: { user_id: userId } });
        const existingIds = new Set(existingUserAchievements.map(ua => ua.achievement_id));
        const allAchievements = await this.achievementRepository.find();
        const newUnlocked = [];
        for (const achievement of allAchievements) {
            if (existingIds.has(achievement.id))
                continue;
            let earned = false;
            if (achievement.name === 'Первый шаг' && trigger === 'review_count' && value >= 1)
                earned = true;
            if (achievement.name === 'Киноманьяк' && trigger === 'review_count' && value >= 10)
                earned = true;
            if (achievement.name === 'Критик' && trigger === 'review_count' && value >= 50)
                earned = true;
            if (achievement.name === 'Популярный' && trigger === 'likes_count' && value >= 10)
                earned = true;
            if (achievement.name === 'Разносторонний' && trigger === 'genres_count' && value >= 5)
                earned = true;
            if (achievement.name === 'В тренде' && trigger === 'hype_reviews' && value >= 3)
                earned = true;
            if (achievement.name === 'Графоман' && trigger === 'review_length' && value >= 500)
                earned = true;
            if (achievement.name === 'Перфекционист' && trigger === 'rating_value' && value === 10)
                earned = true;
            if (achievement.name === 'Суровый судья' && trigger === 'rating_value' && value <= 2 && value > 0)
                earned = true;
            if (achievement.name === 'Душа компании' && trigger === 'likes_count' && value >= 5)
                earned = true;
            if (earned) {
                await this.userAchievementRepository.save({
                    user_id: userId,
                    achievement_id: achievement.id,
                });
                await this.awardXp(userId, achievement.xp_reward);
                newUnlocked.push(achievement);
            }
        }
        return newUnlocked;
    }
};
exports.GamificationService = GamificationService;
exports.GamificationService = GamificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(achievement_entity_1.Achievement)),
    __param(1, (0, typeorm_1.InjectRepository)(user_achievement_entity_1.UserAchievement)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GamificationService);
//# sourceMappingURL=gamification.service.js.map