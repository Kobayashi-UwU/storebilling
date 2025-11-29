import { pool } from '../src/db.js';

const RETRIES = 20;

async function wait() {
  for (let i = 0; i < RETRIES; i += 1) {
    try {
      await pool.query('SELECT 1');
      console.log('Database is ready');
      await pool.end();
      return;
    } catch (error) {
      console.log('Database not ready yet, retrying...', error.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  console.error('Database did not become ready in time');
  process.exit(1);
}

wait();
