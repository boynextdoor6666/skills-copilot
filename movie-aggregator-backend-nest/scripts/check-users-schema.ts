
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'warehouse',
    synchronize: false,
  });

  await ds.initialize();
  const result = await ds.query('SHOW CREATE TABLE users');
  console.log(result[0]['Create Table']);
  await ds.destroy();
}

run().catch(console.error);
