-- ============================================
-- 所有索引定义汇总
-- All Indexes Summary
-- ============================================

-- 注意：所有索引已在各表创建文件中定义
-- 本文件仅作为索引策略文档

-- ============================================
-- 用户相关索引
-- ============================================
-- idx_users_phone - 登录查询优化
-- idx_user_sessions_user_id - 会话查询
-- idx_user_sessions_expires_at - 过期会话清理

-- ============================================
-- 地址相关索引
-- ============================================
-- idx_shipping_addresses_user_id - 用户地址列表
-- idx_shipping_addresses_is_default - 默认地址查询

-- ============================================
-- Mart相关索引
-- ============================================
-- idx_marts_user_id - 我发起的Mart
-- idx_marts_status - 按状态筛选
-- idx_marts_finish_time - 截止时间排序
-- idx_marts_created_at - 创建时间排序（首页列表）
-- idx_mart_images_mart_id - Mart图片查询
-- idx_mart_delivery_areas_mart_id - 配送范围查询
-- idx_mart_delivery_areas_code - 地区编码查询（校验配送范围）

-- ============================================
-- 商品相关索引
-- ============================================
-- idx_goods_mart_id - Mart的商品列表
-- idx_goods_category_id - 分类浏览
-- idx_goods_status - 商品状态筛选
-- idx_goods_images_goods_id - 商品图片查询
-- idx_goods_purchase_limit - 限购数量快速查询

-- ============================================
-- 成本库存相关索引 ⭐ 新增
-- ============================================
-- idx_materials_mart_id - Mart的材料列表
-- idx_low_stock_alerts_goods_id - 商品的预警记录
-- idx_low_stock_alerts_status - 预警状态筛选（未处理/已处理）
-- idx_low_stock_alerts_mart_id - Mart的所有预警

-- ============================================
-- 订单相关索引
-- ============================================
-- idx_orders_mart_id - Mart的订单统计
-- idx_orders_user_id - 用户订单列表（我的订单）
-- idx_orders_status - 订单状态筛选
-- idx_orders_order_no - 订单号查询
-- idx_orders_created_at - 订单流水排序
-- idx_orders_province_city - 区域维度统计
-- idx_order_items_order_id - 订单明细查询
-- idx_order_items_goods_id - 商品的销售统计
-- idx_order_delivery_tracks_order_id - 配送轨迹

-- ============================================
-- 交互相关索引 ⭐ 新增
-- ============================================
-- idx_mart_participations_mart_id - Mart参与人数统计
-- idx_mart_participations_user_id - 用户参与列表
-- idx_goods_likes_user_id - 我的喜欢列表
-- idx_goods_likes_goods_id - 商品的喜欢计数
-- idx_goods_suggestions_user_id - 用户的建议列表
-- idx_goods_suggestions_goods_id - 商品的建议列表
-- idx_goods_suggestions_status - 待处理建议查询
-- idx_goods_reviews_user_id - 用户的评论列表
-- idx_goods_reviews_goods_id - 商品的所有评论
-- idx_goods_reviews_is_approved - 已批准评论（前端展示）
-- idx_goods_reviews_mart_id - Mart的所有评论

-- ============================================
-- 消息相关索引
-- ============================================
-- idx_messages_user_id - 用户消息列表
-- idx_messages_is_read - 未读消息查询
-- idx_messages_created_at - 消息流水
-- idx_messages_type - 消息类型筛选

-- ============================================
-- 系统配置相关索引
-- ============================================
-- idx_help_articles_category - 帮助文章分类
-- idx_help_articles_is_active - 启用的文章
-- idx_carousels_is_active - 启用的轮播图
-- idx_carousels_time - 时间范围查询（定时上下线）
-- idx_system_configs_key - 配置键查询

-- ============================================
-- 地区相关索引
-- ============================================
-- idx_cities_province_code - 省份查询城市
-- idx_districts_city_code - 城市查询区县

-- ============================================
-- 复合索引（性能优化）
-- ============================================

-- 订单查询组合
-- SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY created_at DESC
-- 建议添加复合索引：(user_id, status, created_at DESC)

-- 商品查询组合
-- SELECT * FROM goods WHERE mart_id = ? AND category_id = ? AND status = 'ACTIVE'
-- 建议添加复合索引：(mart_id, status, category_id)

-- 参与查询组合
-- SELECT * FROM mart_participations WHERE mart_id = ? AND user_id = ?
-- 已有UNIQUE约束，足够

-- ============================================
-- 索引维护建议
-- ============================================

-- 定期重建索引（每月）
-- REINDEX INDEX idx_orders_created_at;
-- REINDEX INDEX idx_messages_is_read;

-- 分析索引使用情况
-- SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;  -- 未使用的索引

-- 删除未使用的索引
-- DROP INDEX IF EXISTS unused_index;

-- ============================================
-- 慢查询优化建议
-- ============================================

-- 1. Mart列表查询（首页）- 需要排序
-- SELECT * FROM marts 
-- WHERE status = 'OPEN' 
-- ORDER BY created_at DESC 
-- LIMIT 10;
-- ✓ 索引：idx_marts_created_at

-- 2. 用户订单查询
-- SELECT * FROM orders 
-- WHERE user_id = ? 
-- ORDER BY created_at DESC;
-- ✓ 索引：idx_orders_user_id + idx_orders_created_at

-- 3. 商品统计汇总
-- SELECT goods_id, SUM(quantity) as total_sold 
-- FROM order_items 
-- WHERE order_id IN (SELECT id FROM orders WHERE mart_id = ?)
-- GROUP BY goods_id;
-- ✓ 索引：idx_order_items_order_id, idx_orders_mart_id

-- 4. 区域维度统计
-- SELECT province, city, COUNT(*) 
-- FROM orders 
-- WHERE mart_id = ? 
-- GROUP BY province, city;
-- ✓ 索引：idx_orders_province_city

-- 5. 库存预警查询
-- SELECT * FROM low_stock_alerts 
-- WHERE status = 'ACTIVE' 
-- ORDER BY created_at DESC;
-- ✓ 索引：idx_low_stock_alerts_status

-- ============================================
-- 查询优化技巧
-- ============================================

-- 使用EXPLAIN分析查询计划
-- EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = '...' ORDER BY created_at DESC LIMIT 10;

-- 查看表统计
-- ANALYZE orders;

-- 查看索引大小
-- SELECT relname, pg_size_pretty(pg_total_relation_size(C.oid)) 
-- FROM pg_class C 
-- WHERE relkind = 'i'
-- ORDER BY pg_total_relation_size(C.oid) DESC;
