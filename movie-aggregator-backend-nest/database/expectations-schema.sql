-- Expectations table for "До/После" feature (Pre/Post Watch expectations system)
-- Stores user expectations (predicted ratings) before watching content

CREATE TABLE IF NOT EXISTS `expectations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `content_id` INT NOT NULL,
  `rating` DECIMAL(3,1) NOT NULL COMMENT 'Expected rating 1.0-10.0',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_content` (`user_id`, `content_id`),
  KEY `idx_content_id` (`content_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_expectations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_expectations_content` FOREIGN KEY (`content_id`) REFERENCES `content` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
