-- ============================================
-- 消息系统表
-- Message System Tables
-- ============================================

-- 消息表
-- 系统消息通知（订单、库存、营销等）
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- 接收者
  title VARCHAR(200) NOT NULL,                 -- 消息标题
  content TEXT,                                -- 消息内容
  type VARCHAR(50) DEFAULT 'system',           -- 消息类型：
                                               -- system(系统通知)
                                               -- order(订单通知)
                                               -- shipping(配送通知)
                                               -- inventory_alert(库存预警) ⭐ 新增
                                               -- promotion(营销推广)
  related_id UUID,                             -- 关联业务ID（订单ID、商品ID等）
  is_read BOOLEAN DEFAULT FALSE,               -- 是否已读
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE messages IS '消息表：系统消息通知';
COMMENT ON COLUMN messages.id IS '消息ID';
COMMENT ON COLUMN messages.user_id IS '接收者用户ID';
COMMENT ON COLUMN messages.title IS '消息标题';
COMMENT ON COLUMN messages.content IS '消息内容';
COMMENT ON COLUMN messages.type IS '消息类型（system/order/shipping/inventory_alert等）';
COMMENT ON COLUMN messages.related_id IS '关联的业务ID';
COMMENT ON COLUMN messages.is_read IS '是否已读';
COMMENT ON COLUMN messages.created_at IS '消息创建时间';


-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
