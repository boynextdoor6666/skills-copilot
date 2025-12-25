
-- Triggers & Stored Procedures for Registered Viewer (зритель)
-- Adds: save_review_proc, UpdateEmotionalCloud, UpdatePerceptionMap,
--       CalculateHypeIndex, NotifySubscribersNewReview, after_review_enhanced trigger
-- =============================================

DELIMITER $$

-- ХРАНИМАЯ ПРОЦЕДУРА: Сохранить отзыв и запустить последовательность агрегаций
DROP PROCEDURE IF EXISTS save_review_proc$$
CREATE PROCEDURE save_review_proc(
  IN p_content TEXT,
  IN p_aspects JSON,
  IN p_emotions JSON,
  IN p_movie_id INT,
  IN p_user_id INT
)
BEGIN
  -- Вставляем отзыв
  INSERT INTO reviews (content, aspects, emotions, movie_id, user_id, created_at)
  VALUES (p_content, p_aspects, p_emotions, p_movie_id, p_user_id, NOW());

  -- Получаем id созданного отзыва
  SET @new_review_id = LAST_INSERT_ID();

  -- Обновляем агрегаты и вспомогательные структуры
  CALL RecalculateMovieRatings(p_movie_id);
  CALL UpdateEmotionalCloud(p_movie_id, p_emotions);
  CALL UpdatePerceptionMap(p_movie_id, p_aspects);
  CALL CalculateHypeIndex(p_movie_id);

  -- Уведомления подписчиков о новом отзыве
  CALL NotifySubscribersNewReview(p_movie_id, @new_review_id);

  -- Вернуть id созданного отзыва
  SELECT @new_review_id AS review_id;
END$$


-- ХРАНИМАЯ ПРОЦЕДУРА: Обновить эмоциональное облако (JSON merge)
DROP PROCEDURE IF EXISTS UpdateEmotionalCloud$$
CREATE PROCEDURE UpdateEmotionalCloud(IN p_movie_id INT, IN p_emotions JSON)
BEGIN
  -- Если поле emotional_cloud отсутствует или NULL, просто вставим
  UPDATE movies
  SET emotional_cloud = JSON_MERGE_PATCH(COALESCE(emotional_cloud, JSON_OBJECT()), COALESCE(p_emotions, JSON_OBJECT()))
  WHERE id = p_movie_id;
END$$


-- ХРАНИМАЯ ПРОЦЕДУРА: Обновить карту восприятия / аспектную карту (JSON merge)
DROP PROCEDURE IF EXISTS UpdatePerceptionMap$$
CREATE PROCEDURE UpdatePerceptionMap(IN p_movie_id INT, IN p_aspects JSON)
BEGIN
  UPDATE movies
  SET perception_map = JSON_MERGE_PATCH(COALESCE(perception_map, JSON_OBJECT()), COALESCE(p_aspects, JSON_OBJECT()))
  WHERE id = p_movie_id;
END$$


-- ХРАНИМАЯ ПРОЦЕДУРА: Рассчитать/обновить hype_index для фильма
DROP PROCEDURE IF EXISTS CalculateHypeIndex$$
CREATE PROCEDURE CalculateHypeIndex(IN p_movie_id INT)
BEGIN
  DECLARE v_reviews INT DEFAULT 0;
  DECLARE v_ratings INT DEFAULT 0;
  DECLARE v_recent_reviews INT DEFAULT 0;
  DECLARE v_hype INT DEFAULT 0;

  SELECT COUNT(*) INTO v_reviews FROM reviews WHERE movie_id = p_movie_id;
  SELECT COUNT(*) INTO v_ratings FROM user_ratings WHERE movie_id = p_movie_id;
  SELECT COUNT(*) INTO v_recent_reviews FROM reviews WHERE movie_id = p_movie_id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

  -- Простая формула hype: комбинация общего числа отзывов, оценок и активности за неделю
  SET v_hype = LEAST(100, (v_reviews * 2) + v_ratings + (v_recent_reviews * 5));

  UPDATE movies
  SET hype_index = v_hype
  WHERE id = p_movie_id;
END$$


-- ХРАНИМАЯ ПРОЦЕДУРА: Уведомить подписчиков о новом отзыве
DROP PROCEDURE IF EXISTS NotifySubscribersNewReview$$
CREATE PROCEDURE NotifySubscribersNewReview(IN p_movie_id INT, IN p_review_id INT)
BEGIN
  -- Предполагается наличие таблиц subscriptions(subscriber_id, movie_id) и notifications(user_id, review_id, message, created_at)
  INSERT INTO notifications (user_id, review_id, message, created_at)
  SELECT s.subscriber_id, p_review_id,
         CONCAT('Новый отзыв на фильм "', COALESCE(m.title, ''), '"'), NOW()
  FROM subscriptions s
  LEFT JOIN movies m ON m.id = s.movie_id
  WHERE s.movie_id = p_movie_id;
END$$


-- ТРИГГЕР: После вставки отзыва — запустить пересчёты и уведомления (дополнительный к существующим)
DROP TRIGGER IF EXISTS after_review_enhanced$$
CREATE TRIGGER after_review_enhanced
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  -- Пересчитать рейтинги фильма
  CALL RecalculateMovieRatings(NEW.movie_id);

  -- Обновить hype index
  CALL CalculateHypeIndex(NEW.movie_id);

  -- Обновить эмоциональное облако и карту восприятия, если данные пришли в колонках reviews
  IF NEW.emotions IS NOT NULL THEN
    CALL UpdateEmotionalCloud(NEW.movie_id, NEW.emotions);
  END IF;

  IF NEW.aspects IS NOT NULL THEN
    CALL UpdatePerceptionMap(NEW.movie_id, NEW.aspects);
  END IF;

  -- Уведомить подписчиков
  CALL NotifySubscribersNewReview(NEW.movie_id, NEW.id);
END$$

DELIMITER ;
