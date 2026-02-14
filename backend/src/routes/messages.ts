import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// 发送消息
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, title, content, type = 'system', relatedId } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const message = await prisma.message.create({
      data: {
        userId,
        title,
        content,
        type,
        relatedId,
        isRead: false
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({ error: '发送消息失败' });
  }
});

// 获取消息列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      type,
      isRead,
      page = 1,
      pageSize = 20
    } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId 是必填参数' });
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId: userId as string };
    if (type) where.type = type as string;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.message.count({ where }),
      prisma.message.count({
        where: { userId: userId as string, isRead: false }
      })
    ]);

    res.json({
      data: messages,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      },
      unreadCount
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({ error: '获取消息列表失败' });
  }
});

// 标记消息为已读
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(message);
  } catch (error) {
    console.error('标记消息已读失败:', error);
    res.status(500).json({ error: '标记消息已读失败' });
  }
});

// 批量标记已读
router.post('/read-all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId 是必填参数' });
    }

    const result = await prisma.message.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('批量标记已读失败:', error);
    res.status(500).json({ error: '批量标记已读失败' });
  }
});

// 删除消息
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.message.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('删除消息失败:', error);
    res.status(500).json({ error: '删除消息失败' });
  }
});

export default router;
