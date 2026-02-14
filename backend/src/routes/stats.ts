import { Router, Request, Response } from 'express';
import prisma from '../db';
import { Decimal } from '@prisma/client/runtime/library';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Mart统计摘要
router.get('/mart/:id/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mart = await prisma.mart.findUnique({
      where: { id },
      include: {
        goods: true,
        orders: {
          where: { status: { not: 'CANCELED' } },
          include: { items: true }
        },
        participations: true
      }
    });

    if (!mart) {
      return res.status(404).json({ error: '接龙活动不存在' });
    }

    if (!mart.userId || mart.userId !== req.user?.id) {
      return res.status(403).json({ error: '无权限' });
    }

    // 计算统计数据
    let totalOrders = 0;
    let totalAmount = new Decimal(0);
    let totalGoodsCost = new Decimal(0);
    const goodsStats: Record<string, any> = {};
    const regionStats: Record<string, any> = {};

    for (const order of mart.orders) {
      totalOrders++;
      totalAmount = totalAmount.add(order.totalAmount);
      totalGoodsCost = totalGoodsCost.add(order.goodsCost);

      // 商品统计
      for (const item of order.items) {
        if (!goodsStats[item.goodsId || '']) {
          goodsStats[item.goodsId || ''] = {
            goodsId: item.goodsId,
            goodsName: item.goodsName,
            quantity: 0,
            amount: new Decimal(0)
          };
        }
        goodsStats[item.goodsId || ''].quantity += item.quantity;
        goodsStats[item.goodsId || ''].amount = goodsStats[item.goodsId || ''].amount.add(item.subtotal);
      }

      // 区域统计
      const regionKey = `${order.province}-${order.city}`;
      if (!regionStats[regionKey]) {
        regionStats[regionKey] = {
          province: order.province,
          city: order.city,
          orderCount: 0,
          amount: new Decimal(0)
        };
      }
      regionStats[regionKey].orderCount++;
      regionStats[regionKey].amount = regionStats[regionKey].amount.add(order.totalAmount);
    }

    // 按状态统计
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: { martId: id },
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    const summary = {
      mart: {
        id: mart.id,
        topic: mart.topic,
        status: mart.status,
        browseCount: mart.browseCount,
        participantCount: mart.participations.length
      },
      orders: {
        total: totalOrders,
        totalAmount: totalAmount.toNumber(),
        totalGoodsCost: totalGoodsCost.toNumber(),
        profit: totalAmount.minus(totalGoodsCost).toNumber(),
        byStatus: ordersByStatus.map(s => ({
          status: s.status,
          count: s._count.id,
          amount: s._sum.totalAmount?.toNumber() || 0
        }))
      },
      goods: Object.values(goodsStats).map((g: any) => ({
        ...g,
        amount: g.amount.toNumber()
      })).sort((a: any, b: any) => b.quantity - a.quantity),
      regions: Object.values(regionStats).map((r: any) => ({
        ...r,
        amount: r.amount.toNumber()
      })).sort((a: any, b: any) => b.orderCount - a.orderCount)
    };

    res.json(summary);
  } catch (error) {
    console.error('获取Mart统计失败:', error);
    res.status(500).json({ error: '获取Mart统计失败' });
  }
});

// 用户订单统计
router.get('/user/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 按状态统计
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    // 总计
    const totalStats = await prisma.order.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { totalAmount: true, goodsCost: true }
    });

    // 最近订单
    const recentOrders = await prisma.order.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        mart: { select: { id: true, topic: true } },
        items: { take: 2 }
      }
    });

    // 参与的Mart数量
    const participatedMarts = await prisma.martParticipation.count({
      where: { userId }
    });

    const stats = {
      total: {
        orderCount: totalStats._count.id,
        totalAmount: totalStats._sum.totalAmount?.toNumber() || 0
      },
      byStatus: ordersByStatus.map(s => ({
        status: s.status,
        count: s._count.id,
        amount: s._sum.totalAmount?.toNumber() || 0
      })),
      participatedMarts,
      recentOrders
    };

    res.json(stats);
  } catch (error) {
    console.error('获取用户订单统计失败:', error);
    res.status(500).json({ error: '获取用户订单统计失败' });
  }
});

export default router;
