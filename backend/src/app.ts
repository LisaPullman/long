import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

const corsOrigin = (process.env.CORS_ORIGIN || '').trim();
const corsOrigins = corsOrigin
  ? corsOrigin
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : undefined;

// Middlewares
// If you run behind a reverse proxy (Caddy/Nginx), enable this so rate-limit & IP detection work properly.
if ((process.env.TRUST_PROXY || '').trim()) {
  app.set('trust proxy', 1);
}

// If CORS_ORIGIN is set, restrict allowed origins (comma-separated). Otherwise keep the current
// behavior for local dev (allow all).
app.use(cors(corsOrigins ? { origin: corsOrigins } : undefined));
app.use(helmet());

// Basic rate limiting for public APIs (tune via env vars).
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 300 : 2000));
app.use(
  '/api',
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: process.env.JSON_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API meta
app.get('/api', (req, res) => {
  res.json({
    name: 'VanMart API',
    version: '1.0.0',
    description: '接龙团购平台 API',
  });
});

// Routers
import ordersRouter from './routes/orders';
import messagesRouter from './routes/messages';
import statsRouter from './routes/stats';
import goodsRouter from './routes/goods';
import martsRouter from './routes/marts';
import usersRouter from './routes/users';

app.use('/api/orders', ordersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/goods', goodsRouter);
app.use('/api/marts', martsRouter);
app.use('/api/users', usersRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' });
});

export default app;
