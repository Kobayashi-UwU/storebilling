import { v4 as uuid } from 'uuid';
import { pool } from '../src/db.js';

const sampleItems = [
  {
    name: 'Premium Coffee Beans',
    price: 18.5,
    stock: 50
  },
  {
    name: 'Reusable Cup',
    price: 9.0,
    stock: 80
  },
  {
    name: 'Chocolate Cookie',
    price: 3.5,
    stock: 120
  }
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM bill_items');
    await client.query('DELETE FROM bills');
    await client.query('DELETE FROM items');
    const now = new Date();
    for (const item of sampleItems) {
      await client.query(
        `INSERT INTO items (id, name, price, stock, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5)`,
        [uuid(), item.name, item.price, item.stock, now]
      );
    }
    await client.query('COMMIT');
    console.log('Seed complete');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
