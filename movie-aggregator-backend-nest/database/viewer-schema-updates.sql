-- Schema updates required by viewer-triggers-procedures.sql
-- Adds missing columns and tables referenced by procedures/triggers

-- Add emotions/aspects columns to reviews
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS emotions JSON NULL,
  ADD COLUMN IF NOT EXISTS aspects JSON NULL;

-- Ensure movies has fields for emotional and perception maps and hype
ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS emotional_cloud JSON NULL,
  ADD COLUMN IF NOT EXISTS perception_map JSON NULL,
  ADD COLUMN IF NOT EXISTS hype_index INT DEFAULT 0;

-- Ensure notifications table exists
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

-- Ensure subscriptions table exists (user subscribes to movie updates)
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  subscriber_id BIGINT NOT NULL,
  movie_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_subscriber_movie (subscriber_id, movie_id),
  INDEX (subscriber_id),
  INDEX (movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: make sure user_achievements exists (only if referenced elsewhere)
-- CREATE TABLE IF NOT EXISTS user_achievements (...);

-- Done
SELECT 'viewer schema updates applied' AS message;
