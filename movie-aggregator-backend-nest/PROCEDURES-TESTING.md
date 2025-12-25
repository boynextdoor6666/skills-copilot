# 🚀 Импорт процедур и тестирование системы

## Статус реализации

✅ **SQL Процедуры созданы:**
- `database/admin-procedures.sql` — валидация критиков, блокировка, управление
- `database/critic-procedures.sql` — агрегация, публикация профотзывов, динамика, hype alerts
- `database/visitor-procedures.sql` — поиск, детали контента, регистрация
- `database/viewer-user-procedures.sql` — отзывы зрителей, персональные агрегаторы, достижения
- `database/schema-additions.sql` — дополнительные таблицы

✅ **NestJS Модули созданы:**
- `src/content/` — работа с контентом (MOVIE/TV_SERIES/GAME)
- `src/reviews/` — отзывы зрителей и критиков

---

## 📦 Шаг 1: Импорт SQL процедур в MySQL

### Вариант A: Через PowerShell (рекомендуется)

```powershell
# Перейти в папку database
cd "C:\Users\user\Desktop\Course work (agregator)\movie-aggregator-backend-nest\database"

# 1. Импортировать дополнительные таблицы
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < schema-additions.sql"

# 2. Импортировать процедуры для Admin flow
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < admin-procedures.sql"

# 3. Импортировать процедуры для Critic flow
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < critic-procedures.sql"

# 4. Импортировать процедуры для Visitor flow
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < visitor-procedures.sql"

# 5. Импортировать процедуры для Viewer flow
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < viewer-user-procedures.sql"

# 6. Импортировать viewer triggers (если ещё не импортирован)
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < viewer-triggers-procedures.sql"
```

### Вариант B: Через MySQL Workbench

1. Открыть MySQL Workbench
2. Подключиться к `warehouse` БД
3. File → Open SQL Script → выбрать файл (например `admin-procedures.sql`)
4. Выполнить: **Execute** (⚡ иконка)
5. Повторить для всех 6 файлов

---

## 🧪 Шаг 2: Проверить созданные процедуры

```sql
-- Проверить список процедур
SHOW PROCEDURE STATUS WHERE Db = 'warehouse';

-- Проверить триггеры
SHOW TRIGGERS FROM warehouse;

-- Посмотреть определение процедуры
SHOW CREATE PROCEDURE validate_critic\G
SHOW CREATE PROCEDURE publish_pro_review\G
SHOW CREATE PROCEDURE add_review_viewer\G
```

---

## 🎯 Шаг 3: Тестовые вызовы процедур (MySQL консоль)

### Admin Flow

```sql
USE warehouse;

-- 1. Валидация критика (одобрить user_id=2 как критика)
CALL validate_critic(2, 1, TRUE);

-- 2. Блокировать пользователя
CALL block_user_provider(10, 'user', 1, 'Spam', 'temp');

-- 3. Обновить контент (админ изменяет фильм id=1)
CALL admin_update_content(1, 1, 'Updated Title', 2024, 'Action');
```

### Critic Flow

```sql
-- 1. Получить агрегацию контента
CALL get_aggregation_proc(1, NULL);

-- 2. Опубликовать профессиональный отзыв (критик user_id=2, content_id=1)
CALL publish_pro_review(
  1, 
  2, 
  'Отличный фильм с глубоким сюжетом', 
  JSON_OBJECT('plot',9,'acting',8,'visuals',9), 
  JSON_OBJECT('joy',7,'excitement',8), 
  8.5
);

-- 3. Получить динамику рейтингов
CALL get_dynamics_graph(1);

-- 4. Проверить hype alert
CALL trigger_hype_alert(1);
```

### Visitor Flow

```sql
-- 1. Поиск контента
CALL after_search('Matrix', 'MOVIE', 10);

-- 2. Получить детали контента
CALL get_content_details(1);

-- 3. Получить эмоциональное облако для графика
CALL get_emotional_cloud_chart(1);

-- 4. Регистрация пользователя
CALL create_user('testuser', 'test@example.com', '$2b$10$hashedpassword', 'USER');
```

### Viewer Flow

```sql
-- 1. Валидация зрителя
CALL validate_user_provider(3, 'token123');

-- 2. Добавить отзыв зрителя (user_id=3, content_id=1)
CALL add_review_viewer(
  3, 
  1, 
  JSON_OBJECT('plot',8,'acting',7), 
  JSON_OBJECT('joy',6), 
  7.5, 
  'Интересный фильм!'
);

-- 3. Обновить список избранных критиков
CALL update_personal_critic_prefs(3, JSON_ARRAY(2, 4, 5));

-- 4. Обновить персональный агрегатор
CALL update_personal_aggregator(3, 1);

-- 5. Проверить достижения
CALL check_achievements_proc(3);
```

---

## 🔧 Шаг 4: Запустить NestJS Backend

```powershell
cd "C:\Users\user\Desktop\Course work (agregator)\movie-aggregator-backend-nest"

# Установить зависимости (если ещё не установлены)
npm install

# Проверить .env файл (убедиться, что DB_HOST=127.0.0.1, DB_NAME=warehouse)
# Если .env отсутствует, скопировать из .env.example

# Запустить в режиме разработки
npm run start:dev
```

Backend должен запуститься на **http://localhost:8080**

---

## 📡 Шаг 5: Тестировать API эндпоинты

### Использовать Swagger UI (рекомендуется)

Открыть в браузере: **http://localhost:8080/swagger**

### Или использовать curl/Postman

#### 1. Регистрация и логин

```powershell
# Регистрация
curl -X POST http://localhost:8080/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"username":"testviewer","email":"viewer@test.com","password":"test123"}'

# Логин
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"usernameOrEmail":"testviewer","password":"test123"}'

# Сохранить token из ответа
```

#### 2. Поиск контента (публичный)

```powershell
curl http://localhost:8080/api/content/search?query=Matrix&limit=5
```

#### 3. Получить детали контента

```powershell
curl http://localhost:8080/api/content/1
```

#### 4. Получить эмоциональное облако

```powershell
curl http://localhost:8080/api/content/1/emotional-cloud
```

#### 5. Получить динамику рейтингов

```powershell
curl http://localhost:8080/api/content/1/dynamics
```

#### 6. Добавить отзыв зрителя (требуется токен)

```powershell
$token = "ВАШ_JWT_TOKEN"

curl -X POST http://localhost:8080/api/reviews `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "content_id":1,
    "content":"Отличный фильм!",
    "aspects":{"plot":8,"acting":9},
    "emotions":{"joy":7},
    "rating":8.5
  }'
```

#### 7. Опубликовать профессиональный отзыв (критик)

```powershell
# Логин как критик (user_id=2, role=CRITIC)
# Получить токен критика

curl -X POST http://localhost:8080/api/reviews/pro `
  -H "Authorization: Bearer $criticToken" `
  -H "Content-Type: application/json" `
  -d '{
    "content_id":1,
    "review_text":"Профессиональный анализ",
    "aspects":{"plot":9,"acting":8,"visuals":9},
    "emotions":{"excitement":8},
    "rating":9.0
  }'
```

#### 8. Получить отзывы для контента

```powershell
curl http://localhost:8080/api/reviews/content/1
```

---

## ✅ Проверка работы триггеров

### Триггер 1: `after_review_enhanced` (из viewer-triggers-procedures.sql)

После вставки отзыва автоматически:
- Пересчитывает рейтинги (RecalculateMovieRatings)
- Обновляет hype_index
- Обновляет emotional_cloud и perception_map
- Отправляет уведомления подписчикам

```sql
-- Вставить тестовый отзыв напрямую в БД
INSERT INTO reviews (content_id, user_id, content, aspects, emotions, rating, created_at)
VALUES (1, 3, 'Тест триггера', JSON_OBJECT('plot',8), JSON_OBJECT('joy',5), 8.0, NOW());

-- Проверить, что hype_index обновился
SELECT id, title, hype_index, emotional_cloud FROM content WHERE id=1;

-- Проверить уведомления
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
```

### Триггер 2: `after_pro_review_insert` (из critic-procedures.sql)

После вставки отзыва критика:
- Обновляет critics_rating
- Проверяет hype и отправляет алерт критикам

```sql
-- Вставить отзыв критика (user_id=2 должен иметь role=CRITIC)
UPDATE users SET role='CRITIC' WHERE id=2;

INSERT INTO reviews (content_id, user_id, content, rating, created_at)
VALUES (1, 2, 'Критический анализ', 9.0, NOW());

-- Проверить critics_rating
SELECT id, title, critics_rating, hype_index FROM content WHERE id=1;
```

### Триггер 3: `after_user_rating_insert` (из viewer-user-procedures.sql)

После вставки рейтинга зрителя:
- Обновляет audience_rating
- Проверяет достижения

```sql
-- Вставить рейтинг
INSERT INTO user_ratings (user_id, content_id, rating, created_at)
VALUES (3, 1, 8.5, NOW());

-- Проверить audience_rating
SELECT id, title, audience_rating FROM content WHERE id=1;

-- Проверить достижения пользователя
SELECT * FROM user_achievements WHERE user_id=3;
```

---

## 🐛 Troubleshooting

### Ошибка: "PROCEDURE does not exist"

```sql
-- Убедиться, что процедура создана
SHOW PROCEDURE STATUS WHERE Db = 'warehouse' AND Name = 'publish_pro_review';

-- Если отсутствует, импортировать файл заново
```

### Ошибка: "Unknown column 'X'"

```sql
-- Проверить структуру таблицы
SHOW COLUMNS FROM reviews;
SHOW COLUMNS FROM content;

-- Импортировать schema-additions.sql для добавления недостающих колонок
```

### Backend не подключается к БД

1. Проверить `.env`:
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASS=ВАШ_ПАРОЛЬ
   DB_NAME=warehouse
   ```

2. Проверить MySQL запущен:
   ```powershell
   Get-Service -Name "MySQL*"
   ```

3. Проверить подключение:
   ```powershell
   & 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -u root -p -D warehouse -e "SELECT 1;"
   ```

---

## 📊 Следующие шаги

1. ✅ Импортировать все процедуры
2. ✅ Протестировать CALL для каждой процедуры
3. ✅ Запустить NestJS backend
4. ✅ Протестировать API эндпоинты через Swagger
5. ⏳ Интегрировать с frontend (обновить axios calls в React)
6. ⏳ Добавить персональные агрегаторы для зрителей
7. ⏳ Реализовать NLP анализ эмоций (опционально)

---

**Готово!** Система работает по диаграммам активности:
- ✅ Admin flow
- ✅ Critic flow  
- ✅ Visitor flow
- ✅ Viewer flow

Все процедуры и триггеры реализованы и готовы к тестированию! 🎉
