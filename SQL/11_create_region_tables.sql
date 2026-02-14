-- ============================================
-- 地区数据表
-- Region Data Tables
-- ============================================

-- 省份表
-- 存储中国省份数据
CREATE TABLE IF NOT EXISTS provinces (
  code VARCHAR(10) PRIMARY KEY,                -- 省份代码（国家统计局标准）
  name VARCHAR(50) NOT NULL,                   -- 省份名称
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE provinces IS '省份表：中国省份数据（国家统计局标准）';
COMMENT ON COLUMN provinces.code IS '省份代码';
COMMENT ON COLUMN provinces.name IS '省份名称';


-- 城市表
-- 存储各省的城市数据
CREATE TABLE IF NOT EXISTS cities (
  code VARCHAR(10) PRIMARY KEY,                -- 城市代码
  province_code VARCHAR(10) REFERENCES provinces(code),  -- 上级省份代码
  name VARCHAR(50) NOT NULL,                   -- 城市名称
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE cities IS '城市表：各省的城市数据';
COMMENT ON COLUMN cities.code IS '城市代码';
COMMENT ON COLUMN cities.province_code IS '上级省份代码';
COMMENT ON COLUMN cities.name IS '城市名称';


-- 区县表
-- 存储各市的区县数据
CREATE TABLE IF NOT EXISTS districts (
  code VARCHAR(10) PRIMARY KEY,                -- 区县代码
  city_code VARCHAR(10) REFERENCES cities(code),  -- 上级城市代码
  name VARCHAR(50) NOT NULL,                   -- 区县名称
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE districts IS '区县表：各市的区县数据';
COMMENT ON COLUMN districts.code IS '区县代码';
COMMENT ON COLUMN districts.city_code IS '上级城市代码';
COMMENT ON COLUMN districts.name IS '区县名称';


-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cities_province_code ON cities(province_code);
CREATE INDEX IF NOT EXISTS idx_districts_city_code ON districts(city_code);

-- ============================================
-- 数据种子示例
-- Sample Data
-- ============================================

-- 示例：华东地区数据
-- INSERT INTO provinces (code, name) VALUES
-- ('320000', '江苏省'),
-- ('330000', '浙江省'),
-- ('340000', '安徽省');
--
-- INSERT INTO cities (code, province_code, name) VALUES
-- ('320100', '320000', '南京市'),
-- ('320500', '320000', '苏州市'),
-- ('330100', '330000', '杭州市'),
-- ('330500', '330000', '嘉兴市');
--
-- INSERT INTO districts (code, city_code, name) VALUES
-- ('320107', '320100', '秦淮区'),
-- ('320105', '320100', '玄武区'),
-- ('330105', '330100', '上城区'),
-- ('330106', '330100', '下城区');
