# Описание диаграммы развертывания системы CinemaHub

## 1. Общая информация

**Название системы:** CinemaHub — интеллектуальный агрегатор контента с эмоциональной аналитикой

**Тип диаграммы:** UML Deployment Diagram (Диаграмма развертывания)

**Назначение:** Документирование физической архитектуры распределённой информационной системы, включающей серверы приложений, серверы баз данных, клиентские устройства, сетевое оборудование, облачные ресурсы и их взаимодействие.

---

## 2. Описание узлов (Nodes)

### 2.1. Клиентское устройство (Client Device)
**Тип узла:** `<<Device>>`  
**Операционная система:** Windows 10/11, macOS 12+, Linux (Ubuntu/Fedora)  
**Назначение:** Устройство конечного пользователя для доступа к веб-приложению

**Артефакты:**
- **Browser (Браузер)** — среда выполнения `<<Execution Environment>>`
  - Поддерживаемые: Google Chrome 110+, Mozilla Firefox 115+, Microsoft Edge 110+
  - Требования: поддержка ES6+, Web Storage API, Fetch API
  - Роль: рендеринг интерфейса, выполнение JavaScript

- **React Frontend (Фронтенд приложение)** — `<<Web Application>>`
  - Технологический стек: React 18.2, Vite 5.0, TailwindCSS 3.3
  - Тип: Single Page Application (SPA)
  - Компоненты:
    - **Страницы и компоненты** — UI слой (HomePage, MovieDetails, Reviews и т.д.)
    - **Управление состоянием (Context API)** — глобальное состояние (AuthContext, ThemeContext)
    - **HTTP Клиент Axios** — взаимодействие с REST API
    - **TailwindCSS стили** — адаптивный дизайн

**Хранилище:** localStorage для JWT токенов, настроек пользователя

---

### 2.2. Backend Server (Сервер приложений)
**Тип узла:** `<<Application Server>>`  
**Операционная система:**  
- Разработка: Windows 11 / Ubuntu 22.04 LTS  
- Продакшн: Ubuntu 22.04 LTS / Windows Server 2022

**Рантайм:** Node.js v20.x LTS  
**Процесс-менеджер:** PM2 (для продакшн), nodemon (для разработки)  
**Порт:** 8080 (HTTP/HTTPS)  
**Протоколы:** HTTP 1.1, HTTPS (TLS 1.3), WebSocket (планируется)

**Технологический стек:**
- NestJS 10.x (фреймворк)
- TypeScript 5.x (язык)
- TypeORM 0.3.x (ORM)
- Winston 3.x (логирование)
- JWT (аутентификация)
- bcrypt (хеширование паролей)

**Артефакт: NestJS Backend** — `<<Web Service>>`

**Архитектура (слои):**

1. **Слой контроллеров (Controllers Layer)**
   - Назначение: обработка HTTP запросов, маршрутизация
   - Компоненты: AuthController, ContentController, ReviewsController, UsersController, CriticsController
   - Функции: валидация входных данных (DTO), сериализация ответов

2. **Слой сервисов (Services Layer)**
   - Назначение: бизнес-логика приложения
   - Компоненты: AuthService, ContentService, ReviewsService, UsersService, GamificationService
   - Функции: обработка бизнес-правил, вызов внешних API, публикация событий в Kafka

3. **Охранники и посредники (Guards & Middleware)**
   - **JwtAuthGuard** — проверка JWT токенов
   - **RolesGuard** — проверка ролей (user/critic/admin)
   - **RequestIdMiddleware** — генерация уникального request-id для корреляции
   - **CorsMiddleware** — настройка CORS политик

4. **Логгер Winston (Logger)**
   - Назначение: структурированное логирование
   - Формат: JSON для файлов, colorized для консоли
   - Уровни: debug, info, warn, error
   - Каналы: http, audit, system

5. **Стратегия JWT (JWT Strategy)**
   - Назначение: валидация и декодирование JWT токенов
   - Секрет: хранится в переменной окружения `JWT_SECRET`
   - Срок действия: 7 дней (configurable)

6. **TypeORM**
   - Назначение: взаимодействие с MySQL
   - Режим: connection pool (5-10 соединений)
   - Функции: 
     - Entity mapping (users, content, reviews, ratings)
     - Query building
     - Transaction management
     - Вызов хранимых процедур

**Артефакт: Файлы логов** — `./logs/`

Три типа лог-файлов с ежедневной ротацией:

1. **app-info-YYYY-MM-DD.log** (14 дней хранения)
   - Уровни: info, debug
   - Содержание: HTTP запросы/ответы, бизнес-события
   - Формат: JSON с полями timestamp, level, message, requestId, userId, duration

2. **app-error-YYYY-MM-DD.log** (30 дней хранения)
   - Уровни: error, warn
   - Содержание: исключения, ошибки БД, таймауты
   - Формат: JSON с полями timestamp, level, message, stack, context

3. **audit-YYYY-MM-DD.log** (90 дней хранения)
   - Уровень: info (канал audit)
   - Содержание: критические действия (CONTENT_DELETE, USER_BAN, ROLE_CHANGE)
   - Формат: JSON с полями timestamp, channel, action, userId, targetId, metadata

**Ротация логов:**
- Частота: ежедневно в 00:00
- Сжатие: gzip для архивных файлов
- Максимальный размер файла: 20MB (принудительная ротация)

---

### 2.3. MySQL Server (Сервер базы данных)
**Тип узла:** `<<Database Server>>`  
**Операционная система:** Ubuntu 22.04 LTS  
**СУБД:** MySQL 8.0.35+  
**Тип СУБД:** Реляционная СУБД (RDBMS)  
**Движок хранения:** InnoDB (транзакционный)  
**Порт:** 3306  
**Протокол:** TCP/IP (MySQL Client Protocol)  
**Кодировка:** UTF8MB4 (для эмодзи и международных символов)

**Артефакт: База данных `warehouse`** — `<<Database>>`

**Таблицы (7 основных):**

1. **content** — контент (фильмы, сериалы, игры)
   - Поля: id, title, type, year, description, rating, metascore, user_score, director, cast (JSON), genres (JSON), poster_url, backdrop_url, created_at, updated_at
   - Индексы: PRIMARY KEY (id), INDEX (type), INDEX (year), INDEX (rating), FULLTEXT (title)
   - Связи: 1:N с reviews, 1:N с ratings

2. **users** — пользователи системы
   - Поля: id, username, email, password (bcrypt hash), role (ENUM: user/critic/admin), avatar, bio, level, experience, is_active, created_at, updated_at
   - Индексы: PRIMARY KEY (id), UNIQUE (username), UNIQUE (email)
   - Связи: 1:N с reviews, 1:N с ratings

3. **reviews** — отзывы зрителей
   - Поля: id, content_id, user_id, rating (1-10), text, emotions (JSON array), created_at, updated_at
   - Индексы: PRIMARY KEY (id), FOREIGN KEY (content_id), FOREIGN KEY (user_id), INDEX (content_id), INDEX (user_id)
   - Связи: N:1 с content, N:1 с users

4. **ratings** — быстрые оценки
   - Поля: id, content_id, user_id, rating (1-10), created_at
   - Индексы: PRIMARY KEY (id), UNIQUE (user_id, content_id), INDEX (content_id)
   - Связи: N:1 с content, N:1 с users

5. **critics** — профессиональные критики
   - Поля: id, name, publication, avatar, bio, specialization (JSON), followers_count, created_at
   - Индексы: PRIMARY KEY (id)
   - Связи: 1:N с critic_reviews

6. **hero_carousel** — элементы героической карусели на главной
   - Поля: id, content_id, image, title, subtitle, order, active, created_at
   - Индексы: PRIMARY KEY (id), FOREIGN KEY (content_id), INDEX (active)

7. **coming_soon** — грядущие релизы
   - Поля: id, title, type, release_date, poster, description, hype_index, created_at
   - Индексы: PRIMARY KEY (id), INDEX (release_date)

**Хранимые процедуры (4 основных):**

1. **add_review_viewer(p_content_id, p_user_id, p_rating, p_text, p_emotions)**
   - Назначение: добавить отзыв зрителя
   - Действия:
     - Вставка записи в таблицу `reviews`
     - Начисление +10 опыта пользователю
     - Вызов процедуры пересчёта рейтинга
   - Возврат: id нового отзыва

2. **publish_pro_review(p_content_id, p_critic_id, p_score, p_verdict, p_text)**
   - Назначение: опубликовать профессиональную рецензию
   - Действия:
     - Вставка в таблицу `critic_reviews`
     - Инкремент счётчика positive/mixed/negative_reviews в `content`
     - Начисление +50 опыта критику
   - Возврат: id рецензии

3. **RecalculateMovieRatings(p_content_id)**
   - Назначение: пересчитать агрегированный рейтинг контента
   - Логика:
     - Вычисление среднего `rating` из таблицы `reviews`
     - Вычисление среднего `user_score` из таблицы `ratings`
     - Обновление полей `rating` и `user_score` в таблице `content`
   - Вызывается: автоматически триггером `after_review_insert`

4. **get_content_details(p_content_id)**
   - Назначение: получить полные детали контента (с агрегатами)
   - Возврат: JSON объект с деталями контента, статистикой отзывов, средними оценками

**Триггеры (3 основных):**

1. **after_review_insert** (AFTER INSERT ON reviews)
   - Действие: вызов `RecalculateMovieRatings(NEW.content_id)`
   - Цель: автоматический пересчёт рейтинга при добавлении отзыва

2. **after_rating_insert** (AFTER INSERT ON ratings)
   - Действие: начисление +10 опыта пользователю, вызов `RecalculateMovieRatings`
   - Цель: геймификация и обновление рейтинга

3. **UpdateAggregateRatings** (AFTER UPDATE ON content)
   - Действие: обновление кэшированных агрегатов при изменении контента
   - Цель: поддержка консистентности данных

**Конфигурация:**
- Пул соединений: 10-50 соединений
- Таймауты: connect_timeout=10s, wait_timeout=28800s
- Буферы: innodb_buffer_pool_size=2G (для сервера с 8GB RAM)
- Логи: slow_query_log включен (threshold 2s)
- Резервное копирование: ежедневное в 03:00 UTC (mysqldump)

---

### 2.4. Analytics Infrastructure (Аналитическая инфраструктура)
**Тип узла:** `<<Container Platform>>`  
**Платформа контейнеризации:** Docker 24.x + Docker Compose 2.x  
**Операционная система хоста:** Ubuntu 22.04 LTS  
**Назначение:** обработка событий пользователей в реальном времени и хранение аналитических данных

**Компоненты:**

#### 2.4.1. Apache Kafka
**Тип:** `<<Message Broker>>`  
**Версия:** 3.6+  
**Порт:** 9092  
**Протокол:** Kafka Protocol (бинарный TCP)  
**Роль:** брокер сообщений для потоковой передачи событий

**Топики:**
- `user-events` (3 партиции, replication factor 1)
  - События: VIEW_CONTENT, ADD_REVIEW, ADD_RATING, SEARCH, FOLLOW_CRITIC
  - Формат: JSON с полями { timestamp, userId, action, contentId, metadata }
  - Retention: 7 дней

**Продюсеры:**
- NestJS Backend (публикует события через KafkaJS client)

**Консьюмеры:**
- PySpark streaming job (читает события для обработки)

**Конфигурация:**
- log.retention.hours=168 (7 дней)
- num.partitions=3 (параллелизм)
- compression.type=lz4

#### 2.4.2. Apache ZooKeeper
**Тип:** `<<Coordination Service>>`  
**Версия:** 3.8+  
**Порт:** 2181  
**Протокол:** ZooKeeper Protocol  
**Роль:** координация и управление метаданными Kafka кластера

**Функции:**
- Хранение конфигурации Kafka
- Выбор лидера партиций
- Мониторинг состояния брокеров

#### 2.4.3. PySpark
**Тип:** `<<Stream Processing>>`  
**Версия:** Python 3.11 + PySpark 3.5  
**Порт:** 4040 (веб-интерфейс Spark UI)  
**Технологии:** Apache Spark Structured Streaming, Kafka Connector

**Артефакт:** `stream_to_clickhouse.py` — скрипт потоковой обработки

**Логика обработки:**
1. Чтение событий из Kafka топика `user-events` (микробатчи по 5 секунд)
2. Парсинг JSON событий
3. Фильтрация и валидация данных
4. Агрегация метрик:
   - Подсчёт просмотров контента (по contentId)
   - Подсчёт уникальных пользователей (по userId)
   - Вычисление трендов рейтингов (скользящее среднее)
5. Запись агрегатов в ClickHouse (пакетная вставка через HTTP API)

**Зависимости (requirements.txt):**
```
pyspark==3.5.0
kafka-python==2.0.2
clickhouse-driver==0.2.6
python-dotenv==1.0.0
```

**Режимы работы:**
- Real-time streaming (обработка в течение 5-10 секунд)
- Batch processing (ночная агрегация исторических данных)

#### 2.4.4. ClickHouse
**Тип:** `<<OLAP Database Server>>`  
**Версия:** 23.x  
**Тип СУБД:** Колоночная СУБД (Columnar DBMS) для OLAP  
**Порты:** 8123 (HTTP API), 9000 (Native TCP)  
**Протоколы:** HTTP, gRPC, Native TCP  
**Движок:** MergeTree (оптимизирован для больших таблиц)

**Артефакт: База данных `analytics`** — `<<Analytical Database>>`

**Таблицы (3 основных):**

1. **user_activity_log** — лог активности пользователей
   - Поля: timestamp (DateTime), user_id (UInt32), action (String), content_id (UInt32), content_type (Enum8), session_id (String), ip_address (String), user_agent (String)
   - Engine: MergeTree
   - Партиционирование: PARTITION BY toYYYYMM(timestamp)
   - Сортировка: ORDER BY (timestamp, user_id)
   - TTL: 90 дней
   - Размер: ~100M записей/месяц (при 10K активных пользователей)

2. **content_views** — просмотры контента (агрегированные)
   - Поля: date (Date), content_id (UInt32), views (UInt64), unique_users (UInt64)
   - Engine: SummingMergeTree (автоматическая агрегация при слиянии)
   - Партиционирование: PARTITION BY toYYYYMM(date)
   - Сортировка: ORDER BY (date, content_id)
   - Materialized views: daily_views, weekly_views, monthly_views

3. **rating_trends** — тренды рейтингов
   - Поля: date (Date), content_id (UInt32), avg_rating (Float64), reviews_count (UInt64), sentiment_score (Float64)
   - Engine: ReplacingMergeTree (дедупликация по date + content_id)
   - Партиционирование: PARTITION BY toYYYYMM(date)
   - Сортировка: ORDER BY (date, content_id)

**Типичные запросы:**
```sql
-- Топ-10 популярных фильмов за последние 7 дней
SELECT content_id, sum(views) as total_views
FROM analytics.content_views
WHERE date >= today() - 7
GROUP BY content_id
ORDER BY total_views DESC
LIMIT 10;

-- Активность пользователей по часам
SELECT toHour(timestamp) as hour, count() as events
FROM analytics.user_activity_log
WHERE timestamp >= now() - INTERVAL 1 DAY
GROUP BY hour
ORDER BY hour;
```

**Производительность:**
- Скорость вставки: ~1M строк/сек
- Скорость запросов: <100ms для агрегации миллионов строк
- Сжатие: ~10x (LZ4 compression)

**Конфигурация:**
- max_memory_usage=10GB
- max_threads=8
- merge_tree_max_rows_to_use_cache=1000000

---

### 2.5. External Services (Внешние сервисы)
**Тип узла:** `<<Cloud Services>>`  
**Протокол:** HTTPS  
**Формат данных:** JSON, XML  
**Назначение:** интеграция с внешними API для получения метаданных контента

**Компоненты:**

1. **TMDB API** (The Movie Database) — `<<REST API>>`
   - URL: https://api.themoviedb.org/3/
   - Аутентификация: API Key (в заголовке)
   - Данные: фильмы, сериалы (метаданные, постеры, актёры, рейтинги)
   - Rate limit: 40 запросов/10 секунд
   - Использование: импорт базовых данных о контенте

2. **IGDB API** (Internet Game Database) — `<<REST API>>`
   - URL: https://api.igdb.com/v4/
   - Аутентификация: OAuth 2.0 (Client Credentials)
   - Данные: игры (метаданные, обложки, жанры, платформы)
   - Rate limit: 4 запроса/секунду
   - Использование: импорт данных о играх

3. **OpenCritic API** — `<<REST API>>`
   - URL: https://api.opencritic.com/api/
   - Аутентификация: API Key
   - Данные: профессиональные рецензии на игры
   - Rate limit: 60 запросов/минуту
   - Использование: агрегация критических оценок

4. **Metacritic** — `<<Web Scraping>>`
   - URL: https://www.metacritic.com/
   - Метод: HTTP парсинг (Cheerio/Puppeteer)
   - Данные: Metascore (агрегированная оценка критиков)
   - Ограничение: robots.txt, User-Agent rotation
   - Использование: получение Metascore для фильмов/игр/сериалов

**Стратегия интеграции:**
- Кеширование ответов в Redis (TTL 24 часа)
- Retry механизм (3 попытки с экспоненциальной задержкой)
- Circuit breaker (отключение при 5 последовательных ошибках)
- Rate limiting на стороне клиента

---

### 2.6. Cloud Platform (Облачная платформа) — опционально
**Тип узла:** `<<Cloud Infrastructure>>`  
**Провайдеры:** AWS, Microsoft Azure, Google Cloud Platform  
**Назначение:** масштабируемое развертывание в облаке (для продакшн среды)

**Компоненты:**

1. **EC2/VM Instance** (виртуальные машины)
   - AWS: EC2 t3.medium (2 vCPU, 4GB RAM) для Backend
   - Azure: B2s Standard (2 vCPU, 4GB RAM)
   - GCP: e2-medium (2 vCPU, 4GB RAM)
   - Конфигурация: Auto Scaling Group (2-10 инстансов)

2. **RDS/Managed Database** (управляемая БД)
   - AWS: RDS for MySQL (db.t3.medium, Multi-AZ)
   - Azure: Azure Database for MySQL (General Purpose)
   - GCP: Cloud SQL for MySQL (db-n1-standard-2)
   - Резервные копии: автоматические ежедневные

3. **S3/Blob Storage** (объектное хранилище)
   - Назначение: хранение медиа-файлов (постеры, аватары, видео)
   - AWS: S3 bucket с CloudFront CDN
   - Azure: Blob Storage с Azure CDN
   - GCP: Cloud Storage с Cloud CDN

4. **CloudFront/CDN** (сеть доставки контента)
   - Назначение: кеширование и доставка статических файлов Frontend
   - Конфигурация: edge locations по всему миру
   - Кеш: HTML (5 мин), CSS/JS (1 день), изображения (7 дней)

5. **Load Balancer** (балансировщик нагрузки)
   - AWS: Application Load Balancer (ALB)
   - Azure: Azure Load Balancer
   - GCP: Cloud Load Balancing
   - Алгоритм: Round Robin / Least Connections
   - Health checks: HTTP GET /api/health каждые 30 секунд

**Мониторинг и алертинг:**
- AWS: CloudWatch Logs, CloudWatch Alarms
- Azure: Azure Monitor, Application Insights
- GCP: Cloud Monitoring, Cloud Logging
- Метрики: CPU, Memory, Disk I/O, Network, Request Rate, Error Rate, Latency

**Стратегия развертывания:**
- Среда разработки: локальный сервер (localhost)
- Среда тестирования: single instance в облаке
- Среда продакшн: multi-instance с load balancer, auto-scaling, multi-AZ

---

## 3. Описание связей (Communication Paths)

### 3.1. Клиент ↔ Фронтенд
**Протокол:** HTTP/1.1, HTTPS  
**Направление:** двустороннее  
**Описание:** Браузер загружает и выполняет React приложение, рендерит DOM, обрабатывает события пользователя

### 3.2. Фронтенд ↔ Бэкенд
**Протокол:** HTTP/1.1, HTTPS  
**Формат:** JSON (Content-Type: application/json)  
**Порт:** 8080  
**Аутентификация:** Bearer JWT (заголовок `Authorization: Bearer <token>`)  
**CORS:** разрешён для http://localhost:5173, http://localhost:5174  
**Описание:** REST API вызовы для всех операций (аутентификация, CRUD контента, отзывы)

**Примеры запросов:**
```http
GET /api/content?type=movie&limit=50
POST /api/auth/login
POST /api/reviews
GET /api/users/me
```

### 3.3. Бэкенд → Внутренний поток
**Controllers → Services:** вызов методов бизнес-логики  
**Services → Guards:** проверка прав доступа (JwtAuthGuard, RolesGuard)  
**Services → ORM:** выполнение SQL запросов через TypeORM  
**Guards → JWT:** валидация токена  
**Controllers → Logger:** логирование HTTP запросов/ответов, ошибок

### 3.4. Бэкенд ↔ MySQL
**Протокол:** TCP/IP (MySQL Client Protocol)  
**Порт:** 3306  
**Аутентификация:** username/password  
**Пул соединений:** 5-10 соединений (configurable)  
**Описание:** TypeORM выполняет SQL запросы (SELECT, INSERT, UPDATE, DELETE), вызывает хранимые процедуры

**Примеры запросов:**
```sql
SELECT * FROM content WHERE type = 'movie' LIMIT 50;
CALL add_review_viewer(1, 42, 9, 'Отличный фильм!', '["Восторг"]');
UPDATE users SET experience = experience + 10 WHERE id = 42;
```

### 3.5. Бэкенд → Внешние API
**Протокол:** HTTPS  
**Формат:** JSON  
**Описание:** Backend запрашивает метаданные контента из внешних сервисов (TMDB, IGDB, OpenCritic, Metacritic)

**Стратегия:**
- Кеширование в памяти (10 минут) + Redis (24 часа)
- Асинхронные запросы (Promise.all для параллелизма)
- Обработка ошибок (fallback на локальные данные)

### 3.6. Бэкенд → Kafka
**Протокол:** Kafka Protocol (бинарный TCP)  
**Порт:** 9092  
**Библиотека:** KafkaJS  
**Роль:** Producer (публикация событий)  
**Описание:** Backend публикует события пользователей в топик `user-events`

**Пример события:**
```json
{
  "timestamp": "2025-11-21T10:30:00.000Z",
  "userId": 42,
  "action": "VIEW_CONTENT",
  "contentId": 123,
  "contentType": "movie",
  "metadata": {
    "sessionId": "abc123",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 3.7. Kafka ↔ ZooKeeper
**Протокол:** ZooKeeper Protocol  
**Порт:** 2181  
**Описание:** Kafka использует ZooKeeper для координации кластера, хранения метаданных, выбора лидера партиций

### 3.8. PySpark → Kafka
**Протокол:** Kafka Protocol  
**Порт:** 9092  
**Роль:** Consumer (чтение событий)  
**Описание:** PySpark читает события из топика `user-events` с помощью Structured Streaming, обрабатывает микробатчи (по 5 секунд)

### 3.9. PySpark → ClickHouse
**Протокол:** HTTP (ClickHouse HTTP API)  
**Порт:** 8123  
**Формат:** JSON, TSV  
**Описание:** PySpark выполняет пакетные INSERT запросы для записи агрегированных данных

**Пример запроса:**
```python
clickhouse_client.execute(
    "INSERT INTO analytics.content_views (date, content_id, views, unique_users) VALUES",
    aggregated_data
)
```

### 3.10. Logger → Файлы логов
**Механизм:** winston-daily-rotate-file  
**Формат:** JSON  
**Описание:** Winston транспорты записывают логи в файлы с ежедневной ротацией

---

## 4. Протоколы и порты

| Компонент | Порт | Протокол | Назначение |
|-----------|------|----------|------------|
| Vite dev server | 5173, 5174 | HTTP | Frontend разработка |
| NestJS Backend | 8080 | HTTP/HTTPS | REST API |
| MySQL | 3306 | TCP/IP (MySQL Protocol) | База данных |
| Kafka | 9092 | Kafka Protocol | Брокер сообщений |
| ZooKeeper | 2181 | ZooKeeper Protocol | Координация |
| PySpark UI | 4040 | HTTP | Мониторинг Spark |
| ClickHouse HTTP | 8123 | HTTP | Запросы к ClickHouse |
| ClickHouse Native | 9000 | TCP (Native Protocol) | Нативный клиент |

---

## 5. Операционные системы и платформы

| Узел | Разработка | Продакшн |
|------|------------|----------|
| Клиент | Windows 10/11, macOS, Linux | Любая ОС с браузером |
| Backend Server | Windows 11 / Ubuntu 22.04 | Ubuntu 22.04 LTS / Windows Server 2022 |
| MySQL Server | Windows / Ubuntu 22.04 | Ubuntu 22.04 LTS |
| Analytics (Docker host) | Windows 11 (Docker Desktop) | Ubuntu 22.04 LTS (Docker Engine) |
| Cloud Infrastructure | - | AWS / Azure / GCP (Linux VMs) |

---

## 6. Технологические стеки

### Frontend
- **Фреймворк:** React 18.2
- **Сборщик:** Vite 5.0
- **Язык:** JavaScript (ES6+)
- **Стили:** TailwindCSS 3.3
- **HTTP клиент:** Axios 1.6
- **Роутинг:** React Router 6.x
- **Состояние:** Context API, useState, useReducer

### Backend
- **Фреймворк:** NestJS 10.x
- **Язык:** TypeScript 5.x
- **Рантайм:** Node.js 20.x LTS
- **ORM:** TypeORM 0.3.x
- **Валидация:** class-validator, class-transformer
- **Логирование:** Winston 3.x + winston-daily-rotate-file
- **Аутентификация:** @nestjs/jwt, passport-jwt
- **Безопасность:** bcrypt (хеширование), helmet (HTTP headers)
- **Тестирование:** Jest, Supertest

### Database
- **СУБД:** MySQL 8.0.35
- **Движок:** InnoDB
- **Инструменты:** MySQL Workbench, Adminer

### Analytics
- **Брокер сообщений:** Apache Kafka 3.6
- **Обработка потоков:** PySpark 3.5 (Python 3.11)
- **Аналитическая БД:** ClickHouse 23.x
- **Координация:** Apache ZooKeeper 3.8
- **Контейнеризация:** Docker 24.x, Docker Compose 2.x

### Deployment
- **Процесс-менеджер:** PM2 (Node.js)
- **Веб-сервер:** nginx (reverse proxy, SSL termination)
- **SSL:** Let's Encrypt (Certbot)
- **Мониторинг:** PM2 Monit, MySQL slow query log

---

## 7. Сценарии развертывания

### 7.1. Разработка (Development)
**Окружение:** localhost / 127.0.0.1

**Шаги:**
1. Запустить MySQL локально (порт 3306)
2. Импортировать схему БД и процедуры
3. Запустить NestJS: `npm run start:dev` (порт 8080)
4. Запустить Vite: `npm run dev` (порт 5173)
5. (Опционально) Запустить Docker Compose для аналитики

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger: http://localhost:8080/swagger

### 7.2. Тестирование (Staging)
**Окружение:** облачный single instance

**Компоненты:**
- EC2 t3.medium (Backend + MySQL)
- S3 bucket (статика Frontend)
- CloudFront (CDN)

**Конфигурация:**
- SSL сертификат (Let's Encrypt)
- nginx reverse proxy
- PM2 для управления процессами

### 7.3. Продакшн (Production)
**Окружение:** облачная инфраструктура с автомасштабированием

**Компоненты:**
- **Frontend:** CloudFront + S3 (или Azure CDN + Blob Storage)
- **Backend:** Auto Scaling Group (2-10 EC2 инстансов) за Application Load Balancer
- **БД:** RDS for MySQL (Multi-AZ, автобэкапы)
- **Аналитика:** Managed Kafka (AWS MSK / Confluent Cloud), отдельный EC2 для PySpark, Managed ClickHouse (Altinity / ClickHouse Cloud)
- **Мониторинг:** CloudWatch / Azure Monitor + PagerDuty для алертов

**Масштабирование:**
- Горизонтальное: Auto Scaling на основе CPU > 70% или Request Rate
- Вертикальное: увеличение размера инстансов при необходимости
- БД: Read Replicas для разгрузки чтения

**Безопасность:**
- WAF (Web Application Firewall) перед Load Balancer
- Security Groups / Network Security Groups (whitelist портов)
- Secrets Manager для хранения паролей и API ключей
- VPC / Virtual Network для изоляции сетей
- SSL/TLS everywhere (HTTPS, TLS 1.3)

---

## 8. Особенности развертывания

### 8.1. Использование контейнеров
**Технология:** Docker + Docker Compose

**Преимущества:**
- Изоляция сервисов (Kafka, ZooKeeper, PySpark, ClickHouse)
- Упрощённое развертывание (одна команда `docker-compose up`)
- Портативность (одинаковая среда на dev/staging/production)
- Версионирование образов

**docker-compose.yml (упрощённая версия):**
```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    ports: ["2181:2181"]
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports: ["9092:9092"]
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181

  clickhouse:
    image: clickhouse/clickhouse-server:23.8
    ports: ["8123:8123", "9000:9000"]
    volumes:
      - clickhouse_data:/var/lib/clickhouse

  pyspark:
    build: ./pyspark
    depends_on: [kafka, clickhouse]
    volumes:
      - ./pyspark:/app

volumes:
  clickhouse_data:
```

### 8.2. Использование виртуальных машин
**Сценарий:** продакшн без Docker

**Конфигурация:**
- Каждый компонент на отдельной VM (Backend, MySQL, Kafka, ClickHouse)
- nginx на frontend VM для обслуживания статики
- firewall правила для ограничения доступа

**Преимущества:**
- Полный контроль над ОС
- Проще интегрировать с legacy системами
- Меньше оверхед по сравнению с контейнерами

**Недостатки:**
- Сложнее управление зависимостями
- Дольше процесс настройки
- Меньше изоляции

### 8.3. Облачные платформы
**Провайдеры:** AWS, Azure, GCP

**Managed Services (рекомендуется):**
- AWS: RDS (MySQL), MSK (Kafka), S3 + CloudFront
- Azure: Azure Database for MySQL, Event Hubs (Kafka-compatible), Blob Storage + CDN
- GCP: Cloud SQL, Cloud Pub/Sub, Cloud Storage + CDN

**Преимущества:**
- Автоматическое резервное копирование
- Высокая доступность (Multi-AZ)
- Автомасштабирование
- Управляемые обновления

---

## 9. Безопасность

### 9.1. Аутентификация
- **JWT токены:** подписываются секретным ключом (HS256), срок действия 7 дней
- **Хеширование паролей:** bcrypt с солью (10 rounds)
- **Refresh tokens:** (планируется) для обновления доступа без повторного ввода пароля

### 9.2. Авторизация
- **RBAC (Role-Based Access Control):** 3 роли (user, critic, admin)
- **Guards:** проверка ролей на каждом защищённом эндпоинте
- **Декораторы:** `@Roles(UserRole.ADMIN)` для указания требуемой роли

### 9.3. Защита от атак
- **SQL Injection:** TypeORM автоматически экранирует параметры
- **XSS:** React автоматически экранирует вывод, CSP заголовки
- **CSRF:** SameSite cookies (планируется)
- **Rate Limiting:** @nestjs/throttler (100 запросов/минуту)
- **CORS:** whitelist разрешённых origins

### 9.4. Сетевая безопасность
- **Firewall:** разрешить только порты 80, 443, 22 (SSH)
- **VPC/Virtual Network:** изоляция компонентов в приватные подсети
- **Security Groups:** ограничение доступа между компонентами (например, только Backend → MySQL)

---

## 10. Мониторинг и логирование

### 10.1. Логирование
**Инструмент:** Winston с ежедневной ротацией

**Стратегия:**
- **Info logs** (14 дней): HTTP запросы, бизнес-события
- **Error logs** (30 дней): ошибки, исключения
- **Audit logs** (90 дней): критические действия (удаление контента, изменение ролей)

**Корреляция:** request-id (UUID) для связывания всех событий одного запроса

### 10.2. Мониторинг
**Метрики:**
- CPU, Memory, Disk I/O (системные)
- Request Rate, Error Rate, Latency (приложение)
- Database Connections, Query Time (БД)
- Kafka Lag, Throughput (аналитика)

**Инструменты:**
- PM2 Monit (Node.js)
- MySQL slow query log (медленные запросы)
- Prometheus + Grafana (планируется)
- CloudWatch / Azure Monitor (облако)

### 10.3. Алертинг
**Условия:**
- CPU > 80% в течение 5 минут
- Error Rate > 5%
- Latency p99 > 2 секунд
- Database connections > 90% pool size

**Каналы:** email, Slack, PagerDuty

---

## 11. Масштабируемость

### 11.1. Горизонтальное масштабирование
**Backend:**
- Load Balancer распределяет запросы между N инстансами
- Stateless приложение (состояние в БД, JWT токены)
- Session affinity не требуется

**Kafka:**
- Увеличение числа партиций топика для параллелизма
- Добавление брокеров в кластер

**ClickHouse:**
- Sharding (горизонтальное разделение данных по серверам)
- Replication (репликация для отказоустойчивости)

### 11.2. Вертикальное масштабирование
**MySQL:**
- Увеличение размера инстанса (больше CPU, RAM)
- Оптимизация буферов (innodb_buffer_pool_size)

**Backend:**
- Увеличение размера EC2 инстанса
- Оптимизация кода (async/await, кеширование)

### 11.3. Кеширование
**Redis** (планируется):
- Кеш для внешних API (TTL 24 часа)
- Кеш для популярных запросов (топ-10 фильмов)
- Session store (альтернатива JWT)

---

## 12. Заключение

Диаграмма развертывания системы CinemaHub демонстрирует современную распределённую архитектуру с разделением на 5 основных уровней:

1. **Client Tier** — клиентские устройства с браузерами
2. **Application Tier** — сервер приложений (NestJS)
3. **Data Tier** — реляционная БД (MySQL)
4. **Analytics Tier** — потоковая обработка и аналитика (Kafka, PySpark, ClickHouse)
5. **External Services** — интеграции с внешними API

**Ключевые особенности:**
- **Микросервисная** архитектура (Backend, Analytics разделены)
- **Event-driven** подход (события в Kafka)
- **Колоночная СУБД** для аналитики (ClickHouse)
- **Контейнеризация** аналитических сервисов (Docker Compose)
- **Облачная** готовность (легко развернуть на AWS/Azure/GCP)
- **Масштабируемость** (horizontal scaling для Backend и Kafka)
- **Observability** (подробное логирование, мониторинг)

Система спроектирована для обработки высоких нагрузок (10K+ активных пользователей), обеспечивает быструю разработку (Vite HMR, TypeORM migrations) и простое развертывание (Docker Compose, PM2).

---

**Версия документа:** 1.0  
**Дата:** 21 ноября 2025  
**Автор:** Документация системы CinemaHub
