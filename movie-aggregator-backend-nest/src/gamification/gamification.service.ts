import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { User, UserLevel } from '../users/user.entity';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.ensureAchievementsSchema();
    await this.seedAchievements();
  }

  private async ensureAchievementsSchema() {
    try {
      // Check if icon_name column exists
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

      // Check if xp_reward column exists
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

      // Check if created_at column exists
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

      // Check if category column exists
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
        
        // Update existing categories
        await this.achievementRepository.query(`UPDATE achievements SET category = 'reviews' WHERE name IN ('Первый шаг', 'Киноманьяк', 'Критик')`);
        await this.achievementRepository.query(`UPDATE achievements SET category = 'engagement' WHERE name IN ('Популярный')`);
      }

      // Fix for "Field 'type' doesn't have a default value" error
      // The 'type' column seems to be a legacy column in the database that is not in the entity
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
        } else if (dataType === 'int' || dataType === 'tinyint' || dataType === 'smallint') {
             await this.achievementRepository.query(`ALTER TABLE achievements MODIFY COLUMN type ${dataType} DEFAULT 0`);
        } else {
             // Fallback to making it nullable
             await this.achievementRepository.query(`ALTER TABLE achievements MODIFY COLUMN type ${dataType} NULL`);
        }
      }
    } catch (e) {
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
      } else {
        // Update existing achievement to ensure new fields (icon, category, xp) are set correctly
        // This is useful if we changed icons or categories for existing achievements
        await this.achievementRepository.update(exists.id, {
            icon_name: achievement.icon_name,
            category: achievement.category,
            xp_reward: achievement.xp_reward,
            description: achievement.description
        });
      }
    }
  }

  async getUserAchievements(userId: number) {
    const allAchievements = await this.achievementRepository.find();
    const userAchievements = await this.userAchievementRepository.find({
      where: { user_id: userId },
    });

    const unlockedMap = new Map(userAchievements.map(ua => [ua.achievement_id, ua]));

    return allAchievements.map(achievement => {
      const unlocked = unlockedMap.get(achievement.id);
      return {
        id: achievement.id,
        title: achievement.name, // Map name to title for frontend
        description: achievement.description,
        icon: achievement.icon_name, // Map icon_name to icon
        category: achievement.category || 'general',
        xp: achievement.xp_reward,
        unlockedAt: unlocked ? unlocked.earned_at : undefined,
        progress: unlocked ? 100 : 0, // Simple progress for now
        requirement: 100, // Simple requirement
      };
    });
  }

  // Admin methods
  async getAllAchievements() {
    return this.achievementRepository.find({ order: { xp_reward: 'ASC' } });
  }

  async createAchievement(data: Partial<Achievement>) {
    const achievement = this.achievementRepository.create(data);
    return this.achievementRepository.save(achievement);
  }

  async updateAchievement(id: number, data: Partial<Achievement>) {
    await this.achievementRepository.update(id, data);
    return this.achievementRepository.findOne({ where: { id } });
  }

  async deleteAchievement(id: number) {
    return this.achievementRepository.delete(id);
  }

  async getLeaderboard(limit: number = 10) {
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

  async getUserLevel(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    const xp = user.reputation;
    let level = 1;
    let title = 'Новичок';
    let nextLevelXP = 100;

    if (xp >= 1000) { level = 4; title = 'Легенда'; nextLevelXP = 5000; }
    else if (xp >= 500) { level = 3; title = 'Эксперт'; nextLevelXP = 1000; }
    else if (xp >= 100) { level = 2; title = 'Энтузиаст'; nextLevelXP = 500; }

    return {
      level,
      title,
      currentXP: xp,
      nextLevelXP,
    };
  }

  async awardXp(userId: number, amount: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.reputation += amount;
    
    // Update level enum based on new reputation
    if (user.reputation >= 1000) user.level = UserLevel.LEGEND;
    else if (user.reputation >= 500) user.level = UserLevel.EXPERT;
    else if (user.reputation >= 100) user.level = UserLevel.ENTHUSIAST;
    else user.level = UserLevel.NOVICE;

    await this.userRepository.save(user);
    return user;
  }

  async checkAndAward(userId: number, trigger: string, value: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];

    const existingUserAchievements = await this.userAchievementRepository.find({ where: { user_id: userId } });
    const existingIds = new Set(existingUserAchievements.map(ua => ua.achievement_id));

    const allAchievements = await this.achievementRepository.find();
    const newUnlocked: Achievement[] = [];

    for (const achievement of allAchievements) {
      if (existingIds.has(achievement.id)) continue;

      let earned = false;
      if (achievement.name === 'Первый шаг' && trigger === 'review_count' && value >= 1) earned = true;
      if (achievement.name === 'Киноманьяк' && trigger === 'review_count' && value >= 10) earned = true;
      if (achievement.name === 'Критик' && trigger === 'review_count' && value >= 50) earned = true;
      if (achievement.name === 'Популярный' && trigger === 'likes_count' && value >= 10) earned = true;
      if (achievement.name === 'Разносторонний' && trigger === 'genres_count' && value >= 5) earned = true;
      if (achievement.name === 'В тренде' && trigger === 'hype_reviews' && value >= 3) earned = true;
      if (achievement.name === 'Графоман' && trigger === 'review_length' && value >= 500) earned = true;
      if (achievement.name === 'Перфекционист' && trigger === 'rating_value' && value === 10) earned = true;
      if (achievement.name === 'Суровый судья' && trigger === 'rating_value' && value <= 2 && value > 0) earned = true;
      if (achievement.name === 'Душа компании' && trigger === 'likes_count' && value >= 5) earned = true;

      if (earned) {
        await this.userAchievementRepository.save({
          user_id: userId,
          achievement_id: achievement.id,
        });
        
        // Use awardXp to handle reputation and level updates centrally
        await this.awardXp(userId, achievement.xp_reward);
        newUnlocked.push(achievement);
      }
    }
    
    return newUnlocked;
  }
}
