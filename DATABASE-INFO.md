# 📊 База данных MySQL "warehouse" для CinemaHub

## 🎯 Краткое описание

**Название БД:** `warehouse`  
**СУБД:** MySQL 8.0  
**Кодировка:** UTF-8 (utf8mb4)  
**Назначение:** Хранение данных агрегатора фильмов, сериалов и игр с системой рейтингов в стиле Metacritic

---

## 📋 Структура базы данных

### Основные сущности

#### 1️⃣ Пользователи (`users`)
- **id** - Уникальный идентификатор
- **username** - Имя пользователя (уникальное)
- **email** - Email (уникальный)
- **password** - Пароль (BCrypt хеш)
- **role** - Роль (USER, ADMIN, CRITIC)
- **level** - Уровень (NOVICE, ENTHUSIAST, EXPERT, LEGEND)
- **reputation** - Репутация пользователя
- **total_reviews** - Количество рецензий
- **total_ratings** - Количество оценок

**Индексы:** username, email, role, level

#### 2️⃣ Контент (`movies`)
Хранит фильмы, сериалы и игры
- **id** - Уникальный идентификатор
- **title** - Название
- **content_type** - Тип (MOVIE, SERIES, GAME)
- **description** - Описание
- **release_date** - Дата выхода
- **metascore** - Оценка критиков (0-100)
- **user_score** - Средняя оценка пользователей (0-10)
- **critic_score** - Средняя оценка профессиональных критиков
- **total_ratings** - Количество оценок
- **total_reviews** - Количество рецензий
- **director**, **cast**, **studio** - Метаданные

**Индексы:** title, content_type, release_date, metascore, user_score

#### 3️⃣ Жанры (`movie_genres`)
Связь многие-ко-многим между контентом и жанрами
- **movie_id** - ID контента
- **genre** - Жанр (ACTION, DRAMA, SCI_FI, etc.)

#### 4️⃣ Оценки пользователей (`user_ratings`)
- **user_id** - ID пользователя
- **movie_id** - ID контента
- **rating** - Оценка (0-10)
- **emotion** - Эмоция (EXCITED, HAPPY, INSPIRED, etc.)
- **created_at** - Дата создания

**Ограничения:** Один пользователь = одна оценка на контент  
**Триггеры:** Автоматически обновляет user_score и счётчики

#### 5️⃣ Рецензии (`reviews`)
- **movie_id** - ID контента
- **user_id** - ID пользователя (может быть NULL для внешних критиков)
- **reviewer_name** - Имя рецензента
- **review_type** - Тип (CRITIC, USER)
- **content** - Текст рецензии
- **rating** - Оценка рецензента
- **emotion_tone** - Эмоциональный тон
- **helpful_count** - Количество "полезно"
- **publication** - Издание (для критиков)
- **is_featured** - Избранная рецензия

#### 6️⃣ Достижения (`achievements`)
- **name** - Название достижения
- **type** - Тип (RATING, REVIEW, SOCIAL, SPECIAL)
- **category** - Категория (GENERAL, MOVIES, SERIES, GAMES)
- **points** - Очки репутации
- **requirement_count** - Требуемое количество

#### 7️⃣ Достижения пользователей (`user_achievements`)
- **user_id** - ID пользователя
- **achievement_id** - ID достижения
- **progress** - Прогресс выполнения
- **is_completed** - Выполнено

#### 8️⃣ Подписки (`user_follows`)
- **follower_id** - Кто подписан
- **following_id** - На кого подписан
- **followed_at** - Дата подписки

#### 9️⃣ Список "Хочу посмотреть" (`watchlist`)
- **user_id** - ID пользователя
- **movie_id** - ID контента
- **priority** - Приоритет
- **notes** - Заметки

#### 🔟 История рейтингов (`rating_history`)
Для построения графиков изменения рейтингов
- **movie_id** - ID контента
- **user_score**, **metascore**, **critic_score** - Оценки на момент времени
- **recorded_at** - Дата записи

#### 1️⃣1️⃣ Голоса за рецензии (`review_votes`)
- **review_id** - ID рецензии
- **user_id** - ID пользователя
- **is_helpful** - Полезна ли рецензия

---

## 🔐 Связи и ограничения целостности

### Foreign Keys (внешние ключи)

```
user_ratings.user_id → users.id (ON DELETE CASCADE)
user_ratings.movie_id → movies.id (ON DELETE CASCADE)

reviews.movie_id → movies.id (ON DELETE CASCADE)
reviews.user_id → users.id (ON DELETE SET NULL)

movie_genres.movie_id → movies.id (ON DELETE CASCADE)

user_achievements.user_id → users.id (ON DELETE CASCADE)
user_achievements.achievement_id → achievements.id (ON DELETE CASCADE)

user_follows.follower_id → users.id (ON DELETE CASCADE)
user_follows.following_id → users.id (ON DELETE CASCADE)

watchlist.user_id → users.id (ON DELETE CASCADE)
watchlist.movie_id → movies.id (ON DELETE CASCADE)

rating_history.movie_id → movies.id (ON DELETE CASCADE)

review_votes.review_id → reviews.id (ON DELETE CASCADE)
review_votes.user_id → users.id (ON DELETE CASCADE)
```

### Уникальные ограничения

- `users.username` - UNIQUE
- `users.email` - UNIQUE
- `user_ratings(user_id, movie_id)` - UNIQUE (один пользователь - одна оценка)
- `user_achievements(user_id, achievement_id)` - UNIQUE
- `user_follows(follower_id, following_id)` - UNIQUE
- `watchlist(user_id, movie_id)` - UNIQUE
- `review_votes(review_id, user_id)` - UNIQUE

### CHECK ограничения

- `user_ratings.rating BETWEEN 0 AND 10`
- `user_follows: follower_id != following_id` (нельзя подписаться на себя)

---

## ⚙️ Триггеры и автоматизация

### 1. `after_rating_insert`
**Событие:** После вставки записи в `user_ratings`  
**Действие:**
- Увеличивает `movies.total_ratings` на 1
- Пересчитывает `movies.user_score` как AVG(rating)
- Увеличивает `users.total_ratings` на 1

### 2. `after_rating_delete`
**Событие:** После удаления записи из `user_ratings`  
**Действие:**
- Уменьшает `movies.total_ratings` на 1
- Пересчитывает `movies.user_score`
- Уменьшает `users.total_ratings` на 1

### 3. `after_review_insert`
**Событие:** После вставки записи в `reviews`  
**Действие:**
- Увеличивает `movies.total_reviews` на 1
- Увеличивает `users.total_reviews` на 1 (если user_id не NULL)

### 4. `after_review_delete`
**Событие:** После удаления записи из `reviews`  
**Действие:**
- Уменьшает `movies.total_reviews` на 1
- Уменьшает `users.total_reviews` на 1 (если user_id не NULL)

---

## 📊 Представления (Views)

### 1. `top_movies_by_metascore`
Топ 100 фильмов по Metascore с дополнительной информацией

```sql
SELECT 
    m.id, m.title, m.content_type, m.metascore, 
    m.user_score, m.total_ratings, m.release_date, m.poster_url
FROM movies m
WHERE m.metascore > 0
ORDER BY m.metascore DESC, m.total_ratings DESC
LIMIT 100;
```

### 2. `user_statistics`
Статистика по каждому пользователю

```sql
SELECT 
    u.id, u.username, u.level, u.reputation,
    u.total_reviews, u.total_ratings,
    COUNT(DISTINCT ua.achievement_id) as achievements_earned,
    COUNT(DISTINCT uf.following_id) as following_count,
    COUNT(DISTINCT uf2.follower_id) as followers_count
FROM users u
LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.is_completed = TRUE
LEFT JOIN user_follows uf ON u.id = uf.follower_id
LEFT JOIN user_follows uf2 ON u.id = uf2.following_id
GROUP BY u.id;
```

---

## 📈 Индексы для оптимизации

### Основные индексы

```sql
-- Поиск по названию
CREATE INDEX idx_title ON movies(title);

-- Фильтрация по типу контента
CREATE INDEX idx_content_type ON movies(content_type);

-- Сортировка по дате релиза
CREATE INDEX idx_release_date ON movies(release_date);
CREATE INDEX idx_movies_release_date_desc ON movies(release_date DESC);

-- Сортировка по рейтингам
CREATE INDEX idx_metascore ON movies(metascore);
CREATE INDEX idx_user_score ON movies(user_score);
CREATE INDEX idx_movies_metascore_desc ON movies(metascore DESC);
CREATE INDEX idx_movies_user_score_desc ON movies(user_score DESC);

-- Поиск оценок пользователя
CREATE INDEX idx_user_ratings_user_id ON user_ratings(user_id);
CREATE INDEX idx_user_ratings_movie_id ON user_ratings(movie_id);

-- Поиск рецензий
CREATE INDEX idx_reviews_movie_id ON reviews(movie_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_publication_date_desc ON reviews(publication_date DESC);

-- Поиск жанров
CREATE INDEX idx_movie_genres_movie_id ON movie_genres(movie_id);
CREATE INDEX idx_movie_genres_genre ON movie_genres(genre);
```

---

## 📊 Тестовые данные

### Пользователи (4)
- `demo` - Обычный пользователь
- `admin` - Администратор
- `critic_john` - Профессиональный критик
- `movie_fan` - Любитель кино

Все пароли: **demo123** (BCrypt hash)

### Контент (20)
- **8 фильмов:** Дюна 3, MI8, Аватар 4, Бэтмен, Фантастические твари 4, Дэдпул и Росомаха 2, Интерстеллар 2, Гладиатор 3
- **5 сериалов:** The Last of Us 2, TWD: Survivors, Rings of Power 3, House of the Dragon 3, The Witcher 4
- **7 игр:** GTA 6, TES 6, AC Shadows, Fable 4, Perfect Dark, Silksong, Jedi Survivor 2

### Оценки (22)
Распределены между пользователями с эмоциями

### Рецензии (7)
5 критических + 2 пользовательских

### Достижения (10)
От "Первый шаг" до "Социальная бабочка"

---

## 🔍 Полезные SQL запросы

### Топ фильмов по Metascore
```sql
SELECT title, metascore, user_score, total_ratings
FROM movies
WHERE content_type = 'MOVIE'
ORDER BY metascore DESC
LIMIT 10;
```

### Новинки 2025
```sql
SELECT title, content_type, release_date, metascore
FROM movies
WHERE YEAR(release_date) = 2025
ORDER BY release_date DESC;
```

### Оценки пользователя
```sql
SELECT m.title, ur.rating, ur.emotion, ur.created_at
FROM user_ratings ur
JOIN movies m ON ur.movie_id = m.id
WHERE ur.user_id = 1
ORDER BY ur.created_at DESC;
```

### Статистика по контенту
```sql
SELECT 
    content_type,
    COUNT(*) as total,
    ROUND(AVG(metascore), 1) as avg_metascore,
    ROUND(AVG(user_score), 1) as avg_user_score
FROM movies
GROUP BY content_type;
```

### Самые обсуждаемые фильмы
```sql
SELECT title, total_reviews, total_ratings, metascore
FROM movies
ORDER BY total_reviews DESC
LIMIT 10;
```

---

## 🎓 Для защиты курсовой работы

### Ключевые моменты

1. **Нормализация:** База данных находится в 3НФ
2. **Целостность:** Все связи защищены foreign keys
3. **Производительность:** 15+ индексов для быстрых запросов
4. **Автоматизация:** 4 триггера для поддержания консистентности
5. **Удобство:** 2 представления для аналитики
6. **Масштабируемость:** Поддержка миллионов записей

### Демонстрация функционала

1. **Регистрация пользователя** → запись в `users`
2. **Оценка фильма** → запись в `user_ratings` → триггер обновляет `movies.user_score`
3. **Написание рецензии** → запись в `reviews` → триггер обновляет счётчики
4. **Получение достижения** → автоматическая проверка условий → запись в `user_achievements`
5. **Построение топа** → использование view `top_movies_by_metascore`

### Технологии

- **СУБД:** MySQL 8.0
- **Кодировка:** UTF-8 (utf8mb4_unicode_ci)
- **Движок:** InnoDB (транзакции, foreign keys)
- **Бэкап:** Скрипты schema.sql и data.sql
- **ORM:** Spring Data JPA (Hibernate)

---

## 📁 Файлы проекта

- `schema.sql` - Полная схема БД (таблицы, индексы, триггеры, views)
- `data.sql` - Тестовые данные (4 пользователя, 20 контентов, 22 оценки, 7 рецензий)
- `application.properties` - Конфигурация подключения
- `pom.xml` - MySQL connector dependency
- `MYSQL-SETUP.md` - Подробная инструкция по установке

---

## ✅ Готово к защите!

База данных **warehouse** полностью реализована, протестирована и готова к демонстрации! 🎉
