import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

async function run() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'warehouse',
    entities: [],
    synchronize: false,
  });
  await ds.initialize();
  const rows = await ds.query('SHOW COLUMNS FROM content');
  console.log('COLUMNS content:', rows);
  await ds.destroy();
}

run().catch((e) => { console.error(e); process.exit(1); });
