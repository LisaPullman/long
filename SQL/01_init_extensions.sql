-- ============================================
-- PostgreSQL 扩展初始化
-- Initialize PostgreSQL Extensions
-- ============================================

-- 启用 UUID 生成扩展
-- 用于生成自增的全局唯一标识符
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 启用 pgcrypto（密码哈希）
-- 用于安全存储用户密码
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 启用 pg_trgm（三元组模式匹配）
-- 用于模糊查询优化（如搜索用户名）
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 启用 unaccent（音标移除）
-- 用于忽略重音符号的搜索
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 完成扩展初始化
-- 所有扩展已启用
