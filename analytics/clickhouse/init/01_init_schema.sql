-- ClickHouse initialization script for CineVibe Analytics
-- This script runs automatically when ClickHouse container starts

CREATE DATABASE IF NOT EXISTS analytics;

-- Reviews events table (raw events from Kafka)
CREATE TABLE IF NOT EXISTS analytics.reviews_events (
    event_time   DateTime DEFAULT now(),
    event_type   LowCardinality(String),
    user_id      UInt32,
    content_id   UInt32,
    content_type LowCardinality(String),
    rating       Nullable(Float32),
    emotions     String DEFAULT '{}',
    aspects      String DEFAULT '{}',
    source       LowCardinality(String) DEFAULT 'web'
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (content_id, event_time)
SETTINGS index_granularity = 8192;

-- User events table
CREATE TABLE IF NOT EXISTS analytics.user_events (
    event_time   DateTime DEFAULT now(),
    event_type   LowCardinality(String),
    user_id      UInt32,
    metadata     String DEFAULT '{}'
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (user_id, event_time)
SETTINGS index_granularity = 8192;

-- Content events table
CREATE TABLE IF NOT EXISTS analytics.content_events (
    event_time   DateTime DEFAULT now(),
    event_type   LowCardinality(String),
    user_id      Nullable(UInt32),
    content_id   UInt32,
    content_type LowCardinality(String),
    metadata     String DEFAULT '{}'
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (content_id, event_time)
SETTINGS index_granularity = 8192;

-- Daily content statistics (aggregated)
CREATE TABLE IF NOT EXISTS analytics.content_daily_stats (
    date           Date,
    content_id     UInt32,
    content_type   LowCardinality(String),
    views_count    UInt64,
    reviews_count  UInt64,
    avg_rating     Float64,
    sum_rating     Float64,
    unique_users   UInt64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, content_id);

-- Hourly activity aggregations
CREATE TABLE IF NOT EXISTS analytics.hourly_activity (
    hour           DateTime,
    event_type     LowCardinality(String),
    count          UInt64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, event_type);

-- User activity daily summary
CREATE TABLE IF NOT EXISTS analytics.user_activity_daily (
    date           Date,
    user_id        UInt32,
    reviews_count  UInt64,
    logins_count   UInt64,
    views_count    UInt64,
    total_rating   Float64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id);

-- Content popularity (trending)
CREATE TABLE IF NOT EXISTS analytics.content_popularity (
    date           Date,
    content_id     UInt32,
    content_type   LowCardinality(String),
    popularity_score Float64,
    views_7d       UInt64,
    reviews_7d     UInt64,
    avg_rating_7d  Float64
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, content_id);

-- Materialized view for real-time review counts per content
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_content_review_counts
ENGINE = SummingMergeTree()
ORDER BY (content_id, content_type)
AS SELECT
    content_id,
    content_type,
    count() as review_count,
    sum(rating) as total_rating
FROM analytics.reviews_events
WHERE event_type = 'review_created' AND rating IS NOT NULL
GROUP BY content_id, content_type;

-- Materialized view for hourly event counts
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_hourly_events
ENGINE = SummingMergeTree()
ORDER BY (hour, event_type)
AS SELECT
    toStartOfHour(event_time) as hour,
    event_type,
    count() as event_count
FROM analytics.reviews_events
GROUP BY hour, event_type;
