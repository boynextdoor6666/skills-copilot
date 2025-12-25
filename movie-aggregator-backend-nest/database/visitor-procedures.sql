-- =============================================
-- Visitor Flow Procedures (Диаграмма Посетителя)
-- after_search, get_emotional_cloud_chart, create_user
-- =============================================

DELIMITER $$

-- Процедура: После поиска — вернуть агрегацию контента с фильтрами
-- Возвращает список контента с рейтингами, сортировкой
DROP PROCEDURE IF EXISTS after_search$$
CREATE PROCEDURE after_search(
  IN p_query VARCHAR(255),
  IN p_content_type ENUM('MOVIE', 'TV_SERIES', 'GAME'),
  IN p_limit INT
)
BEGIN
  DECLARE v_limit INT DEFAULT 20;
  
  IF p_limit IS NOT NULL AND p_limit > 0 THEN
    SET v_limit = p_limit;
  END IF;
  
  -- Возвращаем контент, отсортированный по created_at DESC
  SELECT 
    id,
    title,
    content_type,
    release_year,
    genre,
    COALESCE(avg_rating, 0) AS avg_rating,
    COALESCE(critics_rating, 0) AS critics_rating,
    COALESCE(audience_rating, 0) AS audience_rating,
    COALESCE(hype_index, 0) AS hype_index,
    COALESCE(reviews_count, 0) AS reviews_count,
    emotional_cloud,
    perception_map,
    created_at
  FROM content
  WHERE (p_query IS NULL OR title LIKE CONCAT('%', p_query, '%'))
    AND (p_content_type IS NULL OR content_type = p_content_type)
  ORDER BY created_at DESC
  LIMIT v_limit;
END$$


-- Процедура: Получить детали контента (ID=123) для посетителя
DROP PROCEDURE IF EXISTS get_content_details$$
CREATE PROCEDURE get_content_details(IN p_content_id INT)
BEGIN
  SELECT 
    c.*,
    (SELECT COUNT(*) FROM reviews WHERE content_id = c.id) AS total_reviews
  FROM content c
  WHERE c.id = p_content_id;
END$$


-- Процедура: Получить эмоциональное облако для графика (chart.js)
-- Возвращает JSON {joy: 50, sadness: 20, ...}
DROP PROCEDURE IF EXISTS get_emotional_cloud_chart$$
CREATE PROCEDURE get_emotional_cloud_chart(IN p_content_id INT)
BEGIN
  DECLARE v_cloud JSON;
  
  SELECT emotional_cloud INTO v_cloud
  FROM content
  WHERE id = p_content_id;
  
  -- Если NULL, вернём пустой объект
  IF v_cloud IS NULL THEN
    SET v_cloud = JSON_OBJECT();
  END IF;
  
  SELECT v_cloud AS emotional_cloud;
END$$


-- Процедура: Получить карту восприятия для графика
-- {plot: 8.5, acting: 9.0, visuals: 7.8, ...}
DROP PROCEDURE IF EXISTS get_perception_map_chart$$
CREATE PROCEDURE get_perception_map_chart(IN p_content_id INT)
BEGIN
  DECLARE v_map JSON;
  
  SELECT perception_map INTO v_map
  FROM content
  WHERE id = p_content_id;
  
  IF v_map IS NULL THEN
    SET v_map = JSON_OBJECT();
  END IF;
  
  SELECT v_map AS perception_map;
END$$


-- Процедура: Создать пользователя (регистрация) — [0.05сУ]
-- Возвращает user_id
DROP PROCEDURE IF EXISTS create_user$$
CREATE PROCEDURE create_user(
  IN p_username VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_role VARCHAR(50)
)
BEGIN
  DECLARE v_existing INT DEFAULT 0;
  
  -- Проверить, существует ли пользователь
  SELECT COUNT(*) INTO v_existing
  FROM users
  WHERE username = p_username OR email = p_email;
  
  IF v_existing > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Username or email already exists';
  END IF;
  
  -- Вставить пользователя
  INSERT INTO users (username, email, password, role, created_at, updated_at)
  VALUES (p_username, p_email, p_password_hash, COALESCE(p_role, 'USER'), NOW(), NOW());
  
  SET @new_user_id = LAST_INSERT_ID();
  
  SELECT @new_user_id AS user_id, 'User created' AS status;
END$$


-- Триггер: После создания пользователя -> создать запись в user_preferences
DROP TRIGGER IF EXISTS after_user_created$$
CREATE TRIGGER after_user_created
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  -- Создать дефолтные настройки (если есть таблица user_preferences)
  -- INSERT INTO user_preferences (user_id, theme, language) VALUES (NEW.id, 'dark', 'en');
  
  -- Можно также отправить welcome notification
  INSERT INTO notifications (user_id, type, payload, created_at)
  VALUES (NEW.id, 'welcome', JSON_OBJECT('message', 'Welcome to Movie Aggregator!'), NOW());
END$$

DELIMITER ;

-- =============================================
-- Примеры использования:
-- =============================================

-- 1. Поиск контента (посетитель)
-- CALL after_search('Matrix', 'MOVIE', 10);

-- 2. Получить детали контента
-- CALL get_content_details(1);

-- 3. Получить эмоциональное облако для графика
-- CALL get_emotional_cloud_chart(1);

-- 4. Получить карту восприятия
-- CALL get_perception_map_chart(1);

-- 5. Регистрация нового пользователя
-- CALL create_user('johndoe', 'john@example.com', '$2b$10$hashedpassword', 'USER');
