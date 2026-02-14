import { Router, Request, Response } from 'express';
import prisma from '../db';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

const sendMessageSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().optional(),
  type: z.string().trim().min(1).optional(),
  relatedId: z.string().trim().optional(),
});

// 发送消息
router.post('/', requireAuth, validateBody(sendMessageSchema), async (req: Request, res: Response) => {
  try {
    const { title, content, type = 'system', relatedId } = req.body as z.infer<typeof sendMessageSchema>;
    const userId = req.user!.id;

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
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      type,
      isRead,
      page = 1,
      pageSize = 20
    } = req.query;

    const userId = req.user!.id;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId };
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
        where: { userId, isRead: false }
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
router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message0 = await prisma.message.findUnique({ where: { id }, select: { userId: true } });
    if (!message0 || message0.userId !== req.user!.id) return res.status(404).json({ error: '消息不存在' });

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
router.post('/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

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
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message0 = await prisma.message.findUnique({ where: { id }, select: { userId: true } });
    if (!message0 || message0.userId !== req.user!.id) return res.status(404).json({ error: '消息不存在' });

    await prisma.message.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('删除消息失败:', error);
    res.status(500).json({ error: '删除消息失败' });
  }
});

export default router;
