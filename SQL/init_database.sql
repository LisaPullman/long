-- ============================================
-- VanMart 数据库一键初始化脚本
-- VanMart Database Initialization Script
-- ============================================

-- 此脚本包含所有SQL文件的内容，可一次性执行
-- 执行方式：psql -U user -d vanmart -f init_database.sql

-- ============================================
-- 1. 初始化扩展
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

\echo '✓ PostgreSQL 扩展已初始化'

-- ============================================
-- 2. 用户相关表
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE,
  nickname VARCHAR(100),
  avatar_url TEXT,
  password_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  real_name VARCHAR(50),
  id_card VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info VARCHAR(500),
  ip_address VARCHAR(45),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

\echo '✓ 用户相关表已创建'

-- ============================================
-- 3. 收货地址表
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_name VARCHAR(50) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  province VARCHAR(50) NOT NULL,
  province_code VARCHAR(10),
  city VARCHAR(50) NOT NULL,
  city_code VARCHAR(10),
  district VARCHAR(50) NOT NULL,
  district_code VARCHAR(10),
  detail_address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  tag VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_is_default ON shipping_addresses(user_id, is_default);

\echo '✓ 收货地址表已创建'

-- ============================================
-- 4. Mart相关表
-- ============================================

CREATE TABLE IF NOT EXISTS marts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  topic VARCHAR(500) NOT NULL,
  description TEXT,
  set_finish_time BOOLEAN DEFAULT FALSE,
  finish_time TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'OPEN',
  browse_count INTEGER DEFAULT 0,
  is_single_product BOOLEAN DEFAULT FALSE,
  group_sum INTEGER,
  delivery_description TEXT,
  expected_ship_days INTEGER DEFAULT 3,
  auto_confirm_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_delivery_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  province VARCHAR(50),
  province_code VARCHAR(10),
  city VARCHAR(50),
  city_code VARCHAR(10),
  district VARCHAR(50),
  district_code VARCHAR(10),
  level VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marts_user_id ON marts(user_id);
CREATE INDEX IF NOT EXISTS idx_marts_status ON marts(status);
CREATE INDEX IF NOT EXISTS idx_marts_finish_time ON marts(finish_time);
CREATE INDEX IF NOT EXISTS idx_marts_created_at ON marts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mart_images_mart_id ON mart_images(mart_id);
CREATE INDEX IF NOT EXISTS idx_mart_delivery_areas_mart_id ON mart_delivery_areas(mart_id);
CREATE INDEX IF NOT EXISTS idx_mart_delivery_areas_code ON mart_delivery_areas(province_code, city_code, district_code);

\echo '✓ Mart相关表已创建'

-- ============================================
-- 5. 商品相关表
-- ============================================

CREATE TABLE IF NOT EXISTS goods_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES goods_categories(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  specification VARCHAR(200),
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  repertory INTEGER NOT NULL DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  is_set_group BOOLEAN DEFAULT FALSE,
  group_sum INTEGER,
  low_stock_threshold INTEGER,
  purchase_limit INTEGER,
  cost DECIMAL(10, 2),
  material_cost_items TEXT,
  labor_cost DECIMAL(10, 2),
  packaging_cost DECIMAL(10, 2),
  likes_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goods_mart_id ON goods(mart_id);
CREATE INDEX IF NOT EXISTS idx_goods_category_id ON goods(category_id);
CREATE INDEX IF NOT EXISTS idx_goods_status ON goods(status);
CREATE INDEX IF NOT EXISTS idx_goods_images_goods_id ON goods_images(goods_id);
CREATE INDEX IF NOT EXISTS idx_goods_purchase_limit ON goods(mart_id, purchase_limit);

\echo '✓ 商品相关表已创建'

-- ============================================
-- 6. 成本库存相关表
-- ============================================

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT '克',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  threshold INTEGER,
  current_stock INTEGER,
  alerted_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_mart_id ON materials(mart_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_goods_id ON low_stock_alerts(goods_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_status ON low_stock_alerts(status);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_mart_id ON low_stock_alerts(mart_id);

\echo '✓ 成本库存相关表已创建'

-- ============================================
-- 7. 订单相关表
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no VARCHAR(32) UNIQUE NOT NULL,
  mart_id UUID REFERENCES marts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  receiver_name VARCHAR(50) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  province VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  district VARCHAR(50) NOT NULL,
  detail_address VARCHAR(500) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  freight_amount DECIMAL(10, 2) DEFAULT 0,
  goods_cost DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'CREATED',
  shipping_company VARCHAR(100),
  shipping_no VARCHAR(100),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  buyer_remark TEXT,
  seller_remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  goods_id UUID REFERENCES goods(id) ON DELETE SET NULL,
  goods_name VARCHAR(200) NOT NULL,
  goods_image TEXT,
  specification VARCHAR(200),
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  goods_cost DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_delivery_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  operator VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_mart_id ON orders(mart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_province_city ON orders(province, city);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_goods_id ON order_items(goods_id);
CREATE INDEX IF NOT EXISTS idx_order_delivery_tracks_order_id ON order_delivery_tracks(order_id);

\echo '✓ 订单相关表已创建'

-- ============================================
-- 8. 交互相关表
-- ============================================

CREATE TABLE IF NOT EXISTS mart_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mart_id, user_id)
);

CREATE TABLE IF NOT EXISTS goods_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, goods_id)
);

CREATE TABLE IF NOT EXISTS goods_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(50),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  title VARCHAR(200),
  content TEXT,
  review_type VARCHAR(20) DEFAULT 'goods',
  is_approved BOOLEAN DEFAULT FALSE,
  images TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mart_participations_mart_id ON mart_participations(mart_id);
CREATE INDEX IF NOT EXISTS idx_mart_participations_user_id ON mart_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_goods_likes_user_id ON goods_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_goods_likes_goods_id ON goods_likes(goods_id);
CREATE INDEX IF NOT EXISTS idx_goods_suggestions_user_id ON goods_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_goods_suggestions_goods_id ON goods_suggestions(goods_id);
CREATE INDEX IF NOT EXISTS idx_goods_suggestions_status ON goods_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_goods_reviews_user_id ON goods_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_goods_reviews_goods_id ON goods_reviews(goods_id);
CREATE INDEX IF NOT EXISTS idx_goods_reviews_is_approved ON goods_reviews(goods_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_goods_reviews_mart_id ON goods_reviews(mart_id);

\echo '✓ 交互相关表已创建'

-- ============================================
-- 9. 消息相关表
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type VARCHAR(50) DEFAULT 'system',
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);

\echo '✓ 消息相关表已创建'

-- ============================================
-- 10. 系统配置表
-- ============================================

CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  category VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carousels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200),
  image_url TEXT NOT NULL,
  link_url TEXT,
  link_type VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  description VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_is_active ON help_articles(is_active);
CREATE INDEX IF NOT EXISTS idx_carousels_is_active ON carousels(is_active);
CREATE INDEX IF NOT EXISTS idx_carousels_time ON carousels(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(config_key);

\echo '✓ 系统配置表已创建'

-- ============================================
-- 11. 地区相关表
-- ============================================

CREATE TABLE IF NOT EXISTS provinces (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
  code VARCHAR(10) PRIMARY KEY,
  province_code VARCHAR(10) REFERENCES provinces(code),
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS districts (
  code VARCHAR(10) PRIMARY KEY,
  city_code VARCHAR(10) REFERENCES cities(code),
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cities_province_code ON cities(province_code);
CREATE INDEX IF NOT EXISTS idx_districts_city_code ON districts(city_code);

\echo '✓ 地区相关表已创建'

-- ============================================
-- 完成
-- ============================================

\echo ''
\echo '======================================'
\echo '✓ VanMart 数据库初始化完成！'
\echo '======================================'
\echo ''
\echo '已创建的对象：'
\echo '  - 表数量：23'
\echo '  - 索引数量：30+'
\echo '  - 外键约束：多个'
\echo '  - 唯一约束：多个'
\echo ''
\echo '下一步建议：'
\echo '  1. 加载地区数据：psql -f SQL/seed_regions.sql'
\echo '  2. 配置 Prisma：npx prisma generate'
\echo '  3. 运行种子数据：npx prisma db seed'
\echo ''
