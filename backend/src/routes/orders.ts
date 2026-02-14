import { Router, Request, Response } from 'express';
import prisma from '../db';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// 生成订单号
function generateOrderNo(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `VM${year}${month}${day}${random}`;
}

// 创建订单
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      martId,
      userId,
      receiverName,
      receiverPhone,
      province,
      city,
      district,
      detailAddress,
      buyerRemark,
      items
    } = req.body;

    // 验证必填字段（写操作必须登录）
    if (!martId || !userId || !receiverName || !receiverPhone || !province || !city || !district || !detailAddress || !items?.length) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 检查Mart是否存在且开放
    const mart = await prisma.mart.findUnique({
      where: { id: martId },
      include: { goods: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } }
    });

    if (!mart) {
      return res.status(404).json({ error: '接龙活动不存在' });
    }

    if (mart.status !== 'OPEN') {
      return res.status(400).json({ error: '接龙活动已结束或关闭' });
    }

    // 检查截止时间
    if (mart.setFinishTime && mart.finishTime && new Date() > mart.finishTime) {
      return res.status(400).json({ error: '接龙活动已截止' });
    }

    // 验证商品并计算总价
    let totalAmount = new Decimal(0);
    let goodsCost = new Decimal(0);
    const orderItems: any[] = [];

    for (const item of items) {
      const goods = mart.goods.find(g => g.id === item.goodsId);
      if (!goods) {
        return res.status(400).json({ error: `商品 ${item.goodsId} 不存在` });
      }

      // 检查库存
      if (item.quantity > goods.repertory) {
        return res.status(400).json({ error: `商品 ${goods.name} 库存不足` });
      }

      // 检查限购
      if (goods.purchaseLimit) {
        const existingOrder = await prisma.orderItem.findFirst({
          where: {
            goodsId: goods.id,
            order: { userId: userId, martId: martId, status: { not: 'CANCELED' } }
          },
          include: { order: true }
        });
        const existingQty = existingOrder ? existingOrder.quantity : 0;
        if (existingQty + item.quantity > goods.purchaseLimit) {
          return res.status(400).json({
            error: `商品 ${goods.name} 每位客户限购 ${goods.purchaseLimit} 件，您已购 ${existingQty} 件`
          });
        }
      }

      const subtotal = new Decimal(goods.price.toString()).mul(item.quantity);
      totalAmount = totalAmount.add(subtotal);
      goodsCost = goodsCost.add(new Decimal(goods.cost?.toString() || '0').mul(item.quantity));

      orderItems.push({
        goodsId: goods.id,
        goodsName: goods.name,
        goodsImage: goods.images[0]?.imageUrl || null,
        specification: goods.specification,
        price: goods.price,
        quantity: item.quantity,
        subtotal: subtotal,
        goodsCost: new Decimal(goods.cost?.toString() || '0').mul(item.quantity)
      });
    }

    // 创建订单
    const order = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        martId,
        userId,
        receiverName,
        receiverPhone,
        province,
        city,
        district,
        detailAddress,
        totalAmount,
        goodsCost,
        buyerRemark,
        status: 'CREATED',
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    });

    // 更新商品库存和销量
    for (const item of items) {
      await prisma.goods.update({
        where: { id: item.goodsId },
        data: {
          repertory: { decrement: item.quantity },
          soldCount: { increment: item.quantity }
        }
      });
    }

    // 创建或更新参与记录
    if (userId) {
      await prisma.martParticipation.upsert({
        where: { martId_userId: { martId, userId } },
        update: { orderId: order.id },
        create: { martId, userId, orderId: order.id }
      });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

// 获取订单详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        mart: {
          select: { id: true, topic: true }
        },
        user: {
          select: { id: true, nickname: true, phone: true }
        },
        deliveryTracks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json(order);
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 更新订单状态
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, shippingCompany, shippingNo, cancelReason, sellerRemark } = req.body;

    const validStatuses = ['CREATED', 'PENDING_SHIPMENT', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 状态转换验证
    const statusFlow: Record<string, string[]> = {
      'CREATED': ['PENDING_SHIPMENT', 'CANCELED'],
      'PENDING_SHIPMENT': ['SHIPPED', 'CANCELED'],
      'SHIPPED': ['DELIVERED', 'CANCELED'],
      'DELIVERED': ['COMPLETED', 'CANCELED'],
      'COMPLETED': [],
      'CANCELED': []
    };

    if (!statusFlow[order.status].includes(status)) {
      return res.status(400).json({ error: `不能从 ${order.status} 状态转换到 ${status}` });
    }

    const updateData: any = { status };

    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
      updateData.shippingCompany = shippingCompany;
      updateData.shippingNo = shippingNo;
    }

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (status === 'CANCELED') {
      updateData.canceledAt = new Date();
      updateData.cancelReason = cancelReason;

      // 恢复库存
      const items = await prisma.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        await prisma.goods.update({
          where: { id: item.goodsId! },
          data: {
            repertory: { increment: item.quantity },
            soldCount: { decrement: item.quantity }
          }
        });
      }
    }

    if (sellerRemark) {
      updateData.sellerRemark = sellerRemark;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true }
    });

    // 创建物流跟踪记录
    await prisma.orderDeliveryTrack.create({
      data: {
        orderId: id,
        status,
        description: `订单状态更新为: ${status}`
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({ error: '更新订单状态失败' });
  }
});

// 获取订单列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      martId,
      userId,
      status,
      orderNo,
      province,
      city
    } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};

    if (martId) where.martId = martId as string;
    if (userId) where.userId = userId as string;
    if (status) where.status = status as string;
    if (orderNo) where.orderNo = { contains: orderNo as string };
    if (province) where.province = province as string;
    if (city) where.city = city as string;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            take: 3
          },
          mart: {
            select: { id: true, topic: true }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      data: orders,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

export default router;
