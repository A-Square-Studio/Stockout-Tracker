import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';

declare module 'express-session' {
  interface SessionData { username: string; }
}

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required.' });
    return;
  }
  const { rows } = await pool.query(
    'SELECT username, password_hash FROM admins WHERE username = $1',
    [username],
  );
  if (rows.length === 0) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }
  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }
  req.session.username = username;
  res.json({ username });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const username = req.session.username;
  if (!username) {
    res.json({ username: null });
    return;
  }
  // Verify still in DB
  const { rows } = await pool.query('SELECT username FROM admins WHERE username = $1', [username]);
  if (rows.length === 0) {
    req.session.destroy(() => {});
    res.json({ username: null });
    return;
  }
  res.json({ username });
});

export default router;
