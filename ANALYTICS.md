# Analytics and Data Platform Plan

This document outlines a practical analytics stack for the project with a clean dimensional model, basic data cleaning pipeline, and an optional real‑time path. It’s designed to be incremental: you can start with batch processing, then add streaming when needed.

## Data model (star schema)

Dimensions (reference data):
- dim_content (content_id, title, content_type, genre, release_year, director, director_photo_url)
- dim_person (person_id, name, role: ACTOR/DIRECTOR, photo_url)
- dim_user (user_id, role, registration_date, is_active)

Facts (events/measures):
- fact_reviews (review_id, content_id, user_id, rating, created_at, source)
- fact_content_metrics_daily (content_id, date, avg_rating, reviews_count, hype_index)
- fact_events (event_time, user_id, content_id, event_type, metadata JSON) — optional for streaming

Notes:
- Keep dim_person separate if you want rich people analytics. For a faster start, keep `director_photo_url` and `cast_photos` in `content` and backfill dim_person later.

## Data sources (2–3 types)
- Operational DB snapshots (MySQL) — TypeORM tables: content, users, reviews, hero_carousel, coming_soon_items
- JSON lines (events) — optional app logs with one event per line (e.g., review_submitted, page_view)
- CSV exports — optional manual imports from third‑party datasets (IMDB/Metacritic exports)

## Data cleaning (examples)
- Normalize strings: trim, lower/upper casing where needed (genres, roles)
- Coerce numerics: ratings and hype_index to Number with range checks
- Dates: convert to UTC ISO strings, drop invalid dates
- Cast lists: platforms, cast_photos to arrays of strings
- Deduplicate reviews by (user_id, content_id, created_at) or a stable review_id

## Batch analytics (ClickHouse + PySpark)
- Storage: ClickHouse for fast aggregations and dashboards
- Processing: PySpark for batch ETL (parquet/CSV/JSON input → ClickHouse tables)

Example tables in ClickHouse:
- dim_content (ReplacingMergeTree on content_id)
- fact_reviews (MergeTree partitioned by toYYYYMM(created_at))
- fact_content_metrics_daily (AggregatingMergeTree by (content_id, date))

ETL outline (PySpark):
1. Extract: read from MySQL (JDBC) and/or JSONL event dumps
2. Clean/normalize: apply transforms from the “Data cleaning” section
3. Load: write to ClickHouse via HTTP or JDBC (batch inserts)
4. Aggregate: compute daily metrics (avg, count) and write to fact_content_metrics_daily

## Streaming (Kafka) — optional
- Producer: app emits events (review_created, carousel_impression, content_view)
- Broker: Kafka (single‑node to start)
- Consumer: Spark Structured Streaming or a small Python consumer pushing to ClickHouse
- Use when you need near real‑time dashboards (<1–5 minutes latency)

## Dashboards
- For now, the web app’s /dashboard shows:
  - Content totals and distribution by type
  - Active hero slides and coming‑soon items
  - Users by roles
- For deeper analytics:
  - Connect ClickHouse to tools like Superset or Grafana (native ClickHouse connector)
  - Build charts for:
    - Top content by reviews_count (last 7/30 days)
    - Rating dynamics and hype trends
    - Critics vs audience deltas over time

## Incremental adoption path
1. App emits daily batch (CSV/JSON) export → PySpark → ClickHouse → Superset
2. Add Kafka for review events → microbatch consumer → ClickHouse → near real‑time charts
3. Expand dimensions (dim_person) and slowly remove duplicated fields from `content`

## Minimal event format (JSONL)
```json
{"ts":"2025-11-04T12:34:56Z","event":"review_created","user_id":42,"content_id":1001,"rating":8.5}
{"ts":"2025-11-04T12:35:10Z","event":"carousel_impression","user_id":42,"slide_id":7}
```

Store to logs/events/YYYY/MM/DD/*.jsonl and let Spark read them with schema inference or an explicit schema.

## Why ClickHouse, PySpark, Kafka?
- ClickHouse: columnar, very fast OLAP, simple to self‑host, great for time‑series aggregates
- PySpark: robust for batch ETL and scalable to large datasets
- Kafka: decouples producers/consumers and enables near real‑time pipelines when needed

## Ops notes
- Keep infra optional and behind env flags. Start local first (single nodes), then scale.
- Consider docker‑compose for ClickHouse and Kafka when you’re ready; add a separate repo or infra folder for that.
