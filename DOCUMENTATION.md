# Документация проекта CinemaHub

## Оглавление
1. [Обзор системы](#обзор-системы)
2. [Архитектура](#архитектура)
3. [Установка и настройка](#установка-и-настройка)
4. [API Документация](#api-документация)
5. [Система логирования](#система-логирования)
6. [База данных](#база-данных)
7. [Аналитика](#аналитика)
8. [Безопасность](#безопасность)
9. [Развертывание](#развертывание)
10. [Устранение неполадок](#устранение-неполадок)

---

## Обзор системы

### Описание
CinemaHub — это интеллектуальный агрегатор контента нового поколения для фильмов, сериалов и игр с уникальными возможностями:
- **Эмоциональная аналитика** — анализ эмоционального восприятия контента
- **Персонализированные рекомендации** — на основе профиля вкусов пользователя
- **Агрегация оценок** — из множества источников (Metacritic, IMDb, пользовательские отзывы)
- **Критический анализ** — возможность подписки на любимых критиков
- **Глобальная статистика** — сравнение восприятия в разных странах

### Целевая аудитория
- Киноманы и геймеры, ищущие качественный контент
- Критики и рецензенты
- Аналитики медиа-индустрии
- Создатели контента

### Технологический стек
**Frontend:**
- React 18+ (Vite)
- TailwindCSS
- Axios
- React Router
- Context API

**Backend:**
- NestJS (Node.js 18+)
- TypeORM
- MySQL 8.0+
- Winston (логирование)
- JWT (аутентификация)

**Аналитика:**
- Apache Kafka
- PySpark
- ClickHouse
- Docker Compose

---

## Архитектура

### Общая архитектура системы

```
┌─────────────────┐
│   Клиент        │
│  (React SPA)    │
└────────┬────────┘
         │ HTTP/HTTPS
         │ REST API
         ▼
┌─────────────────┐      ┌──────────────┐
│  NestJS API     │◄────►│   MySQL DB   │
│  (Port 8080)    │      │  (Port 3306) │
└────────┬────────┘      └──────────────┘
         │
         │ Events
         ▼
┌─────────────────┐      ┌──────────────┐
│   Kafka         │◄────►│  ClickHouse  │
│  (Port 9092)    │      │(Port 8123)   │
└─────────────────┘      └──────────────┘
         ▲
         │ PySpark
         │ Processing
```

### Слоистая архитектура (Layered Architecture)

#### 1. Presentation Layer (Слой представления)
- **React Components** — переиспользуемые UI компоненты
- **Pages** — страницы приложения
- **Context API** — управление состоянием
- **Routing** — навигация

#### 2. API Layer (Слой API)
- **Controllers** — обработка HTTP запросов
- **Guards** — проверка аутентификации и авторизации
- **Interceptors** — логирование, трансформация данных
- **Middleware** — request-id, CORS

#### 3. Business Logic Layer (Слой бизнес-логики)
- **Services** — бизнес-операции
- **DTOs** — объекты передачи данных
- **Validators** — валидация входных данных

#### 4. Data Access Layer (Слой доступа к данным)
- **TypeORM Entities** — модели данных
- **Repositories** — работа с БД
- **Stored Procedures** — сложная бизнес-логика в БД
- **Triggers** — автоматизация

#### 5. Infrastructure Layer (Инфраструктурный слой)
- **Logger** — Winston с ротацией
- **Event Bus** — Kafka для аналитики
- **External APIs** — интеграции (TMDB, IGDB, etc.)

---

## Установка и настройка

### Системные требования

**Минимальные:**
- Node.js 18.0+
- MySQL 8.0+
- 4 GB RAM
- 10 GB свободного места

**Рекомендуемые:**
- Node.js 20.0+
- MySQL 8.0+
- 8 GB RAM
- 20 GB свободного места
- Docker (для аналитики)

### Установка Backend

```powershell
# 1. Клонировать репозиторий
cd "C:\Users\user\Desktop\Course work (agregator)"

# 2. Перейти в папку backend
cd movie-aggregator-backend-nest

# 3. Установить зависимости
npm install

# 4. Настроить переменные окружения
copy .env.example .env
# Отредактируйте .env файл (см. раздел Конфигурация)

# 5. Создать базу данных
# Выполните SQL скрипты из папки database/

# 6. Запустить миграции (если есть)
npm run migration:run

# 7. Создать тестового пользователя
npm run seed:dev

# 8. Запустить в режиме разработки
npm run start:dev

# 9. Запустить в продакшн режиме
npm run build
npm run start
```

### Установка Frontend

```powershell
# 1. Перейти в папку frontend
cd movie-aggregator-frontend

# 2. Установить зависимости
npm install

# 3. Настроить переменные окружения
copy .env.example .env
# Установите VITE_API_URL=http://localhost:8080

# 4. Запустить в режиме разработки
npm run dev

# 5. Собрать для продакшн
npm run build
```

### Конфигурация Backend (.env)

```env
# Сервер
NODE_ENV=development
PORT=8080

# База данных MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=warehouse

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES=7d

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000

# Логирование
LOG_TO_FILES=true
LOG_DIR=./logs
LOG_LEVEL=info
LOG_RETENTION_DAYS_INFO=14
LOG_RETENTION_DAYS_ERROR=30
LOG_RETENTION_DAYS_AUDIT=90

# Kafka (опционально, для аналитики)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=cinemahub-backend
KAFKA_ENABLED=false

# ClickHouse (опционально)
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=analytics

# External APIs (опционально)
TMDB_API_KEY=your_tmdb_api_key
IGDB_CLIENT_ID=your_igdb_client_id
IGDB_CLIENT_SECRET=your_igdb_client_secret
```

### Конфигурация Frontend (.env)

```env
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=CinemaHub
VITE_APP_VERSION=1.0.0
```

---

## API Документация

### Базовый URL
```
http://localhost:8080/api
```

### Аутентификация

Все защищённые эндпоинты требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

### Эндпоинты

#### 🔐 Auth (Аутентификация)

**POST /api/auth/register**
```json
// Request
{
  "username": "user123",
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response 201
{
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**POST /api/auth/login**
```json
// Request
{
  "username": "user123",
  "password": "SecurePass123!"
}

// Response 200
{
  "user": {
    "id": 1,
    "username": "user123",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**GET /api/auth/validate** 🔒
```json
// Headers: Authorization: Bearer <token>
// Response 200
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "user123",
    "role": "user"
  }
}
```

#### 🎬 Content (Контент)

**GET /api/content**
```
Query Parameters:
- type: movie | series | game
- limit: number (default: 50)

Response 200:
[
  {
    "id": 1,
    "title": "Дюна: Часть вторая",
    "type": "movie",
    "year": 2024,
    "rating": 8.7,
    "metascore": 79,
    "poster_url": "https://...",
    "director": "Дени Вильнёв",
    "cast": ["Тимоти Шаламе", "Зендая"]
  }
]
```

**GET /api/content/:id**
```
Response 200:
{
  "id": 1,
  "title": "Дюна: Часть вторая",
  "type": "movie",
  "year": 2024,
  "rating": 8.7,
  "metascore": 79,
  "userScore": 8.9,
  "description": "Пол Атрейдес объединяется с Чани...",
  "director": "Дени Вильнёв",
  "director_photo_url": "https://...",
  "cast": ["Тимоти Шаламе", "Зендая"],
  "cast_photos": ["https://...", "https://..."],
  "genres": ["Sci-Fi", "Adventure"],
  "reviews_count": 1243,
  "positive_reviews": 45,
  "mixed_reviews": 8,
  "negative_reviews": 2
}
```

**GET /api/content/search**
```
Query Parameters:
- q: string (поисковый запрос)
- type: movie | series | game | all
- genre: string
- year: number
- minRating: number
- limit: number
- offset: number

Response 200:
{
  "results": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

**GET /api/content/autocomplete**
```
Query Parameters:
- q: string (мин. 2 символа)
- limit: number (default: 10)

Response 200:
[
  {
    "id": 1,
    "title": "Дюна: Часть вторая",
    "type": "movie",
    "year": 2024
  }
]
```

**GET /api/content/stats**
```
Response 200:
{
  "totalMovies": 1543,
  "totalSeries": 892,
  "totalGames": 2341,
  "totalUsers": 75234,
  "totalReviews": 123456
}
```

**GET /api/content/:id/emotional-cloud**
```
Response 200:
{
  "emotions": [
    { "emotion": "Восторг", "count": 543, "percentage": 45.2 },
    { "emotion": "Напряжение", "count": 321, "percentage": 26.7 },
    { "emotion": "Грусть", "count": 198, "percentage": 16.5 }
  ]
}
```

**GET /api/content/:id/perception-map**
```
Response 200:
{
  "plot": 8.5,
  "acting": 9.2,
  "visuals": 9.8,
  "soundtrack": 8.7,
  "dialogues": 8.3,
  "pacing": 7.9
}
```

**GET /api/content/:id/dynamics**
```
Response 200:
{
  "timeline": [
    { "date": "2024-03-01", "rating": 8.2, "reviews": 234 },
    { "date": "2024-03-08", "rating": 8.5, "reviews": 567 },
    { "date": "2024-03-15", "rating": 8.7, "reviews": 891 }
  ]
}
```

**POST /api/content** 🔒 (Admin only)
```json
// Request
{
  "title": "Новый фильм",
  "type": "movie",
  "year": 2025,
  "description": "Описание...",
  "director": "Режиссёр",
  "cast": ["Актёр 1", "Актёр 2"],
  "genres": ["Action", "Drama"]
}

// Response 201
{
  "id": 1234,
  "title": "Новый фильм",
  ...
}
```

**PUT /api/content/:id** 🔒 (Admin only)
```json
// Request
{
  "title": "Обновлённое название",
  "rating": 8.5
}

// Response 200
{
  "id": 1234,
  "title": "Обновлённое название",
  ...
}
```

**DELETE /api/content/:id** 🔒 (Admin only)
```
Response 200:
{
  "message": "Content deleted successfully"
}
```

#### 📝 Reviews (Отзывы)

**POST /api/reviews** 🔒
```json
// Request
{
  "contentId": 1,
  "rating": 9,
  "text": "Потрясающий фильм!",
  "emotions": ["Восторг", "Напряжение"],
  "perception": {
    "plot": 9,
    "acting": 10,
    "visuals": 10,
    "soundtrack": 8
  }
}

// Response 201
{
  "id": 5678,
  "contentId": 1,
  "userId": 42,
  "rating": 9,
  "createdAt": "2025-11-20T10:30:00Z"
}
```

**POST /api/reviews/pro** 🔒 (Critic only)
```json
// Request
{
  "contentId": 1,
  "score": 85,
  "verdict": "positive",
  "text": "Профессиональная рецензия...",
  "pros": ["Визуальные эффекты", "Актёрская игра"],
  "cons": ["Затянутое начало"]
}

// Response 201
{
  "id": 9012,
  "contentId": 1,
  "criticId": 7,
  "score": 85,
  "verdict": "positive",
  "createdAt": "2025-11-20T11:00:00Z"
}
```

**GET /api/reviews/content/:contentId**
```
Query Parameters:
- type: user | critic | all (default: all)
- limit: number
- offset: number

Response 200:
{
  "reviews": [
    {
      "id": 5678,
      "user": {
        "id": 42,
        "username": "user123",
        "avatar": "https://..."
      },
      "rating": 9,
      "text": "Потрясающий фильм!",
      "createdAt": "2025-11-20T10:30:00Z",
      "likes": 23
    }
  ],
  "total": 150,
  "average": 8.7
}
```

**GET /api/reviews/my** 🔒
```
Response 200:
[
  {
    "id": 5678,
    "content": {
      "id": 1,
      "title": "Дюна: Часть вторая"
    },
    "rating": 9,
    "createdAt": "2025-11-20T10:30:00Z"
  }
]
```

**DELETE /api/reviews/:id** 🔒
```
Response 200:
{
  "message": "Review deleted successfully"
}
```

#### 👤 Users (Пользователи)

**GET /api/users/me** 🔒
```
Response 200:
{
  "id": 42,
  "username": "user123",
  "email": "user@example.com",
  "role": "user",
  "avatar": "https://...",
  "level": 5,
  "experience": 2340,
  "reviewsCount": 23,
  "createdAt": "2024-01-15T08:00:00Z"
}
```

**PATCH /api/users/me** 🔒
```json
// Request
{
  "avatar": "https://...",
  "bio": "Киноман и геймер"
}

// Response 200
{
  "id": 42,
  "username": "user123",
  "avatar": "https://...",
  "bio": "Киноман и геймер"
}
```

**PATCH /api/users/me/password** 🔒
```json
// Request
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}

// Response 200
{
  "message": "Password updated successfully"
}
```

**GET /api/users/me/level** 🔒
```
Response 200:
{
  "level": 5,
  "experience": 2340,
  "nextLevelAt": 3000,
  "progress": 78
}
```

**GET /api/users/me/achievements** 🔒
```
Response 200:
[
  {
    "id": 1,
    "name": "Первый отзыв",
    "description": "Написать первый отзыв",
    "icon": "🎬",
    "unlocked": true,
    "unlockedAt": "2024-01-20T10:00:00Z"
  }
]
```

**GET /api/users/leaderboard**
```
Query Parameters:
- period: week | month | all (default: month)
- limit: number (default: 100)

Response 200:
[
  {
    "rank": 1,
    "user": {
      "id": 42,
      "username": "user123",
      "avatar": "https://..."
    },
    "experience": 15430,
    "level": 12,
    "reviewsCount": 156
  }
]
```

**GET /api/users/me/taste-profile** 🔒
```
Response 200:
{
  "favoriteGenres": [
    { "genre": "Sci-Fi", "count": 45, "avgRating": 8.7 },
    { "genre": "Drama", "count": 32, "avgRating": 8.3 }
  ],
  "favoriteDirectors": [
    { "director": "Кристофер Нолан", "count": 12, "avgRating": 9.1 }
  ],
  "ratingDistribution": {
    "10": 15,
    "9": 32,
    "8": 45,
    "7": 23
  },
  "emotionalProfile": {
    "dominant": "Восторг",
    "secondary": "Напряжение"
  }
}
```

**GET /api/users/me/recommendations** 🔒
```
Query Parameters:
- limit: number (default: 20)

Response 200:
[
  {
    "id": 1,
    "title": "Рекомендованный фильм",
    "type": "movie",
    "matchScore": 92,
    "reason": "На основе ваших любимых жанров"
  }
]
```

#### 🎭 Critics (Критики)

**GET /api/critics**
```
Query Parameters:
- limit: number
- offset: number

Response 200:
[
  {
    "id": 7,
    "name": "Иван Критиков",
    "publication": "Film.ru",
    "avatar": "https://...",
    "reviewsCount": 234,
    "followersCount": 1543,
    "specialization": ["movies", "series"]
  }
]
```

**GET /api/critics/followed** 🔒
```
Response 200:
[
  {
    "id": 7,
    "name": "Иван Критиков",
    "followedAt": "2024-05-12T14:00:00Z"
  }
]
```

**POST /api/critics/:id/follow** 🔒
```
Response 200:
{
  "message": "Critic followed successfully"
}
```

**DELETE /api/critics/:id/follow** 🔒
```
Response 200:
{
  "message": "Critic unfollowed successfully"
}
```

**GET /api/critics/personalized** 🔒
```
Response 200:
{
  "averageRating": 8.3,
  "topCritics": [
    {
      "critic": { "id": 7, "name": "Иван Критиков" },
      "matchScore": 87,
      "commonTastes": ["Sci-Fi", "Drama"]
    }
  ]
}
```

#### 🎨 Hero Carousel (Карусель героев)

**GET /api/content/hero-carousel/active**
```
Response 200:
[
  {
    "id": 1,
    "content": {
      "id": 123,
      "title": "Дюна: Часть вторая",
      "type": "movie"
    },
    "image": "https://...",
    "order": 1,
    "active": true
  }
]
```

**GET /api/content/hero-carousel/all** 🔒 (Admin only)
**POST /api/content/hero-carousel** 🔒 (Admin only)
**PUT /api/content/hero-carousel/:id** 🔒 (Admin only)
**DELETE /api/content/hero-carousel/:id** 🔒 (Admin only)

#### 🔜 Coming Soon (Скоро выйдет)

**GET /api/content/coming-soon/active**
```
Response 200:
[
  {
    "id": 1,
    "title": "Будущий фильм",
    "type": "movie",
    "releaseDate": "2025-12-15",
    "poster": "https://...",
    "hypeIndex": 95
  }
]
```

### Коды ответов

| Код | Описание |
|-----|----------|
| 200 | OK - Успешный запрос |
| 201 | Created - Ресурс создан |
| 400 | Bad Request - Некорректный запрос |
| 401 | Unauthorized - Требуется аутентификация |
| 403 | Forbidden - Доступ запрещён |
| 404 | Not Found - Ресурс не найден |
| 409 | Conflict - Конфликт данных |
| 422 | Unprocessable Entity - Ошибка валидации |
| 500 | Internal Server Error - Внутренняя ошибка сервера |

### Примеры ошибок

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is not valid"
    }
  ]
}
```

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid token"
}
```

---

## Система логирования

### Обзор

Система использует Winston для структурированного логирования с:
- Ежедневной ротацией файлов
- Разделением по уровням (info, error, audit)
- Корреляцией запросов через request-id
- Метриками производительности

### Конфигурация

```env
LOG_TO_FILES=true              # Включить запись в файлы
LOG_DIR=./logs                 # Директория для логов
LOG_LEVEL=info                 # Уровень логирования (debug, info, warn, error)
LOG_RETENTION_DAYS_INFO=14     # Хранение info логов (дни)
LOG_RETENTION_DAYS_ERROR=30    # Хранение error логов (дни)
LOG_RETENTION_DAYS_AUDIT=90    # Хранение audit логов (дни)
```

### Файлы логов

**app-info-YYYY-MM-DD.log** — Информационные события
```json
{
  "timestamp": "2025-11-20T10:30:45.123Z",
  "level": "info",
  "message": "→ GET /api/content/stats user=42 reqId=3f5a1b2a-9d8e-4f11-bf6d-5a0d1c1d8b0e"
}
{
  "timestamp": "2025-11-20T10:30:45.178Z",
  "level": "info",
  "message": "← GET /api/content/stats 200 55ms user=42 reqId=3f5a1b2a-9d8e-4f11-bf6d-5a0d1c1d8b0e"
}
```

**app-error-YYYY-MM-DD.log** — Ошибки и предупреждения
```json
{
  "timestamp": "2025-11-20T10:31:12.456Z",
  "level": "error",
  "message": "× GET /api/content/999 404 12ms user=42 reqId=7e9f3c4d-... msg=Content not found"
}
```

**audit-YYYY-MM-DD.log** — Аудит критических действий
```json
{
  "timestamp": "2025-11-20T10:32:00.789Z",
  "level": "info",
  "channel": "audit",
  "action": "CONTENT_DELETE",
  "userId": 1,
  "targetContentId": 123,
  "message": "Admin deleted content id=123"
}
```

### Просмотр логов (PowerShell)

```powershell
# Просмотр последних 50 строк info-логов
Get-Content -Path ".\logs\app-info-2025-11-20.log" -Tail 50

# Мониторинг в реальном времени (tail -f)
Get-Content -Path ".\logs\app-info-2025-11-20.log" -Wait -Tail 200

# Поиск по request-id
Select-String -Path ".\logs\app-info-*.log" -Pattern "reqId=3f5a1b2a"

# Поиск ошибок
Select-String -Path ".\logs\app-error-*.log" -Pattern "msg="

# Статистика ошибок за день
(Get-Content ".\logs\app-error-2025-11-20.log" | ConvertFrom-Json).Count
```

### Request ID correlation

Каждый HTTP-запрос получает уникальный `request-id`:
- Генерируется автоматически или берётся из заголовка `x-request-id`
- Возвращается в ответе в заголовке `x-request-id`
- Присутствует во всех связанных лог-записях

Пример отправки запроса с request-id:
```powershell
$rid = [guid]::NewGuid().ToString()
Invoke-RestMethod -Uri "http://localhost:8080/api/content/stats" `
  -Headers @{ "x-request-id" = $rid }
```

Затем поиск всех событий этого запроса:
```powershell
Select-String -Path ".\logs\app-info-*.log" -Pattern "reqId=$rid"
```

---

## База данных

### Схема базы данных

#### Таблица: content
```sql
CREATE TABLE content (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  type ENUM('movie', 'series', 'game') NOT NULL,
  year INT,
  description TEXT,
  rating DECIMAL(3,1),
  metascore INT,
  user_score DECIMAL(3,1),
  director VARCHAR(255),
  director_photo_url VARCHAR(500),
  cast JSON,
  cast_photos JSON,
  genres JSON,
  poster_url VARCHAR(500),
  backdrop_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  positive_reviews INT DEFAULT 0,
  mixed_reviews INT DEFAULT 0,
  negative_reviews INT DEFAULT 0,
  INDEX idx_type (type),
  INDEX idx_year (year),
  INDEX idx_rating (rating),
  FULLTEXT idx_title (title)
);
```

#### Таблица: users
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'critic', 'admin') DEFAULT 'user',
  avatar VARCHAR(500),
  bio TEXT,
  level INT DEFAULT 1,
  experience INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
);
```

#### Таблица: reviews
```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 10),
  text TEXT,
  emotions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_content (content_id),
  INDEX idx_user (user_id)
);
```

#### Таблица: ratings
```sql
CREATE TABLE ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_content (user_id, content_id),
  INDEX idx_content (content_id)
);
```

### Хранимые процедуры

#### add_review_viewer
Добавляет отзыв зрителя и автоматически пересчитывает агрегированный рейтинг.

```sql
CALL add_review_viewer(
  p_content_id INT,
  p_user_id INT,
  p_rating INT,
  p_text TEXT,
  p_emotions JSON
);
```

#### publish_pro_review
Публикует профессиональную рецензию критика.

```sql
CALL publish_pro_review(
  p_content_id INT,
  p_critic_id INT,
  p_score INT,
  p_verdict ENUM('positive', 'mixed', 'negative'),
  p_text TEXT
);
```

#### RecalculateMovieRatings
Пересчитывает агрегированные рейтинги для контента.

```sql
CALL RecalculateMovieRatings(p_content_id INT);
```

### Триггеры

#### after_review_insert
```sql
CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  CALL RecalculateMovieRatings(NEW.content_id);
END;
```

#### after_rating_insert
```sql
CREATE TRIGGER after_rating_insert
AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
  UPDATE users
  SET experience = experience + 10
  WHERE id = NEW.user_id;
END;
```

### Резервное копирование

```powershell
# Создать бэкап
mysqldump -u root -p warehouse > backup_2025-11-20.sql

# Восстановить из бэкапа
mysql -u root -p warehouse < backup_2025-11-20.sql

# Бэкап только схемы (без данных)
mysqldump -u root -p --no-data warehouse > schema_only.sql
```

---

## Аналитика

### Архитектура аналитического конвейера

```
Backend → Kafka → PySpark → ClickHouse → Dashboard
```

### Настройка аналитики

#### 1. Запуск Docker Compose

```powershell
cd analytics
docker-compose up -d
```

#### 2. Проверка сервисов

```powershell
# Kafka
docker-compose ps kafka

# ClickHouse
curl http://localhost:8123/ping

# Zookeeper
docker-compose logs zookeeper
```

#### 3. Создание таблиц в ClickHouse

```sql
CREATE TABLE analytics.user_activity_log (
  timestamp DateTime,
  user_id UInt32,
  action String,
  content_id UInt32,
  content_type Enum8('movie'=1, 'series'=2, 'game'=3),
  session_id String,
  ip_address String,
  user_agent String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, user_id);

CREATE TABLE analytics.content_views (
  date Date,
  content_id UInt32,
  views UInt64,
  unique_users UInt64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, content_id);
```

#### 4. Запуск PySpark обработчика

```powershell
cd analytics/pyspark
pip install -r requirements.txt
python stream_to_clickhouse.py
```

### События аналитики

Backend публикует события в Kafka:

```typescript
// services/content.service.ts
async publishEvent(event: {
  action: string;
  userId: number;
  contentId: number;
  metadata?: any;
}) {
  await this.kafkaClient.send({
    topic: 'user-events',
    messages: [{
      value: JSON.stringify({
        timestamp: new Date().toISOString(),
        ...event
      })
    }]
  });
}
```

### Запросы к аналитике

```sql
-- Топ-10 популярных фильмов за последние 7 дней
SELECT
  content_id,
  sum(views) as total_views,
  sum(unique_users) as total_users
FROM analytics.content_views
WHERE date >= today() - 7
GROUP BY content_id
ORDER BY total_views DESC
LIMIT 10;

-- Активность пользователей по часам
SELECT
  toHour(timestamp) as hour,
  count() as events
FROM analytics.user_activity_log
WHERE timestamp >= now() - INTERVAL 1 DAY
GROUP BY hour
ORDER BY hour;
```

---

## Безопасность

### Аутентификация

**JWT Tokens:**
- Генерируются при логине/регистрации
- Срок действия: 7 дней (настраивается в `JWT_EXPIRES`)
- Хранятся в `localStorage` на клиенте
- Передаются в заголовке `Authorization: Bearer <token>`

**Валидация токена:**
```typescript
// Guards проверяют токен на каждом защищённом эндпоинте
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtectedResource(@Request() req) {
  // req.user содержит декодированные данные из токена
  return req.user;
}
```

### Авторизация (RBAC)

**Роли:**
- `user` — обычный пользователь (может писать отзывы, ставить оценки)
- `critic` — критик (дополнительно может публиковать профессиональные рецензии)
- `admin` — администратор (полный доступ, включая управление контентом)

**Проверка ролей:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Delete(':id')
deleteContent(@Param('id') id: number) {
  return this.contentService.deleteContent(id);
}
```

### Защита паролей

- Хеширование: **bcrypt** с солью (10 раундов)
- Никогда не логируются и не возвращаются в API

```typescript
import * as bcrypt from 'bcrypt';

// Хеширование при регистрации
const hash = await bcrypt.hash(password, 10);

// Проверка при логине
const isValid = await bcrypt.compare(password, user.password);
```

### CORS

```typescript
// main.ts
app.enableCors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim()),
  credentials: true
});
```

**Продакшн:**
```env
CORS_ORIGINS=https://cinemahub.com,https://www.cinemahub.com
```

### SQL Injection Protection

- **TypeORM** автоматически экранирует параметры
- Хранимые процедуры используют параметризованные запросы

```typescript
// ✅ Безопасно (TypeORM)
await this.contentRepository.findOne({ where: { id } });

// ✅ Безопасно (параметры)
await this.connection.query(
  'CALL add_review_viewer(?, ?, ?, ?, ?)',
  [contentId, userId, rating, text, emotions]
);

// ❌ Опасно (не используйте!)
await this.connection.query(
  `SELECT * FROM users WHERE username = '${username}'`
);
```

### Rate Limiting

Рекомендуется использовать `@nestjs/throttler`:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // 60 секунд
      limit: 100    // 100 запросов
    })
  ]
})
```

### XSS Protection

- Frontend: React автоматически экранирует вывод
- Backend: валидация входных данных через `class-validator`

```typescript
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}
```

---

## Развертывание

### Development (Разработка)

```powershell
# Backend
cd movie-aggregator-backend-nest
npm run start:dev

# Frontend
cd movie-aggregator-frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger: http://localhost:8080/swagger

### Production (Продакшн)

#### 1. Подготовка сервера

**Требования:**
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Node.js 18+
- MySQL 8.0+
- Nginx
- SSL сертификат (Let's Encrypt)

#### 2. Установка зависимостей

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# MySQL
sudo apt-get install mysql-server
sudo mysql_secure_installation

# Nginx
sudo apt-get install nginx

# PM2 (процесс-менеджер)
sudo npm install -g pm2
```

#### 3. Настройка MySQL

```sql
CREATE DATABASE warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cinemahub'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON warehouse.* TO 'cinemahub'@'localhost';
FLUSH PRIVILEGES;
```

#### 4. Развертывание Backend

```bash
# Клонировать репозиторий
git clone https://github.com/your-org/cinemahub.git
cd cinemahub/movie-aggregator-backend-nest

# Установить зависимости
npm ci --production

# Настроить .env
cp .env.example .env
nano .env

# Собрать
npm run build

# Запустить с PM2
pm2 start dist/main.js --name cinemahub-api
pm2 save
pm2 startup
```

#### 5. Развертывание Frontend

```bash
cd ../movie-aggregator-frontend

# Установить зависимости
npm ci

# Настроить .env
echo "VITE_API_URL=https://api.cinemahub.com" > .env

# Собрать
npm run build

# Скопировать в Nginx
sudo cp -r dist/* /var/www/cinemahub/
```

#### 6. Настройка Nginx

```nginx
# /etc/nginx/sites-available/cinemahub
server {
    listen 80;
    server_name cinemahub.com www.cinemahub.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cinemahub.com www.cinemahub.com;

    ssl_certificate /etc/letsencrypt/live/cinemahub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cinemahub.com/privkey.pem;

    root /var/www/cinemahub;
    index index.html;

    # Frontend (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Активировать конфигурацию
sudo ln -s /etc/nginx/sites-available/cinemahub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. SSL сертификат

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d cinemahub.com -d www.cinemahub.com
```

#### 8. Мониторинг

```bash
# Логи PM2
pm2 logs cinemahub-api

# Статус
pm2 status

# Мониторинг
pm2 monit

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Docker (альтернатива)

#### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./movie-aggregator-backend-nest
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=cinemahub
      - DB_PASS=password
      - DB_NAME=warehouse
    depends_on:
      - mysql
    volumes:
      - ./logs:/app/logs

  frontend:
    build: ./movie-aggregator-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: warehouse
      MYSQL_USER: cinemahub
      MYSQL_PASSWORD: password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database:/docker-entrypoint-initdb.d

volumes:
  mysql_data:
```

```bash
docker-compose up -d
```

---

## Устранение неполадок

### Backend не запускается

**Проблема:** `Error: Cannot find module`
```bash
# Решение: переустановить зависимости
rm -rf node_modules package-lock.json
npm install
```

**Проблема:** `ER_ACCESS_DENIED_ERROR: Access denied for user`
```bash
# Решение: проверить credentials в .env
# Убедитесь что пользователь существует и имеет права
mysql -u root -p
SHOW GRANTS FOR 'cinemahub'@'localhost';
```

**Проблема:** `Port 8080 is already in use`
```bash
# Решение: найти и остановить процесс
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Или изменить порт в .env
PORT=8081
```

### Frontend не подключается к Backend

**Проблема:** `Network Error` или CORS
```javascript
// Решение: проверить VITE_API_URL в .env
VITE_API_URL=http://localhost:8080

// Проверить CORS в backend .env
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### База данных

**Проблема:** `Error: Connection lost: The server closed the connection`
```sql
-- Решение: увеличить таймауты
SET GLOBAL connect_timeout=600;
SET GLOBAL wait_timeout=600;
SET GLOBAL interactive_timeout=600;
```

**Проблема:** Хранимая процедура не найдена
```sql
-- Решение: импортировать процедуры
SOURCE database/viewer-user-procedures.sql;
SOURCE database/critic-procedures.sql;
SOURCE database/triggers-procedures.sql;
```

### Логи

**Проблема:** Логи не создаются
```bash
# Решение: проверить права на папку
mkdir logs
chmod 755 logs

# Проверить переменные окружения
LOG_TO_FILES=true
LOG_DIR=./logs
```

**Проблема:** Логи слишком большие
```env
# Решение: уменьшить retention или уровень
LOG_LEVEL=warn
LOG_RETENTION_DAYS_INFO=7
```

### Performance

**Проблема:** Медленные запросы
```sql
-- Решение: добавить индексы
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_year ON content(year);
CREATE INDEX idx_reviews_content ON reviews(content_id);

-- Проверить медленные запросы
SHOW PROCESSLIST;
SELECT * FROM information_schema.processlist WHERE time > 5;
```

### JWT

**Проблема:** `Token expired` или `Invalid token`
```typescript
// Решение: обновить токен
// Frontend должен перенаправить на /login

// Или увеличить срок действия
JWT_EXPIRES=30d
```

---

## Контакты и поддержка

**Документация:** https://github.com/your-org/cinemahub/wiki  
**Issues:** https://github.com/your-org/cinemahub/issues  
**Email:** support@cinemahub.com

---

**Версия документации:** 1.0.0  
**Дата обновления:** 20 ноября 2025
