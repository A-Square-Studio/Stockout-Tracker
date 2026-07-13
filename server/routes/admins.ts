import { Router } from 'express';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { pool } from '../db.js';

const router = Router();

// Auth guard
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.username) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  next();
}

function makeTransport() {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

async function sendWelcome(toName: string, toEmail: string, username: string, password: string) {
  const transport = makeTransport();
  if (!transport) return { ok: false, error: 'Email not configured.' };
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    await transport.sendMail({
      from,
      to: toEmail,
      subject: 'Your Stockout Tracker access',
      html: `
        <p>Hi ${toName},</p>
        <p>Your admin account has been created on <strong>Stockout Tracker</strong>.</p>
        <table style="border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:4px 12px 4px 0;color:#888">Site</td><td><a href="https://stockout-tracker.com">stockout-tracker.com</a></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Username</td><td><strong>${username}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Password</td><td><strong>${password}</strong></td></tr>
        </table>
        <p>Please log in and change your password after your first sign-in.</p>
      `,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// GET /api/admins
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT username, first_name, last_name, email, is_root, created_at FROM admins ORDER BY created_at',
  );
  res.json(rows.map(r => ({
    username: r.username,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    isRoot: r.is_root,
    createdAt: r.created_at,
  })));
});

// POST /api/admins  — create
router.post('/', requireAuth, async (req, res) => {
  const { username, password, firstName, lastName, email } = req.body as {
    username: string; password: string; firstName: string; lastName: string; email: string;
  };
  if (!username || !password || !email) {
    res.status(400).json({ error: 'Username, password, and email are required.' });
    return;
  }
  if (username.trim().length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }
  if (!email.includes('@')) {
    res.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      `INSERT INTO admins (username, password_hash, first_name, last_name, email)
       VALUES ($1,$2,$3,$4,$5)`,
      [username.trim(), hash, firstName?.trim() ?? '', lastName?.trim() ?? '', email.trim()],
    );
  } catch (e: any) {
    if (e.code === '23505') {
      res.status(409).json({ error: 'Username already exists.' });
    } else {
      throw e;
    }
    return;
  }

  // Send welcome email (non-blocking for the response)
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || username;
  const emailResult = await sendWelcome(fullName, email, username, password);
  res.json({ ok: true, emailSent: emailResult.ok, emailError: emailResult.error });
});

// DELETE /api/admins/:username
router.delete('/:username', requireAuth, async (req, res) => {
  const caller = req.session.username!;
  const { username } = req.params;
  if (username === 'admin') {
    res.status(403).json({ error: 'Cannot delete the root admin.' });
    return;
  }
  if (username === caller) {
    res.status(403).json({ error: 'Cannot delete your own account.' });
    return;
  }
  const { rowCount } = await pool.query('DELETE FROM admins WHERE username = $1', [username]);
  if (rowCount === 0) {
    res.status(404).json({ error: 'Admin not found.' });
    return;
  }
  res.json({ ok: true });
});

// PUT /api/admins/:username/password
router.put('/:username/password', requireAuth, async (req, res) => {
  const caller = req.session.username!;
  const { username } = req.params;
  if (username !== caller) {
    res.status(403).json({ error: 'You can only change your own password.' });
    return;
  }
  const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
  if (!oldPassword || !newPassword) {
    res.status(400).json({ error: 'Both old and new password required.' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters.' });
    return;
  }
  const { rows } = await pool.query('SELECT password_hash FROM admins WHERE username = $1', [username]);
  if (rows.length === 0) {
    res.status(404).json({ error: 'Admin not found.' });
    return;
  }
  const valid = await bcrypt.compare(oldPassword, rows[0].password_hash);
  if (!valid) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }
  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE admins SET password_hash = $1 WHERE username = $2', [newHash, username]);
  res.json({ ok: true });
});

export default router;
