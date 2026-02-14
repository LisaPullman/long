-- ============================================
-- 系统配置相关表
-- System Configuration Tables
-- ============================================

-- 帮助中心文章表
-- 存储FAQ和帮助文档
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,                 -- 文章标题
  content TEXT,                                -- 文章内容
  category VARCHAR(50),                        -- 分类（如：购买、支付、配送等）
  sort_order INTEGER DEFAULT 0,                -- 排序号
  is_active BOOLEAN DEFAULT TRUE,              -- 是否启用
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE help_articles IS '帮助文章表：FAQ和帮助文档';
COMMENT ON COLUMN help_articles.id IS '文章ID';
COMMENT ON COLUMN help_articles.title IS '文章标题';
COMMENT ON COLUMN help_articles.content IS '文章内容';
COMMENT ON COLUMN help_articles.category IS '文章分类';
COMMENT ON COLUMN help_articles.sort_order IS '显示排序';
COMMENT ON COLUMN help_articles.is_active IS '是否启用';


-- 轮播图表
-- 首页轮播图配置
CREATE TABLE IF NOT EXISTS carousels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200),                          -- 轮播图标题
  image_url TEXT NOT NULL,                     -- 图片URL
  link_url TEXT,                               -- 链接地址
  link_type VARCHAR(20),                       -- 链接类型：mart(Mart详情)/url(外链)
  sort_order INTEGER DEFAULT 0,                -- 排序号
  is_active BOOLEAN DEFAULT TRUE,              -- 是否启用
  start_time TIMESTAMPTZ,                      -- 开始展示时间
  end_time TIMESTAMPTZ,                        -- 结束展示时间
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE carousels IS '轮播图表：首页轮播图';
COMMENT ON COLUMN carousels.id IS '轮播图ID';
COMMENT ON COLUMN carousels.title IS '轮播图标题';
COMMENT ON COLUMN carousels.image_url IS '轮播图片URL';
COMMENT ON COLUMN carousels.link_url IS '点击跳转链接';
COMMENT ON COLUMN carousels.link_type IS '链接类型';
COMMENT ON COLUMN carousels.sort_order IS '显示排序';
COMMENT ON COLUMN carousels.is_active IS '是否启用';
COMMENT ON COLUMN carousels.start_time IS '定时开始展示';
COMMENT ON COLUMN carousels.end_time IS '定时结束展示';


-- 系统配置表
-- 存储全局配置参数
CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,     -- 配置键（全局唯一）
  config_value TEXT,                           -- 配置值
  description VARCHAR(500),                    -- 配置描述
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE system_configs IS '系统配置表：全局配置参数';
COMMENT ON COLUMN system_configs.id IS '配置ID';
COMMENT ON COLUMN system_configs.config_key IS '配置键（唯一）';
COMMENT ON COLUMN system_configs.config_value IS '配置值';
COMMENT ON COLUMN system_configs.description IS '配置描述';

-- 常见配置示例
-- INSERT INTO system_configs (config_key, config_value, description) VALUES
-- ('phone_regex', '^1[3-9]\\d{9}$', '手机号格式验证正则'),
-- ('min_order_amount', '40', '最小订单金额(元)'),
-- ('shipping_free_threshold', '60', '免运费门槛(元)'),
-- ('auto_confirm_days', '7', '自动确认收货天数'),
-- ('upload_max_size', '10485760', '上传文件最大大小(字节)');

-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_is_active ON help_articles(is_active);
CREATE INDEX IF NOT EXISTS idx_carousels_is_active ON carousels(is_active);
CREATE INDEX IF NOT EXISTS idx_carousels_time ON carousels(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(config_key);
