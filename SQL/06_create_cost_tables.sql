-- ============================================
-- 成本与库存相关表 ⭐ 新增
-- Cost & Inventory Related Tables (NEW)
-- ============================================

-- 材料表
-- 用于成本计算，记录各种材料及其单价
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,  -- 关联Mart（可选）
  name VARCHAR(100) NOT NULL,                  -- 材料名称（如：奶油、面粉等）
  unit_price DECIMAL(10, 2) NOT NULL,          -- 单位价格
  unit VARCHAR(50) DEFAULT '克',               -- 计量单位（克、个、ml等）
  description TEXT,                            -- 材料描述
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE materials IS '材料表：用于商品成本计算';
COMMENT ON COLUMN materials.id IS '材料ID';
COMMENT ON COLUMN materials.mart_id IS '关联Mart ID（可选，全局或Mart级别）';
COMMENT ON COLUMN materials.name IS '材料名称';
COMMENT ON COLUMN materials.unit_price IS '单位价格';
COMMENT ON COLUMN materials.unit IS '计量单位';
COMMENT ON COLUMN materials.description IS '材料描述';


-- 库存预警表
-- ⭐ 新增功能：库存提醒
-- 记录库存不足的商品预警
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,  -- 关联商品
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,   -- 关联Mart
  threshold INTEGER,                           -- 预警阈值
  current_stock INTEGER,                       -- 当前库存数量
  alerted_at TIMESTAMPTZ,                      -- 预警触发时间
  status VARCHAR(20) DEFAULT 'ACTIVE',         -- 状态：ACTIVE(未处理)/RESOLVED(已处理)
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE low_stock_alerts IS '库存预警表：库存低于阈值时记录 ⭐ 新增功能';
COMMENT ON COLUMN low_stock_alerts.id IS '预警ID';
COMMENT ON COLUMN low_stock_alerts.goods_id IS '预警商品ID';
COMMENT ON COLUMN low_stock_alerts.mart_id IS '所属Mart ID';
COMMENT ON COLUMN low_stock_alerts.threshold IS '预警阈值';
COMMENT ON COLUMN low_stock_alerts.current_stock IS '触发预警时的库存数';
COMMENT ON COLUMN low_stock_alerts.alerted_at IS '预警时间戳';
COMMENT ON COLUMN low_stock_alerts.status IS '预警状态：ACTIVE(未处理)/RESOLVED(已处理)';


-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_materials_mart_id ON materials(mart_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_goods_id ON low_stock_alerts(goods_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_status ON low_stock_alerts(status);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_mart_id ON low_stock_alerts(mart_id);
