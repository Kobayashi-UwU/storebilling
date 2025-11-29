import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool, query } from '../db.js';

const router = Router();

function serializeBill(row) {
  return {
    id: row.id,
    bill_date: row.bill_date,
    total_price: Number(row.total_price),
    final_price: Number(row.final_price),
    created_at: row.created_at,
    items: row.items || []
  };
}

async function fetchBillWithItems(executor, id) {
  const { rows } = await executor.query(
    `SELECT b.*, COALESCE(json_agg(json_build_object(
        'id', bi.id,
        'item_id', bi.item_id,
        'name', i.name,
        'image_base64', i.image_base64,
        'quantity', bi.quantity,
        'price_per_unit', bi.price_per_unit,
        'total_price', bi.total_price
      ) ORDER BY bi.created_at) FILTER (WHERE bi.id IS NOT NULL), '[]') AS items
     FROM bills b
     LEFT JOIN bill_items bi ON bi.bill_id = b.id
     LEFT JOIN items i ON i.id = bi.item_id
     WHERE b.id = $1
     GROUP BY b.id`,
    [id]
  );
  return rows.length ? serializeBill(rows[0]) : null;
}

async function buildPricedItems(client, items) {
  const pricedItems = [];
  for (const entry of items) {
    const { itemId, quantity } = entry;
    if (!itemId || !quantity) {
      throw new Error('Each bill item requires itemId and quantity');
    }
    const { rows } = await client.query('SELECT price, stock FROM items WHERE id = $1', [itemId]);
    if (!rows.length) {
      throw new Error('Item not found');
    }
    const product = rows[0];
    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    const pricePerUnit = Number(entry.pricePerUnit ?? product.price);
    const totalPrice = pricePerUnit * quantity;
    pricedItems.push({ itemId, quantity, pricePerUnit, totalPrice });
  }
  return pricedItems;
}

router.get('/', async (req, res, next) => {
  try {
    const { date, start, end } = req.query;
    let where = '';
    const params = [];
    if (date) {
      params.push(date);
      where = 'WHERE b.bill_date = $1';
    } else if (start && end) {
      params.push(start, end);
      where = 'WHERE b.bill_date BETWEEN $1 AND $2';
    } else if (start) {
      params.push(start);
      where = 'WHERE b.bill_date >= $1';
    } else if (end) {
      params.push(end);
      where = 'WHERE b.bill_date <= $1';
    }
    const { rows } = await query(
      `SELECT b.*, COALESCE(json_agg(json_build_object(
          'id', bi.id,
          'item_id', bi.item_id,
          'name', i.name,
          'image_base64', i.image_base64,
          'quantity', bi.quantity,
          'price_per_unit', bi.price_per_unit,
          'total_price', bi.total_price
        ) ORDER BY bi.created_at) FILTER (WHERE bi.id IS NOT NULL), '[]') AS items
       FROM bills b
       LEFT JOIN bill_items bi ON bi.bill_id = b.id
       LEFT JOIN items i ON i.id = bi.item_id
       ${where}
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      params
    );
    res.json(rows.map(serializeBill));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await fetchBillWithItems({ query }, id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { billDate, items, finalPrice } = req.body;
    if (!billDate || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'billDate and items are required' });
    }
    await client.query('BEGIN');
    const billId = uuid();
    const now = new Date();

    const pricedItems = await buildPricedItems(client, items);

    const totalPrice = pricedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const final = finalPrice ?? totalPrice;

    await client.query(
      `INSERT INTO bills (id, bill_date, total_price, final_price, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [billId, billDate, totalPrice, final, now]
    );

    for (const item of pricedItems) {
      await client.query(
        `INSERT INTO bill_items (id, bill_id, item_id, quantity, price_per_unit, total_price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuid(), billId, item.itemId, item.quantity, item.pricePerUnit, item.totalPrice, now]
      );
      await client.query(
        `UPDATE items SET stock = stock - $1, updated_at=$2 WHERE id = $3`,
        [item.quantity, now, item.itemId]
      );
    }

    await client.query('COMMIT');
    const bill = await fetchBillWithItems({ query }, billId);
    res.status(201).json(bill);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { billDate, items, finalPrice } = req.body;
    if (!billDate || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'billDate and items are required' });
    }
    await client.query('BEGIN');
    const { rows: existing } = await client.query('SELECT id FROM bills WHERE id = $1', [id]);
    if (!existing.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Bill not found' });
    }

    const { rows: previousItems } = await client.query('SELECT item_id, quantity FROM bill_items WHERE bill_id = $1', [id]);
    const now = new Date();
    for (const prev of previousItems) {
      if (!prev.item_id) continue;
      await client.query('UPDATE items SET stock = stock + $1, updated_at=$2 WHERE id = $3', [prev.quantity, now, prev.item_id]);
    }
    await client.query('DELETE FROM bill_items WHERE bill_id = $1', [id]);

    const pricedItems = await buildPricedItems(client, items);
    const totalPrice = pricedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const final = finalPrice ?? totalPrice;

    await client.query(
      `UPDATE bills SET bill_date=$1, total_price=$2, final_price=$3 WHERE id=$4`,
      [billDate, totalPrice, final, id]
    );

    for (const item of pricedItems) {
      await client.query(
        `INSERT INTO bill_items (id, bill_id, item_id, quantity, price_per_unit, total_price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuid(), id, item.itemId, item.quantity, item.pricePerUnit, item.totalPrice, now]
      );
      await client.query(
        `UPDATE items SET stock = stock - $1, updated_at=$2 WHERE id = $3`,
        [item.quantity, now, item.itemId]
      );
    }

    await client.query('COMMIT');
    const bill = await fetchBillWithItems({ query }, id);
    res.json(bill);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    const { rows: existing } = await client.query('SELECT id FROM bills WHERE id = $1', [id]);
    if (!existing.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Bill not found' });
    }
    const { rows: previousItems } = await client.query('SELECT item_id, quantity FROM bill_items WHERE bill_id = $1', [id]);
    const now = new Date();
    for (const prev of previousItems) {
      if (!prev.item_id) continue;
      await client.query('UPDATE items SET stock = stock + $1, updated_at=$2 WHERE id = $3', [prev.quantity, now, prev.item_id]);
    }
    await client.query('DELETE FROM bill_items WHERE bill_id = $1', [id]);
    await client.query('DELETE FROM bills WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.status(204).end();
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
