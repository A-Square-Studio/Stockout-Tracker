import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.username) { res.status(401).json({ error: 'Not authenticated.' }); return; }
  next();
}

// GET /api/future-stockouts
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT part_number, name, product_line, estimated_weeks_on_hand FROM future_stockout_items ORDER BY estimated_weeks_on_hand ASC',
  );
  res.json(rows.map(r => ({
    partNumber: r.part_number, name: r.name, productLine: r.product_line,
    estimatedWeeksOnHand: parseFloat(r.estimated_weeks_on_hand),
  })));
});

// PUT /api/future-stockouts  — replace all (in a transaction)
router.put('/', requireAuth, async (req, res) => {
  const items = req.body as Array<{
    partNumber: string; name: string; productLine: string; estimatedWeeksOnHand: number;
  }>;
  if (!Array.isArray(items)) { res.status(400).json({ error: 'Expected array.' }); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM future_stockout_items');
    for (const item of items) {
      await client.query(
        `INSERT INTO future_stockout_items (part_number, name, product_line, estimated_weeks_on_hand)
         VALUES ($1,$2,$3,$4)`,
        [item.partNumber, item.name, item.productLine, item.estimatedWeeksOnHand],
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, count: items.length });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

export default router;
