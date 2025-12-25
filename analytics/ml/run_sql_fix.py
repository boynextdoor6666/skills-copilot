import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
basedir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(basedir, '../../movie-aggregator-backend-nest/.env')
load_dotenv(env_path)

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASS', '')
DB_NAME = os.getenv('DB_NAME', 'warehouse')

# Connect to Database
db_url = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(db_url)

with engine.connect() as conn:
    with open('../../movie-aggregator-backend-nest/database/fix_recommendations_schema.sql', 'r') as f:
        sql = f.read()
        print(f"Executing: {sql}")
        conn.execute(text(sql))
        conn.commit()
        print("✅ Schema fixed successfully!")
