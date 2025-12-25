# Analytics Stack: Kafka + PySpark + ClickHouse

Аналитический стек CineVibe для сбора, обработки и анализа событий в реальном времени.

## 🏗️ Архитектура

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   NestJS    │────▶│    Kafka    │────▶│   PySpark   │────▶│ ClickHouse  │
│   Backend   │     │   (Events)  │     │  (ETL/Agg)  │     │   (OLAP)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                                       │
                           │                                       │
                    ┌──────┴──────┐                         ┌──────┴──────┐
                    │  Kafka UI   │                         │   NestJS    │
                    │  (Monitor)  │                         │  Analytics  │
                    └─────────────┘                         └─────────────┘
```

## 🚀 Быстрый старт

### 1. Запуск инфраструктуры

```bash
cd analytics
docker-compose up -d
```

Это запустит:
- **Zookeeper**: порт 2181
- **Kafka**: порт 9092 (внешний), 29092 (внутренний)
- **Kafka UI**: http://localhost:8090
- **ClickHouse**: порт 8123 (HTTP), 9000 (Native)
- **Spark Master**: http://localhost:8081
- **Spark Worker**: подключен к Master

### 2. Проверка статуса

```bash
# Проверить Kafka
docker exec cinevibe-kafka kafka-topics.sh --bootstrap-server localhost:9092 --list

# Проверить ClickHouse
docker exec cinevibe-clickhouse clickhouse-client --query "SHOW DATABASES"

# Открыть Kafka UI
# http://localhost:8090
```

### 3. Настройка Backend

Добавьте в `.env`:

```env
# Включить Kafka
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=cinevibe-backend

# Включить ClickHouse
CLICKHOUSE_ENABLED=true
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=analytics
```

### 4. Запуск PySpark Job

```bash
# Установить зависимости
pip install -r pyspark/requirements.txt

# Запустить все стримы
python pyspark/analytics_jobs.py --job stream-all

# Или отдельные стримы
python pyspark/analytics_jobs.py --job stream-reviews
python pyspark/analytics_jobs.py --job stream-users
python pyspark/analytics_jobs.py --job stream-content

# Batch агрегации
python pyspark/analytics_jobs.py --job batch-all --date 2025-11-29
```

## 📊 Kafka Topics

| Topic | Описание | События |
|-------|----------|---------|
| `reviews` | События отзывов | `review_created`, `review_deleted`, `rating_changed` |
| `users` | События пользователей | `user_registered`, `user_login`, `achievement_unlocked` |
| `content` | События контента | `content_viewed`, `content_searched`, `content_imported` |

## 🗃️ ClickHouse Tables

### Raw Events
- `analytics.reviews_events` - сырые события отзывов
- `analytics.user_events` - события пользователей
- `analytics.content_events` - события контента

### Aggregations
- `analytics.content_daily_stats` - дневная статистика по контенту
- `analytics.hourly_activity` - почасовая активность
- `analytics.user_activity_daily` - дневная активность пользователей
- `analytics.content_popularity` - популярность контента

### Materialized Views
- `analytics.mv_content_review_counts` - счётчики отзывов в реальном времени
- `analytics.mv_hourly_events` - почасовые счётчики событий

## 🔌 API Endpoints

### Статус
```
GET /api/analytics/realtime/status
```

### Аналитика по контенту
```
GET /api/analytics/realtime/content/:contentId
GET /api/analytics/realtime/top-content?type=MOVIE&limit=10&days=7
```

### Активность пользователя
```
GET /api/analytics/realtime/user/:userId
```

### Тренды
```
GET /api/analytics/realtime/trends/reviews?days=30
GET /api/analytics/realtime/distribution/ratings?type=MOVIE
GET /api/analytics/realtime/emotions?contentId=1
GET /api/analytics/realtime/activity/hourly
```

## 📈 Примеры запросов ClickHouse

### Топ контента за неделю
```sql
SELECT 
    content_id,
    content_type,
    sum(views_count) as views,
    sum(reviews_count) as reviews,
    avg(avg_rating) as rating
FROM analytics.content_daily_stats
WHERE date >= today() - 7
GROUP BY content_id, content_type
ORDER BY views + reviews * 10 DESC
LIMIT 10;
```

### Активность по часам
```sql
SELECT 
    toHour(hour) as h,
    sum(count) as total
FROM analytics.hourly_activity
WHERE hour >= now() - INTERVAL 24 HOUR
GROUP BY h
ORDER BY h;
```

### Распределение рейтингов
```sql
SELECT 
    floor(rating) as rating_bucket,
    count() as cnt
FROM analytics.reviews_events
WHERE rating IS NOT NULL
GROUP BY rating_bucket
ORDER BY rating_bucket;
```

## 🛠️ Разработка

### Структура файлов

```
analytics/
├── docker-compose.yml          # Инфраструктура
├── README.md                   # Документация
├── clickhouse/
│   └── init/
│       └── 01_init_schema.sql  # Схема ClickHouse
└── pyspark/
    ├── requirements.txt        # Python зависимости
    ├── stream_to_clickhouse.py # Базовый стрим (legacy)
    └── analytics_jobs.py       # Все PySpark jobs
```

### Добавление нового события

1. Добавьте тип в `KafkaService` (NestJS)
2. Добавьте схему в `analytics_jobs.py` (PySpark)
3. Добавьте таблицу в `01_init_schema.sql` (ClickHouse)
4. Добавьте endpoint в `AnalyticsController` (NestJS)

## ⚙️ Конфигурация

### Kafka
| Переменная | Default | Описание |
|------------|---------|----------|
| `KAFKA_ENABLED` | `false` | Включить Kafka |
| `KAFKA_BROKERS` | `localhost:9092` | Адреса брокеров |
| `KAFKA_CLIENT_ID` | `cinevibe-backend` | ID клиента |

### ClickHouse
| Переменная | Default | Описание |
|------------|---------|----------|
| `CLICKHOUSE_ENABLED` | `false` | Включить ClickHouse |
| `CLICKHOUSE_HOST` | `localhost` | Хост |
| `CLICKHOUSE_PORT` | `8123` | HTTP порт |
| `CLICKHOUSE_DATABASE` | `analytics` | База данных |

## 🔧 Troubleshooting

### Kafka не подключается
```bash
# Проверить логи
docker logs cinevibe-kafka

# Проверить что Zookeeper работает
docker exec cinevibe-zookeeper zkServer.sh status
```

### ClickHouse ошибки
```bash
# Проверить логи
docker logs cinevibe-clickhouse

# Подключиться к CLI
docker exec -it cinevibe-clickhouse clickhouse-client
```

### PySpark не видит Kafka
```bash
# Убедитесь что используете правильный bootstrap server
# Для локальной разработки: localhost:9092
# Внутри Docker: kafka:29092
```
