import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// 获取Mart列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, userId, page = 1, pageSize = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    if (status) where.status = status as string;
    if (userId) where.userId = userId as string;

    const [marts, total] = await Promise.all([
      prisma.mart.findMany({
        where,
        skip,
        take: Number(pageSize),
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          goods: { take: 3, include: { images: { take: 1 } } },
          _count: { select: { goods: true, orders: true, participations: true } },
          user: { select: { id: true, nickname: true, avatarUrl: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.mart.count({ where })
    ]);

    res.json({
      data: marts,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取Mart列表失败:', error);
    res.status(500).json({ error: '获取Mart列表失败' });
  }
});

// 获取Mart详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mart = await prisma.mart.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        goods: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            category: true,
            _count: { select: { likes: true } }
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
        },
        deliveryAreas: true,
        user: { select: { id: true, nickname: true, avatarUrl: true, phone: true } },
        _count: { select: { orders: true, participations: true } }
      }
    });

    if (!mart) {
      return res.status(404).json({ error: 'Mart不存在' });
    }

    // 增加浏览数
    await prisma.mart.update({
      where: { id },
      data: { browseCount: { increment: 1 } }
    });

    res.json(mart);
  } catch (error) {
    console.error('获取Mart详情失败:', error);
    res.status(500).json({ error: '获取Mart详情失败' });
  }
});

// 创建Mart
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      topic,
      description,
      setFinishTime,
      finishTime,
      isSingleProduct,
      groupSum,
      deliveryDescription,
      expectedShipDays,
      autoConfirmDays,
      images,
      deliveryAreas,
      goods
    } = req.body;

    const mart = await prisma.mart.create({
      data: {
        userId,
        topic,
        description,
        setFinishTime: setFinishTime || false,
        finishTime: finishTime ? new Date(finishTime) : null,
        status: 'OPEN',
        isSingleProduct: isSingleProduct || false,
        groupSum,
        deliveryDescription,
        expectedShipDays: expectedShipDays || 3,
        autoConfirmDays: autoConfirmDays || 7,
        images: images ? {
          create: images.map((img: any, index: number) => ({
            imageUrl: img.imageUrl,
            sortOrder: index
          }))
        } : undefined,
        deliveryAreas: deliveryAreas ? {
          create: deliveryAreas.map((area: any) => ({
            province: area.province,
            provinceCode: area.provinceCode,
            city: area.city,
            cityCode: area.cityCode,
            district: area.district,
            districtCode: area.districtCode,
            level: area.level
          }))
        } : undefined,
        goods: goods ? {
          create: goods.map((g: any) => ({
            name: g.name,
            description: g.description,
            specification: g.specification,
            price: g.price,
            originalPrice: g.originalPrice,
            repertory: g.repertory || 0,
            lowStockThreshold: g.lowStockThreshold,
            purchaseLimit: g.purchaseLimit,
            cost: g.cost,
            laborCost: g.laborCost,
            packagingCost: g.packagingCost,
            sortOrder: g.sortOrder || 0,
            images: g.images ? {
              create: g.images.map((img: any, index: number) => ({
                imageUrl: img.imageUrl,
                sortOrder: index
              }))
            } : undefined
          }))
        } : undefined
      },
      include: {
        images: true,
        deliveryAreas: true,
        goods: { include: { images: true } }
      }
    });

    res.status(201).json(mart);
  } catch (error) {
    console.error('创建Mart失败:', error);
    res.status(500).json({ error: '创建Mart失败' });
  }
});

// 更新Mart
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const mart = await prisma.mart.update({
      where: { id },
      data: updateData
    });

    res.json(mart);
  } catch (error) {
    console.error('更新Mart失败:', error);
    res.status(500).json({ error: '更新Mart失败' });
  }
});

// 结束Mart
router.post('/:id/end', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mart = await prisma.mart.update({
      where: { id },
      data: { status: 'ENDED' }
    });

    // 将所有未取消的订单状态更新为待发货
    await prisma.order.updateMany({
      where: {
        martId: id,
        status: 'CREATED'
      },
      data: { status: 'PENDING_SHIPMENT' }
    });

    res.json(mart);
  } catch (error) {
    console.error('结束Mart失败:', error);
    res.status(500).json({ error: '结束Mart失败' });
  }
});

// 关闭Mart（截单）
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mart = await prisma.mart.update({
      where: { id },
      data: { status: 'CLOSED' }
    });

    res.json(mart);
  } catch (error) {
    console.error('关闭Mart失败:', error);
    res.status(500).json({ error: '关闭Mart失败' });
  }
});

export default router;
