-- =============================================
-- ТРИГГЕРЫ И ХРАНИМЫЕ ПРОЦЕДУРЫ ДЛЯ WAREHOUSE
-- =============================================

DELIMITER $$

-- ============================================
-- ТРИГГЕР 1: Автообновление счётчика отзывов пользователя
-- ============================================
DROP TRIGGER IF EXISTS after_review_insert$$
CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE users
    SET total_reviews = total_reviews + 1
    WHERE id = NEW.user_id;
END$$

DROP TRIGGER IF EXISTS after_review_delete$$
CREATE TRIGGER after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE users
    SET total_reviews = GREATEST(0, total_reviews - 1)
    WHERE id = OLD.user_id;
END$$

-- ============================================
-- ТРИГГЕР 2: Автообновление счётчика рейтингов пользователя
-- ============================================
DROP TRIGGER IF EXISTS after_rating_insert$$
CREATE TRIGGER after_rating_insert
AFTER INSERT ON user_ratings
FOR EACH ROW
BEGIN
    UPDATE users
    SET total_ratings = total_ratings + 1
    WHERE id = NEW.user_id;
END$$

DROP TRIGGER IF EXISTS after_rating_delete$$
CREATE TRIGGER after_rating_delete
AFTER DELETE ON user_ratings
FOR EACH ROW
BEGIN
    UPDATE users
    SET total_ratings = GREATEST(0, total_ratings - 1)
    WHERE id = OLD.user_id;
END$$

-- ============================================
-- ТРИГГЕР 3: Автообновление счётчика отзывов фильма
-- ============================================
DROP TRIGGER IF EXISTS update_movie_review_count_insert$$
CREATE TRIGGER update_movie_review_count_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE movies
    SET reviews_count = reviews_count + 1
    WHERE id = NEW.movie_id;
END$$

DROP TRIGGER IF EXISTS update_movie_review_count_delete$$
CREATE TRIGGER update_movie_review_count_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE movies
    SET reviews_count = GREATEST(0, reviews_count - 1)
    WHERE id = OLD.movie_id;
END$$

-- ============================================
-- ТРИГГЕР 4: Обновление даты последнего входа
-- ============================================
DROP TRIGGER IF EXISTS update_last_login$$
CREATE TRIGGER update_last_login
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.last_login IS NOT NULL AND NEW.last_login != OLD.last_login THEN
        SET NEW.last_login = NOW();
    END IF;
END$$


-- ============================================
-- ХРАНИМАЯ ПРОЦЕДУРА 1: Получить топ пользователей по репутации
-- ============================================
DROP PROCEDURE IF EXISTS GetTopUsersByReputation$$
CREATE PROCEDURE GetTopUsersByReputation(IN limit_count INT)
BEGIN
    SELECT 
        id,
        username,
        email,
        role,
        level,
        reputation,
        total_reviews,
        total_ratings,
        registration_date
    FROM users
    WHERE is_active = TRUE
    ORDER BY reputation DESC
    LIMIT limit_count;
END$$

-- ============================================
-- ХРАНИМАЯ ПРОЦЕДУРА 2: Получить статистику по контенту
-- ============================================
DROP PROCEDURE IF EXISTS GetContentStatistics$$
CREATE PROCEDURE GetContentStatistics(IN content_id INT)
BEGIN
    SELECT 
        m.id,
        m.title,
        m.content_type,
        m.overall_rating,
        m.critics_rating,
        m.audience_rating,
        m.reviews_count,
        COUNT(DISTINCT ur.id) as ratings_count,
        AVG(ur.rating) as avg_user_rating,
        m.hype_index
    FROM movies m
    LEFT JOIN user_ratings ur ON m.id = ur.movie_id
    WHERE m.id = content_id
    GROUP BY m.id;
END$$

-- ============================================
-- ХРАНИМАЯ ПРОЦЕДУРА 3: Удалить пользователя и его связи (для админа)
-- ============================================
DROP PROCEDURE IF EXISTS DeleteUserWithRelations$$
CREATE PROCEDURE DeleteUserWithRelations(IN user_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Unable to delete user' AS message;
    END;
    
    START TRANSACTION;
    
    -- Удаляем связанные данные
    DELETE FROM user_achievements WHERE user_id = user_id;
    DELETE FROM user_follows WHERE follower_id = user_id OR followed_id = user_id;
    DELETE FROM user_ratings WHERE user_id = user_id;
    DELETE FROM reviews WHERE user_id = user_id;
    
    -- Удаляем пользователя
    DELETE FROM users WHERE id = user_id;
    
    COMMIT;
    SELECT 'User deleted successfully' AS message;
END$$

-- ============================================
-- ХРАНИМАЯ ПРОЦЕДУРА 4: Обновить рейтинги фильма
-- ============================================
DROP PROCEDURE IF EXISTS RecalculateMovieRatings$$
CREATE PROCEDURE RecalculateMovieRatings(IN movie_id INT)
BEGIN
    UPDATE movies m
    SET 
        overall_rating = (
            SELECT ROUND(AVG(rating), 1)
            FROM user_ratings
            WHERE movie_id = m.id
        ),
        audience_rating = (
            SELECT ROUND(AVG(rating), 1)
            FROM user_ratings ur
            JOIN users u ON ur.user_id = u.id
            WHERE ur.movie_id = m.id AND u.role = 'USER'
        ),
        critics_rating = (
            SELECT ROUND(AVG(rating), 1)
            FROM user_ratings ur
            JOIN users u ON ur.user_id = u.id
            WHERE ur.movie_id = m.id AND u.role = 'CRITIC'
        )
    WHERE m.id = movie_id;
END$$

-- ============================================
-- ХРАНИМАЯ ПРОЦЕДУРА 5: Получить активность пользователя
-- ============================================
DROP PROCEDURE IF EXISTS GetUserActivity$$
CREATE PROCEDURE GetUserActivity(IN user_id INT)
BEGIN
    SELECT 
        'Reviews' as activity_type,
        COUNT(*) as count,
        MAX(created_at) as last_activity
    FROM reviews
    WHERE user_id = user_id
    
    UNION ALL
    
    SELECT 
        'Ratings' as activity_type,
        COUNT(*) as count,
        MAX(created_at) as last_activity
    FROM user_ratings
    WHERE user_id = user_id
    
    UNION ALL
    
    SELECT 
        'Achievements' as activity_type,
        COUNT(*) as count,
        MAX(earned_at) as last_activity
    FROM user_achievements
    WHERE user_id = user_id AND is_completed = TRUE;
END$$

-- ============================================
-- ХРАНИМАЯ ПРОЦЕДУРА 6: Получить список пользователей для модерации
-- ============================================
DROP PROCEDURE IF EXISTS GetUsersForModeration$$
CREATE PROCEDURE GetUsersForModeration(IN role_filter VARCHAR(20))
BEGIN
    IF role_filter IS NULL OR role_filter = '' THEN
        SELECT 
            id,
            username,
            email,
            role,
            level,
            reputation,
            total_reviews,
            total_ratings,
            is_active,
            is_verified,
            registration_date,
            last_login
        FROM users
        ORDER BY registration_date DESC;
    ELSE
        SELECT 
            id,
            username,
            email,
            role,
            level,
            reputation,
            total_reviews,
            total_ratings,
            is_active,
            is_verified,
            registration_date,
            last_login
        FROM users
        WHERE role = role_filter
        ORDER BY registration_date DESC;
    END IF;
END$$

-- ============================================
-- ХРАНИМАЯ ПРОЦЕДУРА 7: Обновить статус пользователя (бан/разбан)
-- ============================================
DROP PROCEDURE IF EXISTS UpdateUserStatus$$
CREATE PROCEDURE UpdateUserStatus(
    IN user_id INT,
    IN new_status BOOLEAN
)
BEGIN
    UPDATE users
    SET is_active = new_status
    WHERE id = user_id;
    
    SELECT 
        id,
        username,
        is_active,
        'Status updated successfully' as message
    FROM users
    WHERE id = user_id;
END$$

-- ============================================
-- ХРАНИМАЯ ПРОЦЕДУРА 8: Повысить/понизить роль пользователя
-- ============================================
DROP PROCEDURE IF EXISTS UpdateUserRole$$
CREATE PROCEDURE UpdateUserRole(
    IN user_id INT,
    IN new_role VARCHAR(20)
)
BEGIN
    IF new_role IN ('USER', 'CRITIC', 'ADMIN') THEN
        UPDATE users
        SET role = new_role
        WHERE id = user_id;
        
        SELECT 
            id,
            username,
            role,
            'Role updated successfully' as message
        FROM users
        WHERE id = user_id;
    ELSE
        SELECT 'Error: Invalid role' as message;
    END IF;
END$$

DELIMITER ;

-- ============================================
-- ТЕСТИРОВАНИЕ ПРОЦЕДУР
-- ============================================
-- CALL GetTopUsersByReputation(10);
-- CALL GetContentStatistics(1);
-- CALL GetUserActivity(1);
-- CALL GetUsersForModeration(NULL);
-- CALL UpdateUserStatus(1, FALSE);
-- CALL UpdateUserRole(1, 'CRITIC');
-- CALL RecalculateMovieRatings(1);
