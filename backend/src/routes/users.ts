import { Router, Request, Response } from 'express';
import prisma from '../db';
import bcrypt from 'bcryptjs';

const router = Router();

// 用户注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, password, nickname } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '手机号是必填字段' });
    }

    // 检查手机号是否已注册
    const existing = await prisma.user.findUnique({
      where: { phone }
    });

    if (existing) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 加密密码
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        nickname: nickname || `用户${phone.slice(-4)}`
      }
    });

    res.status(201).json({
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '手机号是必填字段' });
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    if (user.passwordHash && password) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: '密码错误' });
      }
    }

    res.json({
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取用户信息
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
        profile: true,
        shippingAddresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
        },
        _count: {
          select: { marts: true, orders: true, participations: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nickname, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { nickname, avatarUrl }
    });

    res.json({
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

// 获取用户收货地址列表
router.get('/:id/addresses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const addresses = await prisma.shippingAddress.findMany({
      where: { userId: id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });

    res.json(addresses);
  } catch (error) {
    console.error('获取收货地址失败:', error);
    res.status(500).json({ error: '获取收货地址失败' });
  }
});

// 添加收货地址
router.post('/:id/addresses', async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;
    const {
      receiverName,
      receiverPhone,
      province,
      provinceCode,
      city,
      cityCode,
      district,
      districtCode,
      detailAddress,
      latitude,
      longitude,
      tag,
      isDefault
    } = req.body;

    // 如果设为默认，先取消其他默认地址
    if (isDefault) {
      await prisma.shippingAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.shippingAddress.create({
      data: {
        userId,
        receiverName,
        receiverPhone,
        province,
        provinceCode,
        city,
        cityCode,
        district,
        districtCode,
        detailAddress,
        latitude,
        longitude,
        tag,
        isDefault: isDefault || false
      }
    });

    res.status(201).json(address);
  } catch (error) {
    console.error('添加收货地址失败:', error);
    res.status(500).json({ error: '添加收货地址失败' });
  }
});

// 更新收货地址
router.put('/:id/addresses/:addressId', async (req: Request, res: Response) => {
  try {
    const { id: userId, addressId } = req.params;
    const updateData = req.body;

    // 如果设为默认，先取消其他默认地址
    if (updateData.isDefault) {
      await prisma.shippingAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.shippingAddress.update({
      where: { id: addressId },
      data: updateData
    });

    res.json(address);
  } catch (error) {
    console.error('更新收货地址失败:', error);
    res.status(500).json({ error: '更新收货地址失败' });
  }
});

// 删除收货地址
router.delete('/:id/addresses/:addressId', async (req: Request, res: Response) => {
  try {
    const { addressId } = req.params;

    await prisma.shippingAddress.delete({
      where: { id: addressId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('删除收货地址失败:', error);
    res.status(500).json({ error: '删除收货地址失败' });
  }
});

export default router;
