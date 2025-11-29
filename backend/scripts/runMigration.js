import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');

async function runMigrations() {
  const files = fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
  const client = await pool.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`Running migration ${file}`);
      await client.query(sql);
    }
    console.log('Migrations complete');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
