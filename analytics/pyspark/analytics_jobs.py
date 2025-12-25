"""
PySpark Analytics Jobs for CineVibe

This module contains multiple PySpark jobs for processing analytics data:
1. Stream events from Kafka to ClickHouse (real-time)
2. Batch aggregations for daily reports
3. Content popularity calculations
4. User behavior analysis
"""

import argparse
import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, 
    DoubleType, MapType, TimestampType, ArrayType
)
from pyspark.sql.window import Window

# ==================== Configuration ====================

CLICKHOUSE_HOST = os.environ.get("CLICKHOUSE_HOST", "localhost")
CLICKHOUSE_PORT = int(os.environ.get("CLICKHOUSE_PORT", "8123"))
CLICKHOUSE_DB = os.environ.get("CLICKHOUSE_DB", "analytics")

KAFKA_BOOTSTRAP = os.environ.get("KAFKA_BOOTSTRAP", "localhost:9092")

# Topic configurations
TOPICS = {
    "reviews": "reviews",
    "users": "users", 
    "content": "content",
}

# ==================== Schemas ====================

REVIEW_EVENT_SCHEMA = StructType([
    StructField("event_type", StringType()),
    StructField("user_id", IntegerType()),
    StructField("content_id", IntegerType()),
    StructField("content_type", StringType()),
    StructField("rating", DoubleType()),
    StructField("emotions", StringType()),  # JSON string
    StructField("aspects", StringType()),   # JSON string
    StructField("source", StringType()),
    StructField("event_time", StringType()),
    StructField("metadata", StringType()),  # JSON string
])

USER_EVENT_SCHEMA = StructType([
    StructField("event_type", StringType()),
    StructField("user_id", IntegerType()),
    StructField("event_time", StringType()),
    StructField("metadata", StringType()),
])

CONTENT_EVENT_SCHEMA = StructType([
    StructField("event_type", StringType()),
    StructField("user_id", IntegerType()),
    StructField("content_id", IntegerType()),
    StructField("content_type", StringType()),
    StructField("event_time", StringType()),
    StructField("metadata", StringType()),
])


# ==================== Spark Session ====================

def build_spark(app_name: str = "CineVibeAnalytics") -> SparkSession:
    """Build Spark session with necessary configurations."""
    return (
        SparkSession.builder
        .appName(app_name)
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.shuffle.partitions", "10")
        .config("spark.streaming.stopGracefullyOnShutdown", "true")
        .getOrCreate()
    )


# ==================== ClickHouse Writer ====================

def get_clickhouse_client():
    """Get ClickHouse client instance."""
    import clickhouse_connect
    return clickhouse_connect.get_client(
        host=CLICKHOUSE_HOST, 
        port=CLICKHOUSE_PORT
    )


def ensure_clickhouse_schema(client):
    """Ensure all required tables exist in ClickHouse."""
    client.command(f"CREATE DATABASE IF NOT EXISTS {CLICKHOUSE_DB}")
    
    # Reviews events table
    client.command(f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_DB}.reviews_events (
            event_time   DateTime DEFAULT now(),
            event_type   LowCardinality(String),
            user_id      UInt32,
            content_id   UInt32,
            content_type LowCardinality(String),
            rating       Nullable(Float32),
            emotions     String DEFAULT '{{}}',
            aspects      String DEFAULT '{{}}',
            source       LowCardinality(String) DEFAULT 'web'
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (content_id, event_time)
    """)
    
    # User events table
    client.command(f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_DB}.user_events (
            event_time   DateTime DEFAULT now(),
            event_type   LowCardinality(String),
            user_id      UInt32,
            metadata     String DEFAULT '{{}}'
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (user_id, event_time)
    """)
    
    # Content events table
    client.command(f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_DB}.content_events (
            event_time   DateTime DEFAULT now(),
            event_type   LowCardinality(String),
            user_id      Nullable(UInt32),
            content_id   UInt32,
            content_type LowCardinality(String),
            metadata     String DEFAULT '{{}}'
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (content_id, event_time)
    """)
    
    # Daily content aggregations
    client.command(f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_DB}.content_daily_stats (
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
        ORDER BY (date, content_id)
    """)
    
    # Hourly activity aggregations
    client.command(f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_DB}.hourly_activity (
            hour           DateTime,
            event_type     LowCardinality(String),
            count          UInt64
        ) ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(hour)
        ORDER BY (hour, event_type)
    """)
    
    # User activity summary
    client.command(f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_DB}.user_activity_daily (
            date           Date,
            user_id        UInt32,
            reviews_count  UInt64,
            logins_count   UInt64,
            views_count    UInt64,
            total_rating   Float64
        ) ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(date)
        ORDER BY (date, user_id)
    """)


def write_to_clickhouse(df: DataFrame, table: str, epoch_id: int = 0):
    """Write DataFrame to ClickHouse table."""
    if df.rdd.isEmpty():
        return
    
    client = get_clickhouse_client()
    ensure_clickhouse_schema(client)
    
    pdf = df.toPandas()
    full_table = f"{CLICKHOUSE_DB}.{table}"
    
    client.insert_df(full_table, pdf)
    print(f"[{datetime.now()}] Inserted {len(pdf)} rows to {full_table}")


# ==================== Streaming Jobs ====================

def stream_reviews_to_clickhouse(spark: SparkSession):
    """Stream review events from Kafka to ClickHouse."""
    print(f"Starting reviews streaming from {KAFKA_BOOTSTRAP} topic={TOPICS['reviews']}")
    
    df = (
        spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP)
        .option("subscribe", TOPICS["reviews"])
        .option("startingOffsets", "latest")
        .option("failOnDataLoss", "false")
        .load()
    )
    
    parsed = (
        df.select(F.col("value").cast("string").alias("value"))
        .withColumn("json", F.from_json(F.col("value"), REVIEW_EVENT_SCHEMA))
        .select("json.*")
        .withColumn("event_time", 
            F.coalesce(
                F.to_timestamp(F.col("event_time")), 
                F.current_timestamp()
            )
        )
        .select(
            "event_time",
            "event_type",
            "user_id",
            "content_id",
            "content_type",
            "rating",
            F.coalesce(F.col("emotions"), F.lit("{}")).alias("emotions"),
            F.coalesce(F.col("aspects"), F.lit("{}")).alias("aspects"),
            F.coalesce(F.col("source"), F.lit("web")).alias("source"),
        )
    )
    
    query = (
        parsed.writeStream
        .outputMode("append")
        .foreachBatch(lambda df, epoch: write_to_clickhouse(df, "reviews_events", epoch))
        .option("checkpointLocation", ".spark-checkpoints/reviews_to_ch")
        .start()
    )
    
    return query


def stream_users_to_clickhouse(spark: SparkSession):
    """Stream user events from Kafka to ClickHouse."""
    print(f"Starting users streaming from {KAFKA_BOOTSTRAP} topic={TOPICS['users']}")
    
    df = (
        spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP)
        .option("subscribe", TOPICS["users"])
        .option("startingOffsets", "latest")
        .option("failOnDataLoss", "false")
        .load()
    )
    
    parsed = (
        df.select(F.col("value").cast("string").alias("value"))
        .withColumn("json", F.from_json(F.col("value"), USER_EVENT_SCHEMA))
        .select("json.*")
        .withColumn("event_time", 
            F.coalesce(
                F.to_timestamp(F.col("event_time")), 
                F.current_timestamp()
            )
        )
        .select(
            "event_time",
            "event_type",
            "user_id",
            F.coalesce(F.col("metadata"), F.lit("{}")).alias("metadata"),
        )
    )
    
    query = (
        parsed.writeStream
        .outputMode("append")
        .foreachBatch(lambda df, epoch: write_to_clickhouse(df, "user_events", epoch))
        .option("checkpointLocation", ".spark-checkpoints/users_to_ch")
        .start()
    )
    
    return query


def stream_content_to_clickhouse(spark: SparkSession):
    """Stream content events from Kafka to ClickHouse."""
    print(f"Starting content streaming from {KAFKA_BOOTSTRAP} topic={TOPICS['content']}")
    
    df = (
        spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP)
        .option("subscribe", TOPICS["content"])
        .option("startingOffsets", "latest")
        .option("failOnDataLoss", "false")
        .load()
    )
    
    parsed = (
        df.select(F.col("value").cast("string").alias("value"))
        .withColumn("json", F.from_json(F.col("value"), CONTENT_EVENT_SCHEMA))
        .select("json.*")
        .withColumn("event_time", 
            F.coalesce(
                F.to_timestamp(F.col("event_time")), 
                F.current_timestamp()
            )
        )
        .select(
            "event_time",
            "event_type",
            "user_id",
            "content_id",
            "content_type",
            F.coalesce(F.col("metadata"), F.lit("{}")).alias("metadata"),
        )
    )
    
    query = (
        parsed.writeStream
        .outputMode("append")
        .foreachBatch(lambda df, epoch: write_to_clickhouse(df, "content_events", epoch))
        .option("checkpointLocation", ".spark-checkpoints/content_to_ch")
        .start()
    )
    
    return query


# ==================== Batch Aggregation Jobs ====================

def aggregate_daily_content_stats(spark: SparkSession, date: str = None):
    """
    Aggregate daily content statistics from raw events.
    Run this as a daily batch job.
    """
    client = get_clickhouse_client()
    ensure_clickhouse_schema(client)
    
    if date is None:
        date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    print(f"Aggregating content stats for {date}")
    
    # Query raw events and aggregate
    query = f"""
        INSERT INTO {CLICKHOUSE_DB}.content_daily_stats
        SELECT
            toDate('{date}') as date,
            content_id,
            content_type,
            countIf(event_type = 'content_viewed') as views_count,
            countIf(event_type = 'review_created') as reviews_count,
            avgIf(rating, rating IS NOT NULL) as avg_rating,
            sumIf(rating, rating IS NOT NULL) as sum_rating,
            uniqExact(user_id) as unique_users
        FROM (
            SELECT content_id, content_type, 'content_viewed' as event_type, NULL as rating, user_id
            FROM {CLICKHOUSE_DB}.content_events
            WHERE toDate(event_time) = '{date}'
            UNION ALL
            SELECT content_id, content_type, event_type, rating, user_id
            FROM {CLICKHOUSE_DB}.reviews_events
            WHERE toDate(event_time) = '{date}'
        )
        GROUP BY content_id, content_type
    """
    
    client.command(query)
    print(f"Content daily stats aggregated for {date}")


def aggregate_hourly_activity(spark: SparkSession, hours_back: int = 24):
    """
    Aggregate hourly activity counts.
    """
    client = get_clickhouse_client()
    ensure_clickhouse_schema(client)
    
    print(f"Aggregating hourly activity for last {hours_back} hours")
    
    query = f"""
        INSERT INTO {CLICKHOUSE_DB}.hourly_activity
        SELECT
            toStartOfHour(event_time) as hour,
            event_type,
            count() as count
        FROM (
            SELECT event_time, event_type FROM {CLICKHOUSE_DB}.reviews_events
            WHERE event_time >= now() - INTERVAL {hours_back} HOUR
            UNION ALL
            SELECT event_time, event_type FROM {CLICKHOUSE_DB}.user_events
            WHERE event_time >= now() - INTERVAL {hours_back} HOUR
            UNION ALL
            SELECT event_time, event_type FROM {CLICKHOUSE_DB}.content_events
            WHERE event_time >= now() - INTERVAL {hours_back} HOUR
        )
        GROUP BY hour, event_type
    """
    
    client.command(query)
    print("Hourly activity aggregated")


def aggregate_user_activity(spark: SparkSession, date: str = None):
    """
    Aggregate daily user activity summary.
    """
    client = get_clickhouse_client()
    ensure_clickhouse_schema(client)
    
    if date is None:
        date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    print(f"Aggregating user activity for {date}")
    
    query = f"""
        INSERT INTO {CLICKHOUSE_DB}.user_activity_daily
        SELECT
            toDate('{date}') as date,
            user_id,
            countIf(source = 'reviews' AND event_type = 'review_created') as reviews_count,
            countIf(source = 'users' AND event_type = 'user_login') as logins_count,
            countIf(source = 'content' AND event_type = 'content_viewed') as views_count,
            sumIf(rating, rating IS NOT NULL) as total_rating
        FROM (
            SELECT user_id, 'reviews' as source, event_type, rating
            FROM {CLICKHOUSE_DB}.reviews_events
            WHERE toDate(event_time) = '{date}'
            UNION ALL
            SELECT user_id, 'users' as source, event_type, NULL as rating
            FROM {CLICKHOUSE_DB}.user_events
            WHERE toDate(event_time) = '{date}'
            UNION ALL
            SELECT user_id, 'content' as source, event_type, NULL as rating
            FROM {CLICKHOUSE_DB}.content_events
            WHERE toDate(event_time) = '{date}' AND user_id IS NOT NULL
        )
        GROUP BY user_id
    """
    
    client.command(query)
    print(f"User activity aggregated for {date}")


# ==================== CLI ====================

def parse_args():
    parser = argparse.ArgumentParser(description="CineVibe Analytics PySpark Jobs")
    parser.add_argument(
        "--job", 
        choices=[
            "stream-all",
            "stream-reviews",
            "stream-users", 
            "stream-content",
            "batch-daily-content",
            "batch-hourly-activity",
            "batch-user-activity",
            "batch-all",
        ],
        default="stream-all",
        help="Job to run"
    )
    parser.add_argument("--date", help="Date for batch jobs (YYYY-MM-DD)")
    parser.add_argument("--hours", type=int, default=24, help="Hours back for hourly aggregation")
    return parser.parse_args()


def main():
    args = parse_args()
    spark = build_spark(f"CineVibe_{args.job}")
    
    try:
        if args.job == "stream-all":
            q1 = stream_reviews_to_clickhouse(spark)
            q2 = stream_users_to_clickhouse(spark)
            q3 = stream_content_to_clickhouse(spark)
            print("All streams started. Waiting for termination...")
            spark.streams.awaitAnyTermination()
            
        elif args.job == "stream-reviews":
            query = stream_reviews_to_clickhouse(spark)
            query.awaitTermination()
            
        elif args.job == "stream-users":
            query = stream_users_to_clickhouse(spark)
            query.awaitTermination()
            
        elif args.job == "stream-content":
            query = stream_content_to_clickhouse(spark)
            query.awaitTermination()
            
        elif args.job == "batch-daily-content":
            aggregate_daily_content_stats(spark, args.date)
            
        elif args.job == "batch-hourly-activity":
            aggregate_hourly_activity(spark, args.hours)
            
        elif args.job == "batch-user-activity":
            aggregate_user_activity(spark, args.date)
            
        elif args.job == "batch-all":
            aggregate_daily_content_stats(spark, args.date)
            aggregate_hourly_activity(spark, args.hours)
            aggregate_user_activity(spark, args.date)
            print("All batch aggregations complete")
            
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
