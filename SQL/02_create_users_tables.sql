-- ============================================
-- 用户相关表
-- Users Related Tables
-- ============================================

-- 用户表
-- 存储用户的基本账户信息
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE,                    -- 手机号（唯一）
  nickname VARCHAR(100),                       -- 昵称
  avatar_url TEXT,                             -- 头像URL
  password_hash VARCHAR(255),                  -- 密码哈希（可选，支持账号密码登录）
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE users IS '用户表：存储用户账户信息';
COMMENT ON COLUMN users.id IS '用户ID（UUID）';
COMMENT ON COLUMN users.phone IS '手机号（登录凭证）';
COMMENT ON COLUMN users.nickname IS '昵称（显示名称）';
COMMENT ON COLUMN users.avatar_url IS '用户头像URL';
COMMENT ON COLUMN users.password_hash IS '密码哈希值（可选）';
COMMENT ON COLUMN users.created_at IS '账户创建时间';
COMMENT ON COLUMN users.updated_at IS '账户更新时间';


-- 用户详情表
-- 存储用户的扩展资料信息
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,  -- 关联用户
  real_name VARCHAR(50),                       -- 真实姓名
  id_card VARCHAR(20),                         -- 身份证号（可选，用于实名认证）
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新时间
);

COMMENT ON TABLE user_profiles IS '用户详情表：存储用户的扩展资料';
COMMENT ON COLUMN user_profiles.id IS '资料ID';
COMMENT ON COLUMN user_profiles.user_id IS '关联用户ID（一对一）';
COMMENT ON COLUMN user_profiles.real_name IS '用户真实姓名';
COMMENT ON COLUMN user_profiles.id_card IS '身份证号（实名认证用）';


-- 用户会话表
-- 用于 JWT 刷新令牌管理和会话追踪
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- 关联用户
  refresh_token_hash VARCHAR(255) NOT NULL,   -- 刷新令牌哈希
  device_info VARCHAR(500),                    -- 设备信息（User-Agent等）
  ip_address VARCHAR(45),                      -- 登录IP地址
  expires_at TIMESTAMPTZ NOT NULL,             -- 过期时间
  created_at TIMESTAMPTZ DEFAULT NOW()         -- 创建时间
);

COMMENT ON TABLE user_sessions IS '用户会话表：管理会话和令牌';
COMMENT ON COLUMN user_sessions.id IS '会话ID';
COMMENT ON COLUMN user_sessions.user_id IS '关联用户ID';
COMMENT ON COLUMN user_sessions.refresh_token_hash IS '刷新令牌哈希值';
COMMENT ON COLUMN user_sessions.device_info IS '登录设备信息';
COMMENT ON COLUMN user_sessions.ip_address IS '登录IP地址';
COMMENT ON COLUMN user_sessions.expires_at IS '会话过期时间';


-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
