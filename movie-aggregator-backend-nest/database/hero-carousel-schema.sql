-- Hero Carousel Table
CREATE TABLE IF NOT EXISTS hero_carousel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  background_image VARCHAR(500),
  call_to_action_text VARCHAR(100),
  call_to_action_link VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE SET NULL,
  INDEX idx_display_order (display_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coming Soon Items Table
CREATE TABLE IF NOT EXISTS coming_soon_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content_type ENUM('MOVIE', 'TV_SERIES', 'GAME') NOT NULL,
  release_date DATE NOT NULL,
  description TEXT,
  poster_url VARCHAR(500),
  trailer_url VARCHAR(500),
  expected_score INT,
  genre VARCHAR(100),
  developer VARCHAR(255),
  director VARCHAR(255),
  creator VARCHAR(255),
  studio VARCHAR(255),
  network VARCHAR(255),
  publisher VARCHAR(255),
  platforms JSON,
  watchlist_count INT DEFAULT 0,
  screenshots JSON,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_release_date (release_date),
  INDEX idx_content_type (content_type),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
