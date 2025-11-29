import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { query } from '../db.js';
import { compressBase64Image } from '../utils/image.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM items ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, price, stock, imageBase64 } = req.body;
    if (!name || price == null || stock == null) {
      return res.status(400).json({ message: 'name, price and stock are required' });
    }
    const compressedImage = imageBase64 ? await compressBase64Image(imageBase64) : null;
    const id = uuid();
    const now = new Date();
    await query(
      `INSERT INTO items (id, name, image_base64, price, stock, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)`,
      [id, name, compressedImage, price, stock, now]
    );
    const { rows } = await query('SELECT * FROM items WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, stock, imageBase64 } = req.body;
    const { rows: existing } = await query('SELECT * FROM items WHERE id = $1', [id]);
    if (!existing.length) {
      return res.status(404).json({ message: 'Item not found' });
    }
    const compressedImage = imageBase64 ? await compressBase64Image(imageBase64) : existing[0].image_base64;
    await query(
      `UPDATE items SET name=$1, price=$2, stock=$3, image_base64=$4, updated_at=$5 WHERE id=$6`,
      [name ?? existing[0].name, price ?? existing[0].price, stock ?? existing[0].stock, compressedImage, new Date(), id]
    );
    const { rows } = await query('SELECT * FROM items WHERE id=$1', [id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM items WHERE id = $1', [id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
