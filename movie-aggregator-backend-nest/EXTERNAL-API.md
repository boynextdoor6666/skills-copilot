# 🔗 External API Integration

## Обзор

CineVibe интегрирован с двумя внешними API для автоматического импорта контента:

- **TMDB (The Movie Database)** - фильмы и сериалы
- **IGDB (Internet Game Database)** - игры

## 🔑 Получение API ключей

### TMDB API

1. Зарегистрируйтесь на https://www.themoviedb.org/
2. Перейдите в Settings → API
3. Запросите API ключ (выберите "Developer")
4. Скопируйте "API Key (v3 auth)"

### IGDB API

IGDB использует Twitch OAuth 2.0:

1. Зарегистрируйтесь на https://dev.twitch.tv/
2. Включите Two-Factor Authentication
3. Перейдите в Developer Console → Applications
4. Создайте новое приложение:
   - Name: CineVibe (или любое)
   - OAuth Redirect URLs: http://localhost
   - Category: Application Integration
5. Скопируйте **Client ID** и **Client Secret**

## ⚙️ Настройка

Добавьте ключи в `.env` файл:

```env
# TMDB
TMDB_API_KEY=your_tmdb_api_key_here

# IGDB (Twitch OAuth)
IGDB_CLIENT_ID=your_twitch_client_id_here
IGDB_CLIENT_SECRET=your_twitch_client_secret_here
```

## 📡 API Endpoints

### Статус подключения

```
GET /api/external/status
```

Возвращает статус подключения к внешним API.

---

### TMDB - Фильмы

#### Поиск фильмов
```
GET /api/external/tmdb/search/movies?query=<поиск>&page=<страница>
```

#### Популярные фильмы
```
GET /api/external/tmdb/movies/popular?page=<страница>
```

#### Топ фильмов
```
GET /api/external/tmdb/movies/top-rated?page=<страница>
```

#### Предстоящие фильмы
```
GET /api/external/tmdb/movies/upcoming?page=<страница>
```

#### Детали фильма
```
GET /api/external/tmdb/movies/:id
```

---

### TMDB - Сериалы

#### Поиск сериалов
```
GET /api/external/tmdb/search/tv?query=<поиск>&page=<страница>
```

#### Популярные сериалы
```
GET /api/external/tmdb/tv/popular?page=<страница>
```

#### Детали сериала
```
GET /api/external/tmdb/tv/:id
```

---

### IGDB - Игры

#### Поиск игр
```
GET /api/external/igdb/search?query=<поиск>&limit=<лимит>
```

#### Популярные игры
```
GET /api/external/igdb/games/popular?limit=<лимит>
```

#### Топ игр
```
GET /api/external/igdb/games/top-rated?limit=<лимит>
```

#### Предстоящие игры
```
GET /api/external/igdb/games/upcoming?limit=<лимит>
```

#### Недавно вышедшие игры
```
GET /api/external/igdb/games/recent?limit=<лимит>
```

#### Детали игры
```
GET /api/external/igdb/games/:id
```

#### Список платформ
```
GET /api/external/igdb/platforms
```

#### Список жанров
```
GET /api/external/igdb/genres
```

---

### Импорт контента (требует роль ADMIN)

#### Импортировать фильм
```
POST /api/external/import/movie/:tmdbId
Authorization: Bearer <admin_token>
```

#### Импортировать сериал
```
POST /api/external/import/tv/:tmdbId
Authorization: Bearer <admin_token>
```

#### Импортировать игру
```
POST /api/external/import/game/:igdbId
Authorization: Bearer <admin_token>
```

#### Массовый импорт фильмов
```
POST /api/external/import/bulk/movies
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "tmdbIds": [550, 299536, 19404]
}
```

#### Массовый импорт игр
```
POST /api/external/import/bulk/games
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "igdbIds": [1020, 1942, 119171]
}
```

## 🔄 Rate Limiting

### TMDB
- 40 запросов за 10 секунд
- Автоматическое ожидание при превышении лимита

### IGDB
- 4 запроса в секунду
- Автоматическое ожидание при превышении лимита

## 📊 Маппинг данных

### TMDB → Content

| TMDB поле | Content поле |
|-----------|--------------|
| title/name | title |
| overview | description |
| release_date/first_air_date | release_year |
| genres | genre |
| runtime/episode_run_time | runtime |
| poster_path | poster_url |
| vote_average | tmdb_rating |
| credits.cast | cast, cast_photos |
| credits.crew (Director) | director, director_photo_url |
| videos (YouTube) | trailer_url |

### IGDB → Content

| IGDB поле | Content поле |
|-----------|--------------|
| name | title |
| summary | description |
| first_release_date | release_year |
| genres | genre |
| cover.image_id | poster_url |
| rating | igdb_rating |
| involved_companies (developer) | developer |
| involved_companies (publisher) | publisher |
| platforms | platforms |
| age_ratings (ESRB) | esrb_rating |
| game_modes | players |
| hypes | hype_index |
| videos | trailer_url |
| screenshots | screenshots |

## 🛠️ Пример использования

### JavaScript (Frontend)

```javascript
// Поиск фильмов
const searchMovies = async (query) => {
  const response = await axios.get('/api/external/tmdb/search/movies', {
    params: { query }
  });
  return response.data;
};

// Получить детали и импортировать
const importMovie = async (tmdbId, adminToken) => {
  const response = await axios.post(
    `/api/external/import/movie/${tmdbId}`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  return response.data;
};
```

### cURL

```bash
# Проверить статус API
curl http://localhost:8080/api/external/status

# Поиск фильмов
curl "http://localhost:8080/api/external/tmdb/search/movies?query=Matrix"

# Импорт фильма (требует токен админа)
curl -X POST http://localhost:8080/api/external/import/movie/603 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## ⚠️ Важные замечания

1. **API ключи обязательны** - без них интеграция не работает
2. **Только для админов** - импорт контента требует роль ADMIN
3. **Проверка дубликатов** - система не позволяет импортировать уже существующий контент
4. **Автоматическое преобразование** - данные автоматически конвертируются в формат CineVibe
5. **Жанры на русском** - TMDB и IGDB жанры автоматически переводятся

## 🔧 Swagger

Полная документация API доступна в Swagger UI:

```
http://localhost:8080/swagger
```

Найдите секцию "External API" для интерактивного тестирования.
