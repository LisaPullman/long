-- ============================================
-- Mart (接龙活动) 相关表
-- Mart Activity Related Tables
-- ============================================

-- Mart 主表
-- 存储接龙活动的基本信息
CREATE TABLE IF NOT EXISTS marts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 发起者
  topic VARCHAR(500) NOT NULL,                 -- 接龙主题
  description TEXT,                            -- 接龙描述
  set_finish_time BOOLEAN DEFAULT FALSE,       -- 是否设置截止时间
  finish_time TIMESTAMPTZ,                     -- 截止时间
  status VARCHAR(20) DEFAULT 'OPEN',           -- 状态：OPEN/CLOSED/ENDED
  browse_count INTEGER DEFAULT 0,              -- 浏览次数
  is_single_product BOOLEAN DEFAULT FALSE,     -- 是否单商品模式
  group_sum INTEGER,                           -- 最小成团数量
  delivery_description TEXT,                   -- 配送说明
  expected_ship_days INTEGER DEFAULT 3,        -- 截单后预计发货天数
  auto_confirm_days INTEGER DEFAULT 7,         -- 自动确认收货天数
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE marts IS 'Mart主表：接龙团购活动';
COMMENT ON COLUMN marts.id IS 'Mart ID';
COMMENT ON COLUMN marts.user_id IS '发起者用户ID';
COMMENT ON COLUMN marts.topic IS '接龙主题';
COMMENT ON COLUMN marts.description IS '接龙详细描述';
COMMENT ON COLUMN marts.set_finish_time IS '是否设置截止时间';
COMMENT ON COLUMN marts.finish_time IS '截单截止时间';
COMMENT ON COLUMN marts.status IS '状态：OPEN(进行中)/CLOSED(已截单)/ENDED(已结束)';
COMMENT ON COLUMN marts.browse_count IS '浏览次数';
COMMENT ON COLUMN marts.is_single_product IS '是否单商品模式';
COMMENT ON COLUMN marts.group_sum IS '最小成团数量';
COMMENT ON COLUMN marts.delivery_description IS '配送方式、时效说明';
COMMENT ON COLUMN marts.expected_ship_days IS '截单后多少天发货';
COMMENT ON COLUMN marts.auto_confirm_days IS '多少天后自动确认收货';


-- Mart 图片表
-- 存储接龙的介绍图片
CREATE TABLE IF NOT EXISTS mart_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,  -- 关联Mart
  image_url TEXT NOT NULL,                     -- 图片URL
  sort_order INTEGER DEFAULT 0,                -- 排序号
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE mart_images IS 'Mart图片表：Mart的介绍图';
COMMENT ON COLUMN mart_images.id IS '图片ID';
COMMENT ON COLUMN mart_images.mart_id IS '关联Mart ID';
COMMENT ON COLUMN mart_images.image_url IS '图片URL';
COMMENT ON COLUMN mart_images.sort_order IS '显示排序（从小到大）';


-- Mart 配送范围表
-- 定义Mart可配送的地区
CREATE TABLE IF NOT EXISTS mart_delivery_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,  -- 关联Mart
  province VARCHAR(50),                        -- 省份名称
  province_code VARCHAR(10),                   -- 省份代码
  city VARCHAR(50),                            -- 城市名称
  city_code VARCHAR(10),                       -- 城市代码
  district VARCHAR(50),                        -- 区县名称
  district_code VARCHAR(10),                   -- 区县代码
  level VARCHAR(20) NOT NULL,                  -- 区划级别：province/city/district
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE mart_delivery_areas IS 'Mart配送范围表：Mart支持的配送区域';
COMMENT ON COLUMN mart_delivery_areas.id IS '配送范围ID';
COMMENT ON COLUMN mart_delivery_areas.mart_id IS '关联Mart ID';
COMMENT ON COLUMN mart_delivery_areas.province IS '省份名称';
COMMENT ON COLUMN mart_delivery_areas.province_code IS '省份代码';
COMMENT ON COLUMN mart_delivery_areas.city IS '城市名称';
COMMENT ON COLUMN mart_delivery_areas.city_code IS '城市代码';
COMMENT ON COLUMN mart_delivery_areas.district IS '区县名称';
COMMENT ON COLUMN mart_delivery_areas.district_code IS '区县代码';
COMMENT ON COLUMN mart_delivery_areas.level IS '行政区划级别';


-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_marts_user_id ON marts(user_id);
CREATE INDEX IF NOT EXISTS idx_marts_status ON marts(status);
CREATE INDEX IF NOT EXISTS idx_marts_finish_time ON marts(finish_time);
CREATE INDEX IF NOT EXISTS idx_marts_created_at ON marts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mart_images_mart_id ON mart_images(mart_id);
CREATE INDEX IF NOT EXISTS idx_mart_delivery_areas_mart_id ON mart_delivery_areas(mart_id);
CREATE INDEX IF NOT EXISTS idx_mart_delivery_areas_code ON mart_delivery_areas(province_code, city_code, district_code);
