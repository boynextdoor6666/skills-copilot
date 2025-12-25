-- =============================================
-- Schema Updates: Add missing tables for procedures
-- user_critic_preferences, user_personal_ratings, admin_logs, etc.
-- =============================================

-- Таблица: Избранные критики пользователя (для персонального агрегатора)
CREATE TABLE IF NOT EXISTS user_critic_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  critic_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_critic (user_id, critic_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (critic_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица: Персональные рейтинги пользователя (рассчитанные от выбранных критиков)
CREATE TABLE IF NOT EXISTS user_personal_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content_id INT NOT NULL,
  personal_rating DECIMAL(5,2) NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_content (user_id, content_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица: Логи действий администратора
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_user_id INT NULL,
  target_content_id INT NULL,
  details TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица: Провайдеры (если нужно блокировать внешние источники)
CREATE TABLE IF NOT EXISTS providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('API', 'SCRAPER', 'EXTERNAL') DEFAULT 'EXTERNAL',
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Добавить поле is_blocked в таблицу users (если отсутствует)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='users' AND column_name='is_blocked');
SET @s := IF(@c = 0, 'ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Добавить поле block_reason
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='users' AND column_name='block_reason');
SET @s := IF(@c = 0, 'ALTER TABLE users ADD COLUMN block_reason TEXT NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Добавить поле blocked_until
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='users' AND column_name='blocked_until');
SET @s := IF(@c = 0, 'ALTER TABLE users ADD COLUMN blocked_until DATETIME NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Добавить content_id в таблицу reviews (если используется старое имя movie_id)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='reviews' AND column_name='content_id');
SET @s := IF(@c = 0, 'ALTER TABLE reviews ADD COLUMN content_id INT NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Если есть movie_id, скопировать данные в content_id
SET @has_movie_id := (SELECT COUNT(*) FROM information_schema.columns
                      WHERE table_schema = DATABASE() AND table_name='reviews' AND column_name='movie_id');
SET @copy := IF(@has_movie_id > 0, 'UPDATE reviews SET content_id = movie_id WHERE content_id IS NULL', 'SELECT "no movie_id"');
PREPARE stmt2 FROM @copy; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- Убедиться, что content.avg_rating, critics_rating, audience_rating существуют
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='avg_rating');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN avg_rating DECIMAL(5,2) NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='critics_rating');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN critics_rating DECIMAL(5,2) NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='audience_rating');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN audience_rating DECIMAL(5,2) NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Проверить, что таблица content имеет content_type
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='content_type');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN content_type ENUM(''MOVIE'', ''TV_SERIES'', ''GAME'') DEFAULT ''MOVIE''', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Убедиться, что у reviews есть rating (для критиков и зрителей)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='reviews' AND column_name='rating');
SET @s := IF(@c = 0, 'ALTER TABLE reviews ADD COLUMN rating DECIMAL(3,1) NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Дополнительные поля в content, используемые бэкендом
-- description (TEXT)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='description');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN description TEXT NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- poster_url (VARCHAR 500)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='poster_url');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN poster_url VARCHAR(500) NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- trailer_url (VARCHAR 500)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='trailer_url');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN trailer_url VARCHAR(500) NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- emotional_cloud (JSON)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='emotional_cloud');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN emotional_cloud JSON NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- perception_map (JSON)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='perception_map');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN perception_map JSON NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- hype_index (INT)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='hype_index');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN hype_index INT DEFAULT 0', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- reviews_count (INT)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='reviews_count');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN reviews_count INT DEFAULT 0', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- created_at / updated_at (для сортировки по дате, опционально)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='created_at');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='content' AND column_name='updated_at');
SET @s := IF(@c = 0, 'ALTER TABLE content ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Поля reviews aspects/emotions (JSON), если отсутствуют
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='reviews' AND column_name='aspects');
SET @s := IF(@c = 0, 'ALTER TABLE reviews ADD COLUMN aspects JSON NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name='reviews' AND column_name='emotions');
SET @s := IF(@c = 0, 'ALTER TABLE reviews ADD COLUMN emotions JSON NULL', 'SELECT "column exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Schema updates applied successfully' AS status;

-- =============================================
-- Base tables bootstrap (idempotent): create missing tables if not exist
-- =============================================

-- content table (required by backend Content entity)
CREATE TABLE IF NOT EXISTS content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content_type ENUM('MOVIE','TV_SERIES','GAME') DEFAULT 'MOVIE',
  release_year INT NULL,
  genre VARCHAR(100) NULL,
  description TEXT NULL,
  avg_rating DECIMAL(5,2) DEFAULT 0,
  critics_rating DECIMAL(5,2) DEFAULT 0,
  audience_rating DECIMAL(5,2) DEFAULT 0,
  hype_index INT DEFAULT 0,
  reviews_count INT DEFAULT 0,
  emotional_cloud JSON NULL,
  perception_map JSON NULL,
  poster_url VARCHAR(500) NULL,
  trailer_url VARCHAR(500) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- reviews table (minimal shape used by backend; created only if absent)
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  aspects JSON NULL,
  emotions JSON NULL,
  rating DECIMAL(3,1) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reviews_content (content_id),
  INDEX idx_reviews_user (user_id),
  CONSTRAINT fk_reviews_content FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
