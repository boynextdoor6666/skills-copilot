import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity';
import { Achievement } from '../src/gamification/entities/achievement.entity';
import { UserAchievement } from '../src/gamification/entities/user-achievement.entity';
import { Publication } from '../src/critics/entities/publication.entity';
import { Review } from '../src/reviews/entities/review.entity';
import { Content } from '../src/content/entities/content.entity';

dotenv.config();

async function run() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'warehouse',
    entities: [User, Achievement, UserAchievement, Publication, Review, Content],
    synchronize: false,
  });

  await ds.initialize();
  console.log('DataSource initialized');

  const userRepo = ds.getRepository(User);
  const achievementRepo = ds.getRepository(Achievement);
  const userAchievementRepo = ds.getRepository(UserAchievement);

  // Fix schema if needed
  try {
      await achievementRepo.query(`
          ALTER TABLE achievements 
          ADD COLUMN icon_name VARCHAR(50) NULL AFTER description
      `);
      console.log('Added icon_name column');
  } catch (e) {
      // Ignore if exists
  }

  try {
      await achievementRepo.query(`
          ALTER TABLE achievements 
          ADD COLUMN xp_reward INT DEFAULT 0 AFTER icon_name
      `);
      console.log('Added xp_reward column');
  } catch (e) {
      // Ignore if exists
  }

  try {
      await achievementRepo.query(`
          ALTER TABLE achievements 
          ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('Added created_at column');
  } catch (e) {
      // Ignore if exists
  }

  try {
      await achievementRepo.query(`
          ALTER TABLE achievements 
          ADD COLUMN category VARCHAR(50) DEFAULT 'general' AFTER xp_reward
      `);
      console.log('Added category column');
  } catch (e) {
      // Ignore if exists
  }

  try {
      // Update categories for testing
      await achievementRepo.query(`UPDATE achievements SET category = 'reviews' WHERE name LIKE '%Первый шаг%' OR name LIKE '%Киноманьяк%' OR name LIKE '%Критик%'`);
      await achievementRepo.query(`UPDATE achievements SET category = 'engagement' WHERE name LIKE '%Популярный%'`);
      await achievementRepo.query(`UPDATE achievements SET category = 'diversity' WHERE name LIKE '%Разносторонний%'`);
      await achievementRepo.query(`UPDATE achievements SET category = 'special' WHERE name LIKE '%В тренде%'`);
      
      // Fallback for others
      await achievementRepo.query(`UPDATE achievements SET category = 'reviews' WHERE category = 'GENERAL' OR category IS NULL OR category = 'MOVIES'`);
      console.log('Updated categories');

      // Update icons
      await achievementRepo.query(`UPDATE achievements SET icon_name = 'footprints' WHERE name LIKE '%Первый шаг%'`);
      await achievementRepo.query(`UPDATE achievements SET icon_name = 'film' WHERE name LIKE '%Киноманьяк%' OR name LIKE '%Киноман%'`);
      await achievementRepo.query(`UPDATE achievements SET icon_name = 'star' WHERE name LIKE '%Критик%'`);
      await achievementRepo.query(`UPDATE achievements SET icon_name = 'heart' WHERE name LIKE '%Популярный%'`);
      await achievementRepo.query(`UPDATE achievements SET icon_name = 'palette' WHERE name LIKE '%Разносторонний%'`);
      await achievementRepo.query(`UPDATE achievements SET icon_name = 'flame' WHERE name LIKE '%В тренде%'`);
      console.log('Updated icons');
  } catch (e) {
      console.error('Error updating categories/icons:', e);
  }

  // 1. Check if achievements exist
  const count = await achievementRepo.count();
  console.log(`Achievements count: ${count}`);

  if (count === 0) {
      console.log('Seeding achievements...');
      const achievements = [
        { name: 'Первый шаг', description: 'Оставьте свой первый отзыв', icon_name: 'footprints', xp_reward: 10 },
        { name: 'Киноманьяк', description: 'Оставьте 10 отзывов', icon_name: 'film', xp_reward: 50 },
      ];
      await achievementRepo.save(achievements);
  }

  // 2. Get a user
  const user = await userRepo.findOne({ where: {} });
  if (!user) {
      console.log('No user found');
      return;
  }
  console.log(`Testing with user: ${user.username} (${user.id})`);

  // 3. Try to get user achievements
  try {
      const userAchievements = await userAchievementRepo.find({
          where: { user_id: user.id },
          relations: ['achievement'],
      });
      console.log('User achievements:', userAchievements);
  } catch (e) {
      console.error('Error fetching user achievements:', e);
  }

  await ds.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
