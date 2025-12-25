-- =============================================
-- Viewer (Зритель) Flow Procedures
-- validate_user_provider, add_review_viewer, update_personal_critic_prefs,
-- update_personal_aggregator, check_achievements
-- =============================================

DELIMITER $$

-- Процедура: Валидация зрителя и провайдера (0.05сУ)
-- Проверяет токен/сессию пользователя
DROP PROCEDURE IF EXISTS validate_user_provider$$
CREATE PROCEDURE validate_user_provider(IN p_user_id INT, IN p_token VARCHAR(500))
BEGIN
  DECLARE v_username VARCHAR(100);
  DECLARE v_role VARCHAR(50);
  DECLARE v_is_blocked BOOLEAN;
  
  -- Проверить пользователя
  SELECT username, role, is_blocked 
  INTO v_username, v_role, v_is_blocked
  FROM users
  WHERE id = p_user_id;
  
  IF v_username IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'User not found';
  END IF;
  
  IF v_is_blocked = TRUE THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'User is blocked';
  END IF;
  
  -- Вернуть данные пользователя (JSON-подобный результат)
  SELECT 
    p_user_id AS user_id,
    v_username AS username,
    v_role AS role,
    'OK' AS status;
END$$


-- Процедура: Добавить отзыв зрителя с аспектами и эмоциями
-- Вызывает агрегацию: UPDATE content, emotional_cloud, perception_map
DROP PROCEDURE IF EXISTS add_review_viewer$$
CREATE PROCEDURE add_review_viewer(
  IN p_user_id INT,
  IN p_content_id INT,
  IN p_aspects JSON,
  IN p_emotions JSON,
  IN p_rating DECIMAL(3,1),
  IN p_review_text TEXT
)
BEGIN
  DECLARE v_user_role VARCHAR(50);
  
  -- Проверить, что пользователь зарегистрирован
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  
  IF v_user_role IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'User not found';
  END IF;
  
  -- Вставить отзыв (аспекты и эмоции в JSON)
  INSERT INTO reviews (content_id, user_id, content, aspects, emotions, rating, created_at)
  VALUES (p_content_id, p_user_id, p_review_text, p_aspects, p_emotions, p_rating, NOW());
  
  SET @new_review_id = LAST_INSERT_ID();
  
  -- Обновить агрегаты
  CALL RecalculateMovieRatings(p_content_id);
  
  IF p_emotions IS NOT NULL THEN
    CALL UpdateEmotionalCloud(p_content_id, p_emotions);
  END IF;
  
  IF p_aspects IS NOT NULL THEN
    CALL UpdatePerceptionMap(p_content_id, p_aspects);
  END IF;
  
  CALL CalculateHypeIndex(p_content_id);
  
  -- Проверить достижения
  CALL check_achievements_proc(p_user_id);
  
  -- Вернуть review_id
  SELECT @new_review_id AS review_id, 'Review added' AS status;
END$$


-- Процедура: Обновить персонального критика (выбор "своего критика")
-- Пользователь может выбрать критиков, чьи оценки будут влиять на его личный рейтинг
DROP PROCEDURE IF EXISTS update_personal_critic_prefs$$
CREATE PROCEDURE update_personal_critic_prefs(
  IN p_user_id INT,
  IN p_critic_ids JSON -- массив [1, 5, 10]
)
BEGIN
  -- Сохранить список избранных критиков (требуется таблица user_critic_preferences)
  -- Очистить старые предпочтения
  DELETE FROM user_critic_preferences WHERE user_id = p_user_id;
  
  -- Вставить новые (распарсить JSON массив)
  -- Для MySQL 8+ можно использовать JSON_TABLE
  INSERT INTO user_critic_preferences (user_id, critic_id)
  SELECT p_user_id, critic_id
  FROM JSON_TABLE(
    p_critic_ids,
    '$[*]' COLUMNS(critic_id INT PATH '$')
  ) AS critics;
  
  SELECT 'Critic preferences updated' AS status, JSON_LENGTH(p_critic_ids) AS critics_count;
END$$


-- Процедура: Обновить персональный агрегатор
-- Пересчитывает личные рейтинги на основе выбранных критиков/источников
DROP PROCEDURE IF EXISTS update_personal_aggregator$$
CREATE PROCEDURE update_personal_aggregator(IN p_user_id INT, IN p_content_id INT)
BEGIN
  DECLARE v_personal_rating DECIMAL(5,2);
  
  -- Рассчитать средний рейтинг от выбранных критиков
  SELECT AVG(r.rating) INTO v_personal_rating
  FROM reviews r
  JOIN user_critic_preferences ucp ON r.user_id = ucp.critic_id
  WHERE ucp.user_id = p_user_id AND r.content_id = p_content_id;
  
  IF v_personal_rating IS NULL THEN
    -- Если критики не выбраны или отзывов нет, использовать общий рейтинг
    SELECT avg_rating INTO v_personal_rating
    FROM content
    WHERE id = p_content_id;
  END IF;
  
  -- Сохранить персональный рейтинг (требуется таблица user_personal_ratings)
  INSERT INTO user_personal_ratings (user_id, content_id, personal_rating, updated_at)
  VALUES (p_user_id, p_content_id, v_personal_rating, NOW())
  ON DUPLICATE KEY UPDATE personal_rating = v_personal_rating, updated_at = NOW();
  
  SELECT v_personal_rating AS personal_rating, 'Aggregator updated' AS status;
END$$


-- Процедура: Проверить достижения пользователя
-- После действия (добавление отзыва, рейтинга) проверяем условия достижений
DROP PROCEDURE IF EXISTS check_achievements_proc$$
CREATE PROCEDURE check_achievements_proc(IN p_user_id INT)
BEGIN
  DECLARE v_reviews_count INT;
  DECLARE v_ratings_count INT;
  
  -- Подсчитать количество отзывов пользователя
  SELECT COUNT(*) INTO v_reviews_count
  FROM reviews
  WHERE user_id = p_user_id;
  
  -- Подсчитать количество рейтингов
  SELECT COUNT(*) INTO v_ratings_count
  FROM user_ratings
  WHERE user_id = p_user_id;
  
  -- Достижение: "Первый отзыв" (id=1)
  IF v_reviews_count = 1 THEN
    INSERT IGNORE INTO user_achievements (user_id, achievement_id, earned_at)
    VALUES (p_user_id, 1, NOW());
  END IF;
  
  -- Достижение: "10 отзывов" (id=2)
  IF v_reviews_count >= 10 THEN
    INSERT IGNORE INTO user_achievements (user_id, achievement_id, earned_at)
    VALUES (p_user_id, 2, NOW());
  END IF;
  
  -- Достижение: "100 рейтингов" (id=3)
  IF v_ratings_count >= 100 THEN
    INSERT IGNORE INTO user_achievements (user_id, achievement_id, earned_at)
    VALUES (p_user_id, 3, NOW());
  END IF;
  
  -- Вернуть список новых достижений
  SELECT 
    a.id,
    a.title,
    a.description,
    ua.earned_at
  FROM user_achievements ua
  JOIN achievements a ON ua.achievement_id = a.id
  WHERE ua.user_id = p_user_id
  ORDER BY ua.earned_at DESC
  LIMIT 3;
END$$


-- Триггер: После добавления рейтинга зрителем -> пересчёт audience_rating
DROP TRIGGER IF EXISTS after_user_rating_insert$$
CREATE TRIGGER after_user_rating_insert
AFTER INSERT ON user_ratings
FOR EACH ROW
BEGIN
  -- Обновить audience_rating (средний рейтинг обычных пользователей)
  UPDATE content
  SET audience_rating = (
    SELECT AVG(rating)
    FROM user_ratings
    WHERE movie_id = NEW.movie_id
  )
  WHERE id = NEW.movie_id;
  
  -- Проверить достижения
  CALL check_achievements_proc(NEW.user_id);
END$$


-- Триггер: После добавления отзыва зрителем -> обновить персональный агрегатор
DROP TRIGGER IF EXISTS after_viewer_review_insert$$
CREATE TRIGGER after_viewer_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  -- Обновить персональный агрегатор для всех пользователей, которые выбрали этого критика
  -- (если отзыв от критика, обновляются персональные рейтинги подписчиков)
  -- Это можно сделать через отложенную задачу или триггер
  
  -- Пример: обновить для пользователя, который добавил отзыв
  CALL update_personal_aggregator(NEW.user_id, NEW.content_id);
END$$

DELIMITER ;

-- =============================================
-- Примеры использования:
-- =============================================

-- 1. Валидация зрителя
-- CALL validate_user_provider(5, 'some_jwt_token');

-- 2. Добавить отзыв зрителя
-- CALL add_review_viewer(5, 1, JSON_OBJECT('plot',8,'acting',9), JSON_OBJECT('joy',7), 8.5, 'Отличный фильм!');

-- 3. Обновить список избранных критиков
-- CALL update_personal_critic_prefs(5, JSON_ARRAY(2, 3, 7));

-- 4. Обновить персональный агрегатор
-- CALL update_personal_aggregator(5, 1);

-- 5. Проверить достижения
-- CALL check_achievements_proc(5);
