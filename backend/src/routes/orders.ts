import { Router, Request, Response } from 'express';
import prisma from '../db';
import { Decimal } from '@prisma/client/runtime/library';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

const createOrderSchema = z.object({
  martId: z.string().min(1),
  receiverName: z.string().trim().min(1),
  receiverPhone: z.string().trim().min(1),
  province: z.string().trim().min(1),
  city: z.string().trim().min(1),
  district: z.string().trim().min(1),
  detailAddress: z.string().trim().min(1),
  buyerRemark: z.string().trim().optional(),
  items: z.array(z.object({ goodsId: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['CREATED', 'PENDING_SHIPMENT', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELED']),
  shippingCompany: z.string().trim().optional(),
  shippingNo: z.string().trim().optional(),
  cancelReason: z.string().trim().optional(),
  sellerRemark: z.string().trim().optional(),
});

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
router.post('/', requireAuth, validateBody(createOrderSchema), async (req: Request, res: Response) => {
  try {
    const {
      martId,
      receiverName,
      receiverPhone,
      province,
      city,
      district,
      detailAddress,
      buyerRemark,
      items
    } = req.body as z.infer<typeof createOrderSchema>;

    const userId = req.user!.id;

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
            order: { userId, martId, status: { not: 'CANCELED' } }
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
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        mart: {
          select: { id: true, topic: true, userId: true }
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

    const actorId = req.user!.id;
    const isBuyer = order.userId === actorId;
    const isOrganizer = !!order.mart?.userId && order.mart.userId === actorId;
    if (!isBuyer && !isOrganizer) return res.status(403).json({ error: '无权限' });

    res.json(order);
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 更新订单状态
router.patch('/:id/status', requireAuth, validateBody(updateOrderStatusSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, shippingCompany, shippingNo, cancelReason, sellerRemark } =
      req.body as z.infer<typeof updateOrderStatusSchema>;

    const validStatuses = ['CREATED', 'PENDING_SHIPMENT', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { mart: { select: { userId: true } } },
    });
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const actorId = req.user!.id;
    const isBuyer = order.userId === actorId;
    const isOrganizer = !!order.mart?.userId && order.mart.userId === actorId;

    // Authorization:
    // - Buyer: can cancel (CREATED/PENDING_SHIPMENT -> CANCELED) and confirm receipt (DELIVERED -> COMPLETED)
    // - Organizer: other status transitions (shipping / delivery operations)
    if (status === 'CANCELED') {
      if (!isBuyer) return res.status(403).json({ error: '无权限' });
    } else if (status === 'COMPLETED') {
      if (!isBuyer && !isOrganizer) return res.status(403).json({ error: '无权限' });
    } else {
      if (!isOrganizer) return res.status(403).json({ error: '无权限' });
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
      if (!shippingCompany || !shippingNo) {
        return res.status(400).json({ error: '发货必须填写物流公司和单号' });
      }
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
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      martId,
      status,
      orderNo,
      province,
      city
    } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};

    const actorId = req.user!.id;
    if (martId) {
      const mart = await prisma.mart.findUnique({ where: { id: martId as string }, select: { userId: true } });
      if (mart?.userId && mart.userId === actorId) {
        // Organizer view: list all orders for this mart
        where.martId = martId as string;
      } else {
        // Buyer view: only own orders
        where.martId = martId as string;
        where.userId = actorId;
      }
    } else {
      // Default: list my orders
      where.userId = actorId;
    }
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
