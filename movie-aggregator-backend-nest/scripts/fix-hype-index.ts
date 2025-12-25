
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Fixing CalculateHypeIndex procedure...');

  const procedure = `
    DROP PROCEDURE IF EXISTS CalculateHypeIndex;
    CREATE PROCEDURE CalculateHypeIndex(IN p_content_id INT)
    BEGIN
      DECLARE v_reviews INT DEFAULT 0;
      DECLARE v_ratings INT DEFAULT 0;
      DECLARE v_recent_reviews INT DEFAULT 0;
      DECLARE v_hype INT DEFAULT 0;

      -- Count reviews using content_id OR movie_id
      SELECT COUNT(*) INTO v_reviews FROM reviews 
      WHERE content_id = p_content_id OR movie_id = p_content_id;

      -- Count ratings (assuming user_ratings uses movie_id which matches content_id)
      -- We use try/catch block logic by checking if table exists or just assuming it does.
      -- Since we are in a procedure, we just run the query. If user_ratings doesn't exist, it might fail.
      -- But based on context, user_ratings exists.
      SELECT COUNT(*) INTO v_ratings FROM user_ratings 
      WHERE movie_id = p_content_id;

      -- Count recent reviews
      SELECT COUNT(*) INTO v_recent_reviews FROM reviews 
      WHERE (content_id = p_content_id OR movie_id = p_content_id) 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

      -- Formula: (Reviews * 2) + Ratings + (Recent Reviews * 5)
      -- Cap at 100
      SET v_hype = LEAST(100, (v_reviews * 2) + v_ratings + (v_recent_reviews * 5));

      -- Update content table
      UPDATE content SET hype_index = v_hype WHERE id = p_content_id;
      
      -- Update movies table (legacy support)
      UPDATE movies SET hype_index = v_hype WHERE id = p_content_id;
    END;
  `;

  try {
    // Split by DROP and CREATE because some drivers don't support multiple statements well in one call
    // But TypeORM query usually handles it if multipleStatements is enabled.
    // To be safe, we run them separately.
    await dataSource.query('DROP PROCEDURE IF EXISTS CalculateHypeIndex');
    await dataSource.query(`
    CREATE PROCEDURE CalculateHypeIndex(IN p_content_id INT)
    BEGIN
      DECLARE v_reviews INT DEFAULT 0;
      DECLARE v_ratings INT DEFAULT 0;
      DECLARE v_recent_reviews INT DEFAULT 0;
      DECLARE v_hype INT DEFAULT 0;

      SELECT COUNT(*) INTO v_reviews FROM reviews 
      WHERE content_id = p_content_id OR movie_id = p_content_id;

      SELECT COUNT(*) INTO v_ratings FROM user_ratings 
      WHERE movie_id = p_content_id;

      SELECT COUNT(*) INTO v_recent_reviews FROM reviews 
      WHERE (content_id = p_content_id OR movie_id = p_content_id) 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

      SET v_hype = LEAST(100, (v_reviews * 2) + v_ratings + (v_recent_reviews * 5));

      UPDATE content SET hype_index = v_hype WHERE id = p_content_id;
      UPDATE movies SET hype_index = v_hype WHERE id = p_content_id;
    END
    `);
    console.log('CalculateHypeIndex procedure updated successfully.');
    
    // Also verify user_ratings table exists, if not create it to avoid errors
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS user_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        movie_id INT NOT NULL,
        content_id INT NULL,
        rating DECIMAL(3,1) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_movie (user_id, movie_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Ensured user_ratings table exists.');

  } catch (error) {
    console.error('Error updating procedure:', error);
  }

  await app.close();
}

bootstrap();
