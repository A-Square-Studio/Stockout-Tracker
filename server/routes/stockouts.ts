import { Router } from 'express';
import { pool, initDb } from '../db.js';

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.username) { res.status(401).json({ error: 'Not authenticated.' }); return; }
  next();
}

// GET /api/stockouts
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, product_line, lead_time, approx_ship_date, escalation_owner, top_level FROM stockout_items ORDER BY lead_time DESC',
  );
  res.json(rows.map(r => ({
    id: r.id, name: r.name, productLine: r.product_line, leadTime: r.lead_time,
    approxShipDate: r.approx_ship_date, escalationOwner: r.escalation_owner, topLevel: r.top_level,
  })));
});

// PUT /api/stockouts  — replace all (in a transaction)
router.put('/', requireAuth, async (req, res) => {
  const items = req.body as Array<{
    id: string; name: string; productLine: string; leadTime: number;
    approxShipDate: string; escalationOwner: string; topLevel: string[];
  }>;
  if (!Array.isArray(items)) { res.status(400).json({ error: 'Expected array.' }); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM stockout_items');
    for (const item of items) {
      await client.query(
        `INSERT INTO stockout_items (id, name, product_line, lead_time, approx_ship_date, escalation_owner, top_level)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [item.id, item.name, item.productLine, item.leadTime, item.approxShipDate, item.escalationOwner, item.topLevel],
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

// DELETE /api/stockouts  — reset both tables to seed data (in a transaction)
router.delete('/', requireAuth, async (_req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM future_stockout_items');
    await client.query('DELETE FROM stockout_items');
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  await initDb(); // re-seeds
  res.json({ ok: true });
});

export default router;
