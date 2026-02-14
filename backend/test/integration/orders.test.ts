import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/db';

const DEMO_USER_ID = 'demo-user-001';
const DEMO_MART_ID = 'demo-mart-001';
const GOODS_1 = 'demo-goods-001'; // purchaseLimit: 5, repertory: 100 (seed)
const GOODS_2 = 'demo-goods-002'; // purchaseLimit: 3, repertory: 80 (seed)

async function resetOrderSideEffects() {
  await prisma.orderDeliveryTrack.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.martParticipation.deleteMany({});
  await prisma.order.deleteMany({});

  await prisma.goods.update({
    where: { id: GOODS_1 },
    data: { repertory: 100, soldCount: 0 },
  });
  await prisma.goods.update({
    where: { id: GOODS_2 },
    data: { repertory: 80, soldCount: 0 },
  });
}

describe('Orders integration', () => {
  beforeEach(async () => {
    await resetOrderSideEffects();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/orders creates an order and decrements inventory', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        martId: DEMO_MART_ID,
        userId: DEMO_USER_ID,
        receiverName: '张三',
        receiverPhone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        detailAddress: '某某街道某某小区1号楼101室',
        items: [{ goodsId: GOODS_1, quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('orderNo');
    expect(res.body.status).toBe('CREATED');
    expect(res.body.items).toHaveLength(1);

    const goods = await prisma.goods.findUnique({ where: { id: GOODS_1 } });
    expect(goods?.repertory).toBe(98);
    expect(goods?.soldCount).toBe(2);
  });

  it('POST /api/orders enforces purchaseLimit based on previous non-canceled orders', async () => {
    const first = await request(app)
      .post('/api/orders')
      .send({
        martId: DEMO_MART_ID,
        userId: DEMO_USER_ID,
        receiverName: '张三',
        receiverPhone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        detailAddress: '某某街道某某小区1号楼101室',
        items: [{ goodsId: GOODS_2, quantity: 2 }],
      });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/orders')
      .send({
        martId: DEMO_MART_ID,
        userId: DEMO_USER_ID,
        receiverName: '张三',
        receiverPhone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        detailAddress: '某某街道某某小区1号楼101室',
        items: [{ goodsId: GOODS_2, quantity: 2 }],
      });

    expect(second.status).toBe(400);
    expect(second.body?.error).toContain('限购');
  });

  it('PATCH /api/orders/:id/status cancels an order and restores inventory', async () => {
    const created = await request(app)
      .post('/api/orders')
      .send({
        martId: DEMO_MART_ID,
        userId: DEMO_USER_ID,
        receiverName: '张三',
        receiverPhone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        detailAddress: '某某街道某某小区1号楼101室',
        items: [{ goodsId: GOODS_1, quantity: 3 }],
      });
    expect(created.status).toBe(201);

    const orderId = created.body.id as string;
    const canceled = await request(app).patch(`/api/orders/${orderId}/status`).send({ status: 'CANCELED' });
    expect(canceled.status).toBe(200);
    expect(canceled.body.status).toBe('CANCELED');

    const goods = await prisma.goods.findUnique({ where: { id: GOODS_1 } });
    expect(goods?.repertory).toBe(100);
    expect(goods?.soldCount).toBe(0);
  });
});

