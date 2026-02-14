-- ============================================
-- 用户交互相关表 ⭐ 新增
-- User Interaction Related Tables (NEW)
-- ============================================

-- 参与记录表
-- 记录用户参与接龙活动
CREATE TABLE IF NOT EXISTS mart_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,  -- 关联Mart
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- 参与用户
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,  -- 关联订单
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 参与时间
);

COMMENT ON TABLE mart_participations IS '参与记录表：用户参与的Mart活动';
COMMENT ON COLUMN mart_participations.id IS '参与记录ID';
COMMENT ON COLUMN mart_participations.mart_id IS '参与的Mart ID';
COMMENT ON COLUMN mart_participations.user_id IS '参与用户ID';
COMMENT ON COLUMN mart_participations.order_id IS '对应的订单ID';

-- 复合唯一约束：一个用户在一个Mart中只能参与一次
ALTER TABLE mart_participations ADD CONSTRAINT mart_participations_unique UNIQUE(mart_id, user_id);


-- 商品喜欢表 ⭐ 新增：商品喜欢功能
-- 记录用户喜欢的商品
CREATE TABLE IF NOT EXISTS goods_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- 用户
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE, -- 商品
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 喜欢时间
);

COMMENT ON TABLE goods_likes IS '商品喜欢表：用户喜欢的商品记录 ⭐ 新增';
COMMENT ON COLUMN goods_likes.id IS '喜欢记录ID';
COMMENT ON COLUMN goods_likes.user_id IS '用户ID';
COMMENT ON COLUMN goods_likes.goods_id IS '商品ID';
COMMENT ON COLUMN goods_likes.created_at IS '喜欢时间';

-- 复合唯一约束：一个用户对一个商品只能喜欢一次
ALTER TABLE goods_likes ADD CONSTRAINT goods_likes_unique UNIQUE(user_id, goods_id);


-- 商品建议表 ⭐ 新增：改进建议功能
-- 用户购买后可提交的改进建议
CREATE TABLE IF NOT EXISTS goods_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- 建议者
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,  -- 关联订单（购买凭证）
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE, -- 商品
  suggestion_type VARCHAR(50),                 -- 建议类型（甜度、口感、软硬度、包装等）
  content TEXT NOT NULL,                       -- 建议内容（最多500字）
  status VARCHAR(20) DEFAULT 'PENDING',        -- 状态：PENDING(待处理)/PROCESSED(已处理)/IGNORED(已忽略)
  processed_at TIMESTAMPTZ,                    -- 处理时间
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,  -- 处理人（管理员）
  processor_notes TEXT,                        -- 处理备注
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 建议提交时间
);

COMMENT ON TABLE goods_suggestions IS '商品建议表：用户的改进建议 ⭐ 新增';
COMMENT ON COLUMN goods_suggestions.id IS '建议ID';
COMMENT ON COLUMN goods_suggestions.user_id IS '建议者用户ID';
COMMENT ON COLUMN goods_suggestions.order_id IS '关联订单ID（证明已购）';
COMMENT ON COLUMN goods_suggestions.goods_id IS '被建议的商品ID';
COMMENT ON COLUMN goods_suggestions.suggestion_type IS '建议类型（自由填写）';
COMMENT ON COLUMN goods_suggestions.content IS '建议内容';
COMMENT ON COLUMN goods_suggestions.status IS '处理状态：PENDING/PROCESSED/IGNORED';
COMMENT ON COLUMN goods_suggestions.processed_at IS '处理时间';
COMMENT ON COLUMN goods_suggestions.processed_by IS '处理人ID（管理员）';
COMMENT ON COLUMN goods_suggestions.processor_notes IS '管理员的处理备注';


-- 商品评论表 ⭐ 新增：评论和评分功能
-- 用户购买后可提交的商品评论
CREATE TABLE IF NOT EXISTS goods_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- 评论者
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,  -- 关联订单
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE, -- 被评论商品
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,  -- 所属Mart
  rating INTEGER NOT NULL,                     -- 评分(1-5星)
  title VARCHAR(200),                          -- 评论标题
  content TEXT,                                -- 评论内容
  review_type VARCHAR(20) DEFAULT 'goods',     -- 评论类型：goods(商品)/shop(店铺)
  is_approved BOOLEAN DEFAULT FALSE,           -- 是否已批准（发起者审核）
  images TEXT,                                 -- 评论图片 JSON数组: [url1, url2, ...]
  approved_at TIMESTAMPTZ,                     -- 批准时间
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 评论时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE goods_reviews IS '商品评论表：用户评论与评分 ⭐ 新增';
COMMENT ON COLUMN goods_reviews.id IS '评论ID';
COMMENT ON COLUMN goods_reviews.user_id IS '评论者用户ID';
COMMENT ON COLUMN goods_reviews.order_id IS '关联订单ID（购买凭证）';
COMMENT ON COLUMN goods_reviews.goods_id IS '被评论的商品ID';
COMMENT ON COLUMN goods_reviews.mart_id IS '所属Mart ID';
COMMENT ON COLUMN goods_reviews.rating IS '评分（1-5星）';
COMMENT ON COLUMN goods_reviews.title IS '评论标题';
COMMENT ON COLUMN goods_reviews.content IS '评论内容';
COMMENT ON COLUMN goods_reviews.review_type IS '评论类型';
COMMENT ON COLUMN goods_reviews.is_approved IS '是否已批准发布（需店主审核）';
COMMENT ON COLUMN goods_reviews.images IS '评论配图JSON数组';
COMMENT ON COLUMN goods_reviews.approved_at IS '批准发布的时间';


-- ============================================
-- 索引
-- ============================================

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
