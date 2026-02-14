-- ============================================
-- 订单相关表
-- Order Related Tables
-- ============================================

-- 订单表
-- 核心订单信息，包含新增的成本追踪字段
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no VARCHAR(32) UNIQUE NOT NULL,        -- 订单号（唯一）
  mart_id UUID REFERENCES marts(id) ON DELETE SET NULL,  -- 关联Mart
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 购买用户

  -- 收货信息（冗余存储，防止地址修改影响历史订单）
  receiver_name VARCHAR(50) NOT NULL,          -- 收货人
  receiver_phone VARCHAR(20) NOT NULL,         -- 收货电话
  province VARCHAR(50) NOT NULL,               -- 省份
  city VARCHAR(50) NOT NULL,                   -- 城市
  district VARCHAR(50) NOT NULL,               -- 区县
  detail_address VARCHAR(500) NOT NULL,        -- 详细地址

  -- 金额信息
  total_amount DECIMAL(10, 2) NOT NULL,        -- 订单总金额
  freight_amount DECIMAL(10, 2) DEFAULT 0,     -- 运费
  goods_cost DECIMAL(10, 2) DEFAULT 0,         -- 商品成本 ⭐ 新增：成本追踪

  -- 状态信息
  status VARCHAR(30) DEFAULT 'CREATED',        -- 订单状态
                                               -- CREATED: 待处理
                                               -- PENDING_SHIPMENT: 待发货
                                               -- SHIPPED: 已发货
                                               -- DELIVERED: 已送达
                                               -- COMPLETED: 已完成
                                               -- CANCELED: 已取消

  -- 配送信息
  shipping_company VARCHAR(100),               -- 物流公司
  shipping_no VARCHAR(100),                    -- 物流单号
  shipped_at TIMESTAMPTZ,                      -- 发货时间
  delivered_at TIMESTAMPTZ,                    -- 送达时间
  completed_at TIMESTAMPTZ,                    -- 完成时间
  canceled_at TIMESTAMPTZ,                     -- 取消时间
  cancel_reason TEXT,                          -- 取消原因

  -- 备注
  buyer_remark TEXT,                           -- 买家备注
  seller_remark TEXT,                          -- 卖家备注

  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE orders IS '订单表：接龙团购订单';
COMMENT ON COLUMN orders.id IS '订单ID';
COMMENT ON COLUMN orders.order_no IS '订单号（唯一标识）';
COMMENT ON COLUMN orders.mart_id IS '所属Mart ID';
COMMENT ON COLUMN orders.user_id IS '购买用户ID';
COMMENT ON COLUMN orders.receiver_name IS '收货人姓名';
COMMENT ON COLUMN orders.receiver_phone IS '收货人电话';
COMMENT ON COLUMN orders.province IS '省份（冗余，防止地址变更）';
COMMENT ON COLUMN orders.city IS '城市（冗余）';
COMMENT ON COLUMN orders.district IS '区县（冗余）';
COMMENT ON COLUMN orders.detail_address IS '详细地址（冗余）';
COMMENT ON COLUMN orders.total_amount IS '订单总金额';
COMMENT ON COLUMN orders.freight_amount IS '运费';
COMMENT ON COLUMN orders.goods_cost IS '商品成本 ⭐ 新增：用于成本分析和利润计算';
COMMENT ON COLUMN orders.status IS '订单状态';
COMMENT ON COLUMN orders.shipping_company IS '物流公司名称';
COMMENT ON COLUMN orders.shipping_no IS '物流单号';
COMMENT ON COLUMN orders.shipped_at IS '发货时间';
COMMENT ON COLUMN orders.delivered_at IS '送达时间';
COMMENT ON COLUMN orders.completed_at IS '订单完成时间';
COMMENT ON COLUMN orders.canceled_at IS '取消时间';
COMMENT ON COLUMN orders.cancel_reason IS '取消原因';
COMMENT ON COLUMN orders.buyer_remark IS '买家备注';
COMMENT ON COLUMN orders.seller_remark IS '卖家（店主）备注';


-- 订单明细表
-- 订单中的每件商品
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,  -- 关联订单
  goods_id UUID REFERENCES goods(id) ON DELETE SET NULL,  -- 关联商品
  goods_name VARCHAR(200) NOT NULL,            -- 商品名称（冗余，防止商品删除）
  goods_image TEXT,                            -- 商品图片URL
  specification VARCHAR(200),                  -- 规格
  price DECIMAL(10, 2) NOT NULL,               -- 商品单价
  quantity INTEGER NOT NULL,                   -- 购买数量
  subtotal DECIMAL(10, 2) NOT NULL,            -- 小计金额
  goods_cost DECIMAL(10, 2) DEFAULT 0,         -- 当前商品成本 ⭐ 新增：历史成本快照
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE order_items IS '订单明细表：订单中的商品列表';
COMMENT ON COLUMN order_items.id IS '订单明细ID';
COMMENT ON COLUMN order_items.order_id IS '关联订单ID';
COMMENT ON COLUMN order_items.goods_id IS '关联商品ID';
COMMENT ON COLUMN order_items.goods_name IS '商品名称（冗余）';
COMMENT ON COLUMN order_items.goods_image IS '商品图片';
COMMENT ON COLUMN order_items.specification IS '商品规格';
COMMENT ON COLUMN order_items.price IS '购买时商品单价';
COMMENT ON COLUMN order_items.quantity IS '购买数量';
COMMENT ON COLUMN order_items.subtotal IS '小计 = price × quantity';
COMMENT ON COLUMN order_items.goods_cost IS '购买时商品单位成本 ⭐ 新增：成本快照';


-- 订单配送轨迹表
-- 记录订单的配送进展
CREATE TABLE IF NOT EXISTS order_delivery_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,  -- 关联订单
  status VARCHAR(30) NOT NULL,                 -- 状态标志
  description TEXT,                            -- 状态描述
  location VARCHAR(200),                       -- 配送地点
  operator VARCHAR(100),                       -- 操作人
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 记录时间
);

COMMENT ON TABLE order_delivery_tracks IS '配送轨迹表：订单的配送进程记录';
COMMENT ON COLUMN order_delivery_tracks.id IS '轨迹ID';
COMMENT ON COLUMN order_delivery_tracks.order_id IS '关联订单ID';
COMMENT ON COLUMN order_delivery_tracks.status IS '状态标志';
COMMENT ON COLUMN order_delivery_tracks.description IS '状态描述文案';
COMMENT ON COLUMN order_delivery_tracks.location IS '当前配送地点';
COMMENT ON COLUMN order_delivery_tracks.operator IS '更新者';


-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_mart_id ON orders(mart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_province_city ON orders(province, city);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_goods_id ON order_items(goods_id);
CREATE INDEX IF NOT EXISTS idx_order_delivery_tracks_order_id ON order_delivery_tracks(order_id);
