-- =============================================
-- Admin Flow Procedures (Диаграмма Админа)
-- validate_critic, block_user_provider, manage reviews/content
-- =============================================

DELIMITER $$

-- Процедура: Валидация критика (0.1сУ)
-- Проверяет данные критика и обновляет статус
DROP PROCEDURE IF EXISTS validate_critic$$
CREATE PROCEDURE validate_critic(
  IN p_user_id INT,
  IN p_admin_id INT,
  IN p_approved BOOLEAN
)
BEGIN
  DECLARE v_current_role VARCHAR(50);
  
  -- Проверить, является ли пользователь критиком (pending)
  SELECT role INTO v_current_role
  FROM users
  WHERE id = p_user_id;
  
  IF v_current_role IS NULL THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'User not found';
  END IF;
  
  IF p_approved = TRUE THEN
    -- Одобрить критика
    UPDATE users
    SET role = 'CRITIC',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Логировать действие админа (опционально - требуется таблица admin_logs)
    -- INSERT INTO admin_logs (admin_id, action, target_user_id, created_at)
    -- VALUES (p_admin_id, 'APPROVE_CRITIC', p_user_id, NOW());
    
    SELECT 'Critic approved' AS status, p_user_id AS user_id;
  ELSE
    -- Отклонить (можно удалить или пометить)
    UPDATE users
    SET role = 'USER'
    WHERE id = p_user_id;
    
    SELECT 'Critic rejected' AS status, p_user_id AS user_id;
  END IF;
END$$


-- Процедура: Блокировка пользователя/провайдера
-- permanentOrTemp: 'permanent' | 'temp'
DROP PROCEDURE IF EXISTS block_user_provider$$
CREATE PROCEDURE block_user_provider(
  IN p_target_id INT,
  IN p_target_type ENUM('user', 'provider'),
  IN p_admin_id INT,
  IN p_reason TEXT,
  IN p_permanent_or_temp VARCHAR(20)
)
BEGIN
  IF p_target_type = 'user' THEN
    -- Заблокировать пользователя
    UPDATE users
    SET is_blocked = TRUE,
        block_reason = p_reason,
        blocked_until = IF(p_permanent_or_temp = 'permanent', NULL, DATE_ADD(NOW(), INTERVAL 30 DAY)),
        updated_at = NOW()
    WHERE id = p_target_id;
    
    SELECT 'User blocked' AS status, p_target_id AS target_id;
    
  ELSEIF p_target_type = 'provider' THEN
    -- Заблокировать провайдера (требуется таблица providers)
    -- UPDATE providers SET is_blocked = TRUE WHERE id = p_target_id;
    SELECT 'Provider blocking not implemented (table missing)' AS status;
  END IF;
END$$


-- Процедура: Триггер для управления отзывами (админ может удалить отзыв)
-- DELETE reviews -> перерасчёт счётчиков
DROP PROCEDURE IF EXISTS admin_delete_review$$
CREATE PROCEDURE admin_delete_review(
  IN p_review_id INT,
  IN p_admin_id INT,
  IN p_reason TEXT
)
BEGIN
  DECLARE v_movie_id INT;
  DECLARE v_user_id INT;
  
  -- Получить movie_id и user_id перед удалением
  SELECT movie_id, user_id INTO v_movie_id, v_user_id
  FROM reviews
  WHERE id = p_review_id;
  
  IF v_movie_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Review not found';
  END IF;
  
  -- Удалить отзыв
  DELETE FROM reviews WHERE id = p_review_id;
  
  -- Пересчитать агрегаты для фильма
  CALL RecalculateMovieRatings(v_movie_id);
  CALL CalculateHypeIndex(v_movie_id);
  
  -- Логирование (опционально)
  -- INSERT INTO admin_logs (admin_id, action, details) VALUES (...);
  
  SELECT 'Review deleted and aggregates recalculated' AS status, v_movie_id AS movie_id;
END$$


-- Процедура: Триггер для обновления контента (UPDATE content SET ...)
DROP PROCEDURE IF EXISTS admin_update_content$$
CREATE PROCEDURE admin_update_content(
  IN p_content_id INT,
  IN p_admin_id INT,
  IN p_title VARCHAR(255),
  IN p_release_year INT,
  IN p_genre VARCHAR(100)
)
BEGIN
  UPDATE content
  SET title = COALESCE(p_title, title),
      release_year = COALESCE(p_release_year, release_year),
      genre = COALESCE(p_genre, genre),
      updated_at = NOW()
  WHERE id = p_content_id;
  
  SELECT ROW_COUNT() AS updated_rows, p_content_id AS content_id;
END$$


-- Триггер: после блокировки пользователя удалить активные сессии (опционально)
-- Требует таблицы user_sessions
DROP TRIGGER IF EXISTS after_user_blocked$$
CREATE TRIGGER after_user_blocked
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.is_blocked = TRUE AND OLD.is_blocked = FALSE THEN
    -- Удалить активные токены/сессии (если есть таблица sessions)
    -- DELETE FROM user_sessions WHERE user_id = NEW.id;
    
    -- Можно логировать
    -- INSERT INTO system_logs (event, user_id, timestamp) VALUES ('USER_BLOCKED', NEW.id, NOW());
    SET @dummy = 1; -- заглушка, если нет таблиц
  END IF;
END$$

DELIMITER ;

-- =============================================
-- Примеры использования (тестовые вызовы):
-- =============================================

-- 1. Одобрить критика
-- CALL validate_critic(5, 1, TRUE);

-- 2. Заблокировать пользователя временно
-- CALL block_user_provider(10, 'user', 1, 'Spam reviews', 'temp');

-- 3. Удалить отзыв (админ)
-- CALL admin_delete_review(123, 1, 'Inappropriate content');

-- 4. Обновить информацию о контенте
-- CALL admin_update_content(1, 1, 'Updated Movie Title', 2024, 'Drama');
