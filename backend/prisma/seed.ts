import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  // 创建测试用户
  const user = await prisma.user.upsert({
    where: { id: 'demo-user-001' },
    update: {},
    create: {
      id: 'demo-user-001',
      phone: '13800138000',
      nickname: '测试用户',
    },
  });
  console.log('创建用户:', user.id);

  // 创建收货地址
  const address = await prisma.shippingAddress.upsert({
    where: { id: 'demo-address-001' },
    update: {},
    create: {
      id: 'demo-address-001',
      userId: user.id,
      receiverName: '张三',
      receiverPhone: '13800138000',
      province: '北京市',
      provinceCode: '11',
      city: '北京市',
      cityCode: '1101',
      district: '朝阳区',
      districtCode: '110105',
      detailAddress: '某某街道某某小区1号楼101室',
      isDefault: true,
    },
  });
  console.log('创建地址:', address.id);

  // 创建最小地区数据（用于本地开发/测试）
  await prisma.province.upsert({
    where: { code: '11' },
    update: { name: '北京市' },
    create: { code: '11', name: '北京市' },
  });
  await prisma.city.upsert({
    where: { code: '1101' },
    update: { name: '北京市', provinceCode: '11' },
    create: { code: '1101', name: '北京市', provinceCode: '11' },
  });
  await prisma.district.upsert({
    where: { code: '110105' },
    update: { name: '朝阳区', cityCode: '1101' },
    create: { code: '110105', name: '朝阳区', cityCode: '1101' },
  });

  // 创建测试Mart
  const mart = await prisma.mart.upsert({
    where: { id: 'demo-mart-001' },
    update: {},
    create: {
      id: 'demo-mart-001',
      userId: user.id,
      topic: '新鲜水果接龙团购',
      description: '精选时令水果，产地直发，新鲜到家！本次团购包括苹果、橙子、葡萄等多种水果，价格优惠，欢迎参与！',
      setFinishTime: true,
      finishTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      status: 'OPEN',
      deliveryDescription: '统一配送，预计3天内发货',
      expectedShipDays: 3,
      autoConfirmDays: 7,
    },
  });
  console.log('创建Mart:', mart.id);

  // 创建Mart图片
  await prisma.martImage.deleteMany({ where: { martId: mart.id } });
  await prisma.martImage.createMany({
    data: [
      { martId: mart.id, imageUrl: 'https://picsum.photos/seed/mart1/800/600', sortOrder: 0 },
      { martId: mart.id, imageUrl: 'https://picsum.photos/seed/mart2/800/600', sortOrder: 1 },
    ],
  });

  // 创建商品分类
  const category = await prisma.goodsCategory.upsert({
    where: { id: 'demo-category-001' },
    update: {},
    create: {
      id: 'demo-category-001',
      name: '水果',
      sortOrder: 0,
      isActive: true,
    },
  });
  console.log('创建分类:', category.id);

  // 创建商品
  const goodsData = [
    {
      id: 'demo-goods-001',
      name: '红富士苹果',
      description: '正宗烟台红富士，脆甜多汁，5斤装',
      specification: '5斤/箱',
      price: 29.9,
      originalPrice: 39.9,
      repertory: 100,
      purchaseLimit: 5,
      lowStockThreshold: 10,
      cost: 15,
      laborCost: 2,
      packagingCost: 3,
    },
    {
      id: 'demo-goods-002',
      name: '赣南脐橙',
      description: '江西赣南脐橙，香甜可口，10斤装',
      specification: '10斤/箱',
      price: 39.9,
      originalPrice: 49.9,
      repertory: 80,
      purchaseLimit: 3,
      lowStockThreshold: 10,
      cost: 20,
      laborCost: 2,
      packagingCost: 3,
    },
    {
      id: 'demo-goods-003',
      name: '巨峰葡萄',
      description: '新鲜巨峰葡萄，粒大皮薄，5斤装',
      specification: '5斤/箱',
      price: 35.0,
      originalPrice: 45.0,
      repertory: 50,
      purchaseLimit: 2,
      lowStockThreshold: 5,
      cost: 18,
      laborCost: 3,
      packagingCost: 4,
    },
  ];

  for (const goods of goodsData) {
    await prisma.goods.upsert({
      where: { id: goods.id },
      update: goods,
      create: {
        ...goods,
        martId: mart.id,
        categoryId: category.id,
        status: 'ACTIVE',
      },
    });
    console.log('创建商品:', goods.id);

    // 创建商品图片
    await prisma.goodsImage.deleteMany({ where: { goodsId: goods.id } });
    await prisma.goodsImage.create({
      data: {
        goodsId: goods.id,
        imageUrl: `https://picsum.photos/seed/${goods.id}/400/400`,
        sortOrder: 0,
      },
    });
  }

  // 创建测试消息
  await prisma.message.deleteMany({ where: { userId: user.id } });
  await prisma.message.createMany({
    data: [
      {
        userId: user.id,
        title: '欢迎加入VanMart',
        content: '感谢您使用VanMart接龙团购平台！您可以在这里参与各种团购活动，享受优惠价格。',
        type: 'system',
        isRead: false,
      },
      {
        userId: user.id,
        title: '新手指南',
        content: '1. 浏览接龙活动\n2. 选择商品加入购物车\n3. 填写收货地址\n4. 提交订单\n5. 等待发货收货',
        type: 'system',
        isRead: true,
      },
    ],
  });
  console.log('创建消息');

  console.log('种子数据完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
