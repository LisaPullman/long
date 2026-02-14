import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
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

