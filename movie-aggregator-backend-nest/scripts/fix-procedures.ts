import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'warehouse',
  entities: [],
  synchronize: false,
  logging: false,
  multipleStatements: true, // Important for executing SQL scripts
});

async function run() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected.');

    const sqlPath = path.join(__dirname, '../database/visitor-procedures.sql');
    console.log(`Reading SQL from ${sqlPath}...`);
    
    let sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Remove DELIMITER commands as they are client-side only
    sql = sql.replace(/DELIMITER \$\$/g, '').replace(/DELIMITER ;/g, '').replace(/\$\$/g, ';');

    console.log('Executing procedures...');
    await AppDataSource.query(sql);
    
    console.log('Successfully applied visitor-procedures.sql');
  } catch (error) {
    console.error('Error applying procedures:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

run();
