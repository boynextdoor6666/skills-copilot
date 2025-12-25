-- Safe schema updates for viewer procedures (works even if columns already exist)
-- Uses dynamic SQL to add columns only when missing

-- Add emotions column to reviews if missing
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'warehouse' AND TABLE_NAME = 'reviews' AND COLUMN_NAME = 'emotions');
SET @s := IF(@c = 0, 'ALTER TABLE reviews ADD COLUMN emotions JSON NULL;', 'SELECT "emotions exists";');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add aspects column to reviews if missing
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'warehouse' AND TABLE_NAME = 'reviews' AND COLUMN_NAME = 'aspects');
SET @s := IF(@c = 0, 'ALTER TABLE reviews ADD COLUMN aspects JSON NULL;', 'SELECT "aspects exists";');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add emotional_cloud to movies if missing
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'warehouse' AND TABLE_NAME = 'movies' AND COLUMN_NAME = 'emotional_cloud');
SET @s := IF(@c = 0, 'ALTER TABLE movies ADD COLUMN emotional_cloud JSON NULL;', 'SELECT "emotional_cloud exists";');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add perception_map to movies if missing
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'warehouse' AND TABLE_NAME = 'movies' AND COLUMN_NAME = 'perception_map');
SET @s := IF(@c = 0, 'ALTER TABLE movies ADD COLUMN perception_map JSON NULL;', 'SELECT "perception_map exists";');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add hype_index to movies if missing
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'warehouse' AND TABLE_NAME = 'movies' AND COLUMN_NAME = 'hype_index');
SET @s := IF(@c = 0, 'ALTER TABLE movies ADD COLUMN hype_index INT DEFAULT 0;', 'SELECT "hype_index exists";');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create notifications table if missing
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  review_id BIGINT DEFAULT NULL,
  message VARCHAR(1024) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create subscriptions table if missing
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  subscriber_id BIGINT NOT NULL,
  movie_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_subscriber_movie (subscriber_id, movie_id),
  INDEX (subscriber_id),
  INDEX (movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'viewer-safe schema updates applied' AS message;
