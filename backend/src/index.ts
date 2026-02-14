import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.get('/api', (req, res) => {
  res.json({
    name: 'VanMart API',
    version: '1.0.0',
    description: '接龙团购平台 API'
  });
});

// 订单路由
import ordersRouter from './routes/orders';
app.use('/api/orders', ordersRouter);

// 消息路由
import messagesRouter from './routes/messages';
app.use('/api/messages', messagesRouter);

// 统计路由
import statsRouter from './routes/stats';
app.use('/api/stats', statsRouter);

// 商品路由
import goodsRouter from './routes/goods';
app.use('/api/goods', goodsRouter);

// Mart路由
import martsRouter from './routes/marts';
app.use('/api/marts', martsRouter);

// 用户路由
import usersRouter from './routes/users';
app.use('/api/users', usersRouter);

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`VanMart API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
