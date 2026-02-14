-- ============================================
-- 收货地址相关表
-- Shipping Address Tables
-- ============================================

-- 收货地址表
-- 用户可以管理多个收货地址
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- 关联用户
  receiver_name VARCHAR(50) NOT NULL,          -- 收货人姓名
  receiver_phone VARCHAR(20) NOT NULL,         -- 收货人电话
  province VARCHAR(50) NOT NULL,               -- 省份名称
  province_code VARCHAR(10),                   -- 省份代码（国家统计局标准）
  city VARCHAR(50) NOT NULL,                   -- 城市名称
  city_code VARCHAR(10),                       -- 城市代码
  district VARCHAR(50) NOT NULL,               -- 区县名称
  district_code VARCHAR(10),                   -- 区县代码
  detail_address VARCHAR(500) NOT NULL,        -- 详细地址（街道、门牌号等）
  latitude DECIMAL(10, 8),                     -- 纬度（可选，用于地图定位）
  longitude DECIMAL(11, 8),                    -- 经度（可选，用于地图定位）
  tag VARCHAR(20),                             -- 地址标签（家/公司/其他）
  is_default BOOLEAN DEFAULT FALSE,            -- 是否为默认地址
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE shipping_addresses IS '收货地址表：用户的配送地址管理';
COMMENT ON COLUMN shipping_addresses.id IS '地址ID';
COMMENT ON COLUMN shipping_addresses.user_id IS '关联用户ID';
COMMENT ON COLUMN shipping_addresses.receiver_name IS '收货人姓名';
COMMENT ON COLUMN shipping_addresses.receiver_phone IS '收货人手机号';
COMMENT ON COLUMN shipping_addresses.province IS '省份名称';
COMMENT ON COLUMN shipping_addresses.province_code IS '省份代码';
COMMENT ON COLUMN shipping_addresses.city IS '城市名称';
COMMENT ON COLUMN shipping_addresses.city_code IS '城市代码';
COMMENT ON COLUMN shipping_addresses.district IS '区县名称';
COMMENT ON COLUMN shipping_addresses.district_code IS '区县代码';
COMMENT ON COLUMN shipping_addresses.detail_address IS '详细地址';
COMMENT ON COLUMN shipping_addresses.latitude IS '地理位置纬度';
COMMENT ON COLUMN shipping_addresses.longitude IS '地理位置经度';
COMMENT ON COLUMN shipping_addresses.tag IS '地址标签（家/公司等）';
COMMENT ON COLUMN shipping_addresses.is_default IS '是否为默认地址';


-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_is_default ON shipping_addresses(user_id, is_default);
