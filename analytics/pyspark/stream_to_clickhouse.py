import argparse
import json
import os
from typing import Any, Dict

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType, MapType

# Minimal PySpark job: Kafka -> parse JSON -> write batches to ClickHouse via HTTP driver
# Assumes Kafka on localhost:9092 and ClickHouse on localhost:8123

CLICKHOUSE_HOST = os.environ.get("CLICKHOUSE_HOST", "localhost")
CLICKHOUSE_PORT = int(os.environ.get("CLICKHOUSE_PORT", "8123"))
CLICKHOUSE_DB = os.environ.get("CLICKHOUSE_DB", "analytics")
CLICKHOUSE_TABLE = os.environ.get("CLICKHOUSE_TABLE", "reviews_events")

KAFKA_BOOTSTRAP = os.environ.get("KAFKA_BOOTSTRAP", "localhost:9092")
KAFKA_TOPIC = os.environ.get("KAFKA_TOPIC", "reviews")


def build_spark(app_name: str = "KafkaToClickHouse") -> SparkSession:
    return (
        SparkSession.builder
        .appName(app_name)
        .getOrCreate()
    )


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["streaming", "batch"], default="streaming")
    p.add_argument("--max-records", type=int, default=0, help="Max records for batch mode (0 = all)")
    return p.parse_args()


def to_clickhouse(df, epoch_id: int):
    import clickhouse_connect

    if df.rdd.isEmpty():
        return

    pdf = df.toPandas()
    client = clickhouse_connect.get_client(host=CLICKHOUSE_HOST, port=CLICKHOUSE_PORT)
    client.command(f"CREATE DATABASE IF NOT EXISTS {CLICKHOUSE_DB}")
    client.command(f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_DB}.{CLICKHOUSE_TABLE} (
          event_time   DateTime DEFAULT now(),
          event_type   LowCardinality(String),
          user_id      UInt32,
          content_id   UInt32,
          content_type LowCardinality(String),
          rating       Float32,
          emotions     JSON,
          aspects      JSON,
          source       LowCardinality(String)
        ) ENGINE = MergeTree
        ORDER BY (content_id, event_time)
    """)

    # Insert as DataFrame (clickhouse-connect supports insert_df)
    client.insert_df(f"{CLICKHOUSE_DB}.{CLICKHOUSE_TABLE}", pdf)


def main():
    args = parse_args()
    spark = build_spark()

    # Schema for JSON payload inside Kafka value
    json_schema = StructType([
        StructField("event_type", StringType()),
        StructField("user_id", IntegerType()),
        StructField("content_id", IntegerType()),
        StructField("content_type", StringType()),
        StructField("rating", DoubleType()),
        StructField("emotions", MapType(StringType(), IntegerType())),
        StructField("aspects", MapType(StringType(), IntegerType())),
        StructField("source", StringType()),
        StructField("event_time", StringType()),  # optional, if provided by app
    ])

    if args.mode == "streaming":
        df = (
            spark.readStream
            .format("kafka")
            .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP)
            .option("subscribe", KAFKA_TOPIC)
            .option("startingOffsets", "latest")
            .load()
        )
    else:
        reader = (
            spark.read
            .format("kafka")
            .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP)
            .option("subscribe", KAFKA_TOPIC)
            .option("startingOffsets", "earliest")
        )
        if args.max_records and args.max_records > 0:
            reader = reader.option("maxOffsetsPerTrigger", args.max_records)
        df = reader.load()

    # Parse JSON value
    parsed = (
        df.select(F.col("value").cast("string").alias("value"))
          .withColumn("json", F.from_json(F.col("value"), json_schema))
          .select("json.*")
          .withColumn("event_time", F.coalesce(F.col("event_time").cast("timestamp"), F.current_timestamp()))
    )

    if args.mode == "streaming":
        query = (
            parsed.writeStream
            .outputMode("append")
            .foreachBatch(to_clickhouse)
            .option("checkpointLocation", ".spark-checkpoints/reviews_to_ch")
            .start()
        )
        query.awaitTermination()
    else:
        # Single batch
        to_clickhouse(parsed, epoch_id=0)


if __name__ == "__main__":
    main()
