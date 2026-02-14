-- ============================================
-- 商品相关表
-- Goods Related Tables
-- ============================================

-- 商品分类表
-- 管理商品的分类（如：蛋糕、包面等）
CREATE TABLE IF NOT EXISTS goods_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,                  -- 分类名称
  icon_url TEXT,                               -- 分类图标URL
  sort_order INTEGER DEFAULT 0,                -- 排序号
  is_active BOOLEAN DEFAULT TRUE,              -- 是否启用
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE goods_categories IS '商品分类表：蛋糕、包面等分类';
COMMENT ON COLUMN goods_categories.id IS '分类ID';
COMMENT ON COLUMN goods_categories.name IS '分类名称';
COMMENT ON COLUMN goods_categories.icon_url IS '分类图标URL';
COMMENT ON COLUMN goods_categories.sort_order IS '显示排序';
COMMENT ON COLUMN goods_categories.is_active IS '是否启用';


-- 商品表
-- 核心:商品信息，包含新增的成本管理和限购字段
CREATE TABLE IF NOT EXISTS goods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,  -- 关联Mart
  category_id UUID REFERENCES goods_categories(id),     -- 商品分类
  name VARCHAR(200) NOT NULL,                  -- 商品名称
  description TEXT,                            -- 商品描述
  specification VARCHAR(200),                  -- 规格（如：6寸、8寸）
  price DECIMAL(10, 2) NOT NULL,               -- 销售价格
  original_price DECIMAL(10, 2),               -- 原价（用于划线价）
  repertory INTEGER NOT NULL DEFAULT 0,        -- 库存数量
  sold_count INTEGER DEFAULT 0,                -- 已售数量
  is_set_group BOOLEAN DEFAULT FALSE,          -- 是否参加成团（单商品模式）
  group_sum INTEGER,                           -- 最小成团数量
  low_stock_threshold INTEGER,                 -- 库存预警阈值 ⭐ 新增
  purchase_limit INTEGER,                      -- 商品限购数量 ⭐ 新增
  cost DECIMAL(10, 2),                         -- 原料成本 ⭐ 新增
  material_cost_items TEXT,                    -- JSON: [{materialId, materialName, weight, unitPrice}] ⭐ 新增
  labor_cost DECIMAL(10, 2),                   -- 人工成本 ⭐ 新增
  packaging_cost DECIMAL(10, 2),               -- 包装成本 ⭐ 新增
  likes_count INTEGER DEFAULT 0,               -- 喜欢人数 ⭐ 新增
  sort_order INTEGER DEFAULT 0,                -- 排序号
  status VARCHAR(20) DEFAULT 'ACTIVE',         -- 状态：ACTIVE/INACTIVE
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE goods IS '商品表：接龙中的商品';
COMMENT ON COLUMN goods.id IS '商品ID';
COMMENT ON COLUMN goods.mart_id IS '关联Mart ID';
COMMENT ON COLUMN goods.category_id IS '商品分类ID';
COMMENT ON COLUMN goods.name IS '商品名称';
COMMENT ON COLUMN goods.description IS '商品描述';
COMMENT ON COLUMN goods.specification IS '商品规格';
COMMENT ON COLUMN goods.price IS '商品销售价格';
COMMENT ON COLUMN goods.original_price IS '原价（用于展示打折）';
COMMENT ON COLUMN goods.repertory IS '当前库存';
COMMENT ON COLUMN goods.sold_count IS '已售数量';
COMMENT ON COLUMN goods.is_set_group IS '是否参加最小成团';
COMMENT ON COLUMN goods.group_sum IS '最小成团数量';
COMMENT ON COLUMN goods.low_stock_threshold IS '库存预警阈值 ⭐ 新增：库存提醒功能';
COMMENT ON COLUMN goods.purchase_limit IS '每个客户限购数量 ⭐ 新增：商品限购功能';
COMMENT ON COLUMN goods.cost IS '商品总成本 ⭐ 新增：成本计算功能';
COMMENT ON COLUMN goods.material_cost_items IS '材料清单JSON ⭐ 新增：成本分解';
COMMENT ON COLUMN goods.labor_cost IS '人工成本 ⭐ 新增';
COMMENT ON COLUMN goods.packaging_cost IS '包装成本 ⭐ 新增';
COMMENT ON COLUMN goods.likes_count IS '被喜欢的次数 ⭐ 新增：商品喜欢功能';
COMMENT ON COLUMN goods.sort_order IS '商品排序';
COMMENT ON COLUMN goods.status IS '商品状态';


-- 商品图片表
-- 存储商品的图片
CREATE TABLE IF NOT EXISTS goods_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,  -- 关联商品
  image_url TEXT NOT NULL,                     -- 图片URL
  sort_order INTEGER DEFAULT 0,                -- 排序号
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE goods_images IS '商品图片表：商品的展示图片';
COMMENT ON COLUMN goods_images.id IS '图片ID';
COMMENT ON COLUMN goods_images.goods_id IS '关联商品ID';
COMMENT ON COLUMN goods_images.image_url IS '图片URL';
COMMENT ON COLUMN goods_images.sort_order IS '图片排序';


-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_goods_mart_id ON goods(mart_id);
CREATE INDEX IF NOT EXISTS idx_goods_category_id ON goods(category_id);
CREATE INDEX IF NOT EXISTS idx_goods_status ON goods(status);
CREATE INDEX IF NOT EXISTS idx_goods_images_goods_id ON goods_images(goods_id);
CREATE INDEX IF NOT EXISTS idx_goods_purchase_limit ON goods(mart_id, purchase_limit);
