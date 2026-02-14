-- ============================================
-- VanMart 种子数据
-- VanMart Seed Data
-- ============================================

-- 此文件包含初始数据示例

-- ============================================
-- 商品分类数据
-- ============================================

-- INSERT INTO goods_categories (name, icon_url, sort_order, is_active) VALUES
-- ('蛋糕', 'https://example.com/cake.png', 1, true),
-- ('包面', 'https://example.com/bread.png', 2, true),
-- ('饮品', 'https://example.com/drink.png', 3, true),
-- ('甜点', 'https://example.com/dessert.png', 4, true);

-- ============================================
-- 地区数据示例 (华东地区)
-- ============================================

-- 江苏省
-- INSERT INTO provinces (code, name) VALUES ('320000', '江苏省');
-- INSERT INTO cities (code, province_code, name) VALUES
-- ('320100', '320000', '南京市'),
-- ('320500', '320000', '苏州市'),
-- ('320600', '320000', '南通市');

-- 江苏-南京市的区
-- INSERT INTO districts (code, city_code, name) VALUES
-- ('320102', '320100', '玄武区'),
-- ('320103', '320100', '秦淮区'),
-- ('320104', '320100', '建邺区'),
-- ('320105', '320100', '鼓楼区');

-- 浙江省
-- INSERT INTO provinces (code, name) VALUES ('330000', '浙江省');
-- INSERT INTO cities (code, province_code, name) VALUES
-- ('330100', '330000', '杭州市'),
-- ('330500', '330000', '嘉兴市'),
-- ('330600', '330000', '金华市');

-- 浙江-杭州市的区
-- INSERT INTO districts (code, city_code, name) VALUES
-- ('330102', '330100', '上城区'),
-- ('330103', '330100', '下城区'),
-- ('330104', '330100', '江干区'),
-- ('330105', '330100', '西湖区');

-- 安徽省
-- INSERT INTO provinces (code, name) VALUES ('340000', '安徽省');
-- INSERT INTO cities (code, province_code, name) VALUES
-- ('340100', '340000', '合肥市'),
-- ('340200', '340000', '芜湖市');

-- ============================================
-- 帮助文章示例
-- ============================================

-- INSERT INTO help_articles (title, content, category, sort_order, is_active) VALUES
-- ('如何下单？', '1. 浏览Mart列表\n2. 选择感兴趣的Mart\n3. 添加商品\n4. 填写收货地址\n5. 提交订单', '购买', 1, true),
-- ('如何支付？', '支持微信支付、支付宝、银行卡等多种支付方式', '支付', 2, true),
-- ('配送需要多长时间？', '一般在截单后3-7天内发货，请查看Mart的配送说明', '配送', 3, true),
-- ('如何确认收货？', '收到商品后，在订单详情页点击"确认收货"即可', '收货', 4, true),
-- ('可以退货吗？', '请联系卖家沟通，根据商品情况判断是否可以退回', '售后', 5, true);

-- ============================================
-- 系统配置示例
-- ============================================

-- INSERT INTO system_configs (config_key, config_value, description) VALUES
-- ('phone_regex', '^1[3-9]\\d{9}$', '手机号格式验证正则表达式'),
-- ('min_order_amount', '40', '最小订单金额（元）'),
-- ('shipping_free_threshold', '60', '免运费门槛（元）'),
-- ('auto_confirm_days', '7', '自动确认收货天数'),
-- ('upload_max_size', '10485760', '上传文件最大大小（字节=10MB）'),
-- ('low_stock_alert_threshold', '5', '库存预警默认阈值'),
-- ('sms_rate_limit', '3', '短信发送频率限制（次/分钟）');

-- ============================================
-- 测试用户示例
-- ============================================

-- INSERT INTO users (phone, nickname, avatar_url) VALUES
-- ('13800138000', '张三', 'https://example.com/avatar1.jpg'),
-- ('13800138001', '李四', 'https://example.com/avatar2.jpg'),
-- ('13800138002', '王五', 'https://example.com/avatar3.jpg');

-- ============================================
-- 测试地址示例
-- ============================================

-- INSERT INTO shipping_addresses (user_id, receiver_name, receiver_phone, province, province_code, city, city_code, district, district_code, detail_address, is_default)
-- SELECT id, '张三', '13800138000', '浙江省', '330000', '杭州市', '330100', '西湖区', '330105', '文一路1000号', true
-- FROM users WHERE phone = '13800138000'
-- LIMIT 1;

-- ============================================
-- 测试Mart示例
-- ============================================

-- INSERT INTO marts (user_id, topic, description, set_finish_time, finish_time, status, delivery_description, is_single_product, group_sum)
-- SELECT id, '新年蛋糕团购', '新年特惠蛋糕大集合，品种丰富，质量保证！', true, NOW() + INTERVAL '7 days', 'OPEN', '发货地点：杭州市，配送周期：3-5天', true, 10
-- FROM users WHERE phone = '13800138001'
-- LIMIT 1;

-- ============================================
-- 测试商品示例
-- ============================================

-- INSERT INTO goods (mart_id, category_id, name, specification, price, repertory, low_stock_threshold, purchase_limit, cost, labor_cost, packaging_cost)
-- SELECT m.id, gc.id, '黑森林蛋糕6寸', '6寸', '88.00', '50', '10', '3', '25.00', '8.00', '3.00'
-- FROM marts m 
-- LEFT JOIN goods_categories gc ON gc.name = '蛋糕'
-- WHERE m.topic = '新年蛋糕团购'
-- LIMIT 1;

-- ============================================
-- SQL执行说明
-- ============================================

-- 注意：大部分数据已注释，需要按需启用
-- 原因：
-- 1. 测试数据可能与真实业务冲突
-- 2. UUID需要实际的用户/Mart ID关联
-- 3. 避免在不同环境的交叉污染

-- 建议步骤：
-- 1. 首先运行 init_database.sql 初始化Schema
-- 2. 可选：加载地区数据 (INSERT provinces, cities, districts)
-- 3. 可选：加载系统配置
-- 4. 可选：通过API/后台界面创建测试数据

-- ============================================
-- 完整地区数据脚本
-- 可从以下来源获取：
-- - https://github.com/xiangyuecn/AreaData
-- - 国家统计局行政区划数据
-- ============================================

-- 建议：
-- 1. 从仓库获取完整的地区数据JSON
-- 2. 编写脚本转换为SQL INSERT语句
-- 3. 单独执行，避免与Schema初始化混合

-- ============================================
-- 验证数据载入
-- ============================================

-- 执行以下查询验证数据：
-- SELECT COUNT(*) as goods_count FROM goods;
-- SELECT COUNT(*) as users_count FROM users;
-- SELECT COUNT(*) as provinces_count FROM provinces;
-- SELECT * FROM goods_categories LIMIT 5;
-- SELECT * FROM system_configs LIMIT 5;
