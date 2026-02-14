import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// 获取商品列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { martId, categoryId, status } = req.query;

    const where: any = {};
    if (martId) where.martId = martId as string;
    if (categoryId) where.categoryId = categoryId as string;
    if (status) where.status = status as string;

    const goods = await prisma.goods.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        _count: { select: { likes: true, reviews: true } }
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(goods);
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

// 获取商品详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const goods = await prisma.goods.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        mart: { select: { id: true, topic: true, status: true } },
        _count: { select: { likes: true, reviews: true } }
      }
    });

    if (!goods) {
      return res.status(404).json({ error: '商品不存在' });
    }

    res.json(goods);
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

// 创建商品
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      martId,
      categoryId,
      name,
      description,
      specification,
      price,
      originalPrice,
      repertory,
      lowStockThreshold,
      purchaseLimit,
      cost,
      laborCost,
      packagingCost,
      sortOrder,
      images
    } = req.body;

    const goods = await prisma.goods.create({
      data: {
        martId,
        categoryId,
        name,
        description,
        specification,
        price,
        originalPrice,
        repertory: repertory || 0,
        lowStockThreshold,
        purchaseLimit,
        cost,
        laborCost,
        packagingCost,
        sortOrder: sortOrder || 0,
        status: 'ACTIVE',
        images: images ? {
          create: images.map((img: any, index: number) => ({
            imageUrl: img.imageUrl,
            sortOrder: index
          }))
        } : undefined
      },
      include: { images: true }
    });

    res.status(201).json(goods);
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(500).json({ error: '创建商品失败' });
  }
});

// 更新商品
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const goods = await prisma.goods.update({
      where: { id },
      data: updateData
    });

    res.json(goods);
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({ error: '更新商品失败' });
  }
});

// 删除商品
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.goods.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ error: '删除商品失败' });
  }
});

// 商品点赞
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const existing = await prisma.goodsLike.findUnique({
      where: { userId_goodsId: { userId, goodsId: id } }
    });

    if (existing) {
      return res.status(400).json({ error: '已经点赞过了' });
    }

    await prisma.$transaction([
      prisma.goodsLike.create({
        data: { userId, goodsId: id }
      }),
      prisma.goods.update({
        where: { id },
        data: { likesCount: { increment: 1 } }
      })
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ error: '点赞失败' });
  }
});

// 取消点赞
router.delete('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await prisma.$transaction([
      prisma.goodsLike.delete({
        where: { userId_goodsId: { userId, goodsId: id } }
      }),
      prisma.goods.update({
        where: { id },
        data: { likesCount: { decrement: 1 } }
      })
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json({ error: '取消点赞失败' });
  }
});

export default router;
