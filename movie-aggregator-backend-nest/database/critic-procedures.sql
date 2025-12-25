-- =============================================
-- Critic Flow Procedures (Диаграмма Критика)
-- get_aggregation_proc, publish_pro_review, get_emotional_cloud, dynamics, hype_alert
-- =============================================

DELIMITER $$

-- Процедура: Получить агрегацию по контенту (0.05сУ)
-- Возвращает средние рейтинги, отзывы, эмоции
DROP PROCEDURE IF EXISTS get_aggregation_proc$$
CREATE PROCEDURE get_aggregation_proc(
  IN p_content_id INT,
  IN p_query VARCHAR(255) -- например "Wicher" для поиска
)
BEGIN
  -- Возвращаем детали контента + агрегированные данные
  SELECT 
    c.id,
    c.title,
    c.content_type,
    c.release_year,
    c.genre,
    COALESCE(c.avg_rating, 0) AS avg_rating,
    COALESCE(c.critics_rating, 0) AS critics_rating,
    COALESCE(c.audience_rating, 0) AS audience_rating,
    COALESCE(c.hype_index, 0) AS hype_index,
    COALESCE(c.reviews_count, 0) AS reviews_count,
    c.emotional_cloud,
    c.perception_map
  FROM content c
  WHERE c.id = p_content_id
     OR (p_query IS NOT NULL AND c.title LIKE CONCAT('%', p_query, '%'))
  LIMIT 1;
END$$


-- Процедура: Опубликовать профессиональный отзыв критика (0.1сУ)
-- Вставляет отзыв + обновляет critics_rating
DROP PROCEDURE IF EXISTS publish_pro_review$$
CREATE PROCEDURE publish_pro_review(
  IN p_content_id INT,
  IN p_user_id INT,
  IN p_review_text TEXT,
  IN p_aspects JSON,
  IN p_emotions JSON,
  IN p_rating DECIMAL(3,1)
)
BEGIN
  DECLARE v_user_role VARCHAR(50);
  
  -- Проверить, что пользователь — критик
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  
  IF v_user_role != 'CRITIC' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Only critics can publish pro reviews';
  END IF;
  
  -- Вставить отзыв
  INSERT INTO reviews (content_id, user_id, content, aspects, emotions, rating, created_at)
  VALUES (p_content_id, p_user_id, p_review_text, p_aspects, p_emotions, p_rating, NOW());
  
  SET @new_review_id = LAST_INSERT_ID();
  
  -- Обновить critics_rating (средний рейтинг от критиков)
  UPDATE content
  SET critics_rating = (
    SELECT AVG(r.rating)
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.content_id = p_content_id AND u.role = 'CRITIC'
  ),
  reviews_count = reviews_count + 1
  WHERE id = p_content_id;
  
  -- Обновить эмоциональное облако и карту восприятия
  IF p_emotions IS NOT NULL THEN
    CALL UpdateEmotionalCloud(p_content_id, p_emotions);
  END IF;
  
  IF p_aspects IS NOT NULL THEN
    CALL UpdatePerceptionMap(p_content_id, p_aspects);
  END IF;
  
  -- Пересчитать hype_index
  CALL CalculateHypeIndex(p_content_id);
  
  -- Вернуть review_id
  SELECT @new_review_id AS review_id, 'Review published' AS status;
END$$


-- Процедура: Получить эмоциональное облако (JSON)
DROP PROCEDURE IF EXISTS get_emotional_cloud$$
CREATE PROCEDURE get_emotional_cloud(IN p_content_id INT)
BEGIN
  SELECT emotional_cloud
  FROM content
  WHERE id = p_content_id;
END$$


-- Процедура: Получить карту восприятия (аспекты)
DROP PROCEDURE IF EXISTS get_perception_map$$
CREATE PROCEDURE get_perception_map(IN p_content_id INT)
BEGIN
  SELECT perception_map
  FROM content
  WHERE id = p_content_id;
END$$


-- Процедура: Получить динамику рейтингов (график [0..25])
-- Возвращает изменение avg_rating со временем
DROP PROCEDURE IF EXISTS get_dynamics_graph$$
CREATE PROCEDURE get_dynamics_graph(IN p_content_id INT)
BEGIN
  -- Группируем отзывы по неделям и считаем средний рейтинг
  SELECT 
    DATE_FORMAT(created_at, '%Y-%m-%d') AS review_date,
    AVG(rating) AS avg_rating_on_date,
    COUNT(*) AS reviews_count
  FROM reviews
  WHERE content_id = p_content_id
  GROUP BY review_date
  ORDER BY review_date ASC
  LIMIT 25; -- top-25 точек для графика
END$$


-- Процедура: Проверить хайп-индекс и отправить алерт (если hype > 90)
DROP PROCEDURE IF EXISTS trigger_hype_alert$$
CREATE PROCEDURE trigger_hype_alert(IN p_content_id INT)
BEGIN
  DECLARE v_hype INT;
  
  SELECT hype_index INTO v_hype
  FROM content
  WHERE id = p_content_id;
  
  IF v_hype >= 90 THEN
    -- Триггерим алерт: можно отправить уведомления всем критикам
    INSERT INTO notifications (user_id, type, payload, created_at)
    SELECT u.id, 'hype_alert', JSON_OBJECT('content_id', p_content_id, 'hype_index', v_hype), NOW()
    FROM users u
    WHERE u.role = 'CRITIC';
    
    SELECT 'Hype alert sent to critics' AS status, v_hype AS hype_index;
  ELSE
    SELECT 'No alert needed' AS status, v_hype AS hype_index;
  END IF;
END$$


-- Триггер: После вставки профессионального отзыва -> обновить график динамики
-- (автоматически пересчитываем avg_rating)
DROP TRIGGER IF EXISTS after_pro_review_insert$$
CREATE TRIGGER after_pro_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  DECLARE v_user_role VARCHAR(50);
  
  SELECT role INTO v_user_role FROM users WHERE id = NEW.user_id;
  
  -- Если это критик, пересчитываем critics_rating
  IF v_user_role = 'CRITIC' THEN
    UPDATE content
    SET critics_rating = (
      SELECT AVG(r.rating)
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.content_id = NEW.content_id AND u.role = 'CRITIC'
    )
    WHERE id = NEW.content_id;
  END IF;
  
  -- Проверяем хайп
  CALL trigger_hype_alert(NEW.content_id);
END$$

DELIMITER ;

-- =============================================
-- Примеры использования:
-- =============================================

-- 1. Получить агрегацию по фильму id=1
-- CALL get_aggregation_proc(1, NULL);

-- 2. Опубликовать профессиональный отзыв (критик user_id=2)
-- CALL publish_pro_review(1, 2, 'Отличный фильм!', JSON_OBJECT('plot',9,'acting',8), JSON_OBJECT('joy',8), 8.5);

-- 3. Получить эмоциональное облако
-- CALL get_emotional_cloud(1);

-- 4. Получить динамику рейтингов
-- CALL get_dynamics_graph(1);

-- 5. Проверить хайп-алерт
-- CALL trigger_hype_alert(1);
