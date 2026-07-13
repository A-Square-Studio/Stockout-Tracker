import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool, initDb } from './db.js';
import authRoutes from './routes/auth.js';
import adminsRoutes from './routes/admins.js';
import stockoutsRoutes from './routes/stockouts.js';
import futureStockoutsRoutes from './routes/futureStockouts.js';
import aiRoutes from './routes/ai.js';
import parseFileRoutes from './routes/parseFile.js';

const PgSession = connectPgSimple(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Replit Autoscale injects PORT at runtime; fall back to 3000 for local dev.
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3000');
const isProd = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

app.set('trust proxy', 1);

// In production the frontend is served by Express itself (same origin), so no CORS needed.
// In development Vite proxies all /api/* requests, so again same origin from the browser's perspective.
// We keep credentials:true for the proxy case but lock the origin to same-origin only.
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server) and same-origin requests.
    // In production the Replit domain is the only real origin.
    cb(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/stockouts', stockoutsRoutes);
app.use('/api/future-stockouts', futureStockoutsRoutes);
app.use('/api/ask', aiRoutes);
app.use('/api/parse-file', parseFileRoutes);          // matches /api/ask used by AskAI component

// Serve built frontend in production
if (isProd) {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  // Express 5 requires named wildcards — bare '*' throws a PathError.
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

// Centralised JSON error handler — must be last middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

await initDb();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});
