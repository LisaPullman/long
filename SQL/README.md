# VanMart 数据库设计文档

## 📋 数据库概览

本项目使用 **PostgreSQL 15+** 作为主数据库，采用 Prisma ORM 进行数据操作。

### 核心统计

| 指标 | 数量 |
|------|------|
| 总表数 | 23 |
| 用户相关表 | 3 |
| 地址相关表 | 1 |
| Mart相关表 | 3 |
| 商品相关表 | 2 |
| 成本相关表 | 2 |
| 订单相关表 | 3 |
| 交互相关表 | 3 |
| 消息相关表 | 1 |
| 系统配置表 | 3 |
| 地区相关表 | 3 |
| **总索引数** | **30+** |

---

## 🎯 新增功能与数据库映射

| 需求功能 | 核心表 | 关键字段 | SQL文件 |
|---------|--------|---------|---------|
| **库存提醒** | low_stock_alerts, goods | low_stock_threshold, current_stock | 06_create_cost_tables.sql |
| **成本计算** | materials, goods, order_items | cost, material_cost_items, labor_cost | 06_create_cost_tables.sql |
| **商品限购** | goods, order_items | purchase_limit | 05_create_goods_tables.sql |
| **商品喜欢** | goods_likes, goods | likes_count | 08_create_interaction_tables.sql |
| **评论建议** | goods_suggestions, goods_reviews | status, is_approved | 08_create_interaction_tables.sql |
| **数据导出** | orders, order_items, goods | 订单完整字段 | 07_create_order_tables.sql |

---

## 📂 文件结构

```
SQL/
├── README.md                          # 数据库总览文档
├── config.env                          # 数据库配置示例
├── 
├── 01_init_extensions.sql              # PostgreSQL 扩展初始化
├── 02_create_users_tables.sql          # 用户、会话、资料表
├── 03_create_address_tables.sql        # 收货地址表
├── 04_create_mart_tables.sql           # Mart及配送范围表
├── 05_create_goods_tables.sql          # 商品分类、商品、图片表
├── 06_create_cost_tables.sql           # 材料、库存预警表（新增）
├── 07_create_order_tables.sql          # 订单、订单明细、配送轨迹表
├── 08_create_interaction_tables.sql    # 参与、喜欢、建议、评论表（新增）
├── 09_create_message_tables.sql        # 消息表
├── 10_create_system_tables.sql         # 帮助文章、轮播图、系统配置表
├── 11_create_region_tables.sql         # 省市区地区表
├── 12_create_indexes.sql               # 所有索引定义
├── 13_create_enums.sql                 # 枚举类型定义
│
├── init_database.sql                   # 一键初始化脚本（包含以上所有）
├── seed.sql                            # 种子数据示例
└── prisma_schema.prisma                # Prisma Schema 配置
```

---

## 🚀 快速开始

### 1. 环境配置

```bash
# 复制配置示例
cp config.env .env

# 修改数据库连接信息
# DATABASE_URL="postgresql://user:password@localhost:5432/vanmart"
```

### 2. 创建数据库

```bash
# 创建数据库
createdb vanmart

# 或使用 psql
psql -U postgres -c "CREATE DATABASE vanmart;"
```

### 3. 初始化Schema

**方案A：一键初始化（推荐）**
```bash
psql -U youruser -d vanmart -f SQL/init_database.sql
```

**方案B：分步执行**
```bash
psql -U youruser -d vanmart -f SQL/01_init_extensions.sql
psql -U youruser -d vanmart -f SQL/02_create_users_tables.sql
psql -U youruser -d vanmart -f SQL/03_create_address_tables.sql
# ... 其他SQL文件
psql -U youruser -d vanmart -f SQL/12_create_indexes.sql
```

**方案C：使用 Prisma**
```bash
npm install
npx prisma migrate deploy
npx prisma db seed  # 加载种子数据
```

### 4. 验证安装

```bash
# 连接到数据库
psql -U youruser -d vanmart

# 列出所有表
\dt

# 列出所有索引
\di

# 查询某表的结构
\d orders
```

---

## 📊 表分类详解

### 用户相关表 (3张)

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `users` | 用户账户 | phone, nickname, avatar_url |
| `user_profiles` | 用户详细资料 | real_name, id_card |
| `user_sessions` | 会话管理 | refresh_token_hash, expires_at |

**文件**: `02_create_users_tables.sql`

### 地址相关表 (1张)

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `shipping_addresses` | 收货地址 | user_id, province, city, district, detail_address |

**文件**: `03_create_address_tables.sql`

### Mart活动表 (3张)

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `marts` | 接龙主表 | topic, status, finish_time, delivery_description |
| `mart_images` | Mart介绍图 | image_url, sort_order |
| `mart_delivery_areas` | 配送范围设置 | province, city, district, level |

**文件**: `04_create_mart_tables.sql`

### 商品相关表 (2张)

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `goods_categories` | 商品分类 | name, icon_url, sort_order |
| `goods` | **商品主表** | name, price, repertory, **purchase_limit**, **cost**, **likes_count** |
| `goods_images` | 商品图片 | image_url, sort_order |

**文件**: `05_create_goods_tables.sql`

**新增功能支持**:
- ✅ 商品限购 (purchase_limit)
- ✅ 成本管理 (cost, material_cost_items, labor_cost, packaging_cost)
- ✅ 商品喜欢 (likes_count)

### 成本库存表 (2张) ⭐ 新增

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `materials` | 材料成本库 | name, unit_price, unit |
| `low_stock_alerts` | 库存预警记录 | goods_id, threshold, current_stock, status |

**文件**: `06_create_cost_tables.sql`

**新增功能支持**:
- ✅ 库存提醒
- ✅ 成本计算

### 订单相关表 (3张)

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `orders` | **订单主表** | order_no, status, **goods_cost**, total_amount |
| `order_items` | 订单明细 | goods_id, quantity, price, **goods_cost** |
| `order_delivery_tracks` | 配送轨迹 | order_id, status, location |

**文件**: `07_create_order_tables.sql`

**新增功能支持**:
- ✅ 成本追踪 (goods_cost)
- ✅ 数据导出（包含所有必需字段）

### 交互相关表 (3张) ⭐ 新增

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `mart_participations` | 参与记录 | mart_id, user_id, order_id |
| `goods_likes` | 商品喜欢关系 | user_id, goods_id |
| `goods_suggestions` | 改进建议 | user_id, goods_id, suggestion_type, **status** |
| `goods_reviews` | 商品评论 | user_id, goods_id, rating, **is_approved** |

**文件**: `08_create_interaction_tables.sql`

**新增功能支持**:
- ✅ 商品喜欢
- ✅ 建议与评论

### 消息系统表 (1张)

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `messages` | 系统消息 | user_id, title, type, is_read |

**文件**: `09_create_message_tables.sql`

### 系统配置表 (3张)

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `help_articles` | FAQ文章 | title, category, is_active |
| `carousels` | 轮播图 | image_url, link_url, start_time, end_time |
| `system_configs` | 系统配置 | config_key, config_value |

**文件**: `10_create_system_tables.sql`

### 地区数据表 (3张)

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| `provinces` | 省份 | code, name |
| `cities` | 城市 | code, province_code, name |
| `districts` | 区县 | code, city_code, name |

**文件**: `11_create_region_tables.sql`

---

## 🔑 关键设计思想

### 1. 地区代码标准化
- 使用国家统计局标准行政区划代码
- 支持省->市->区级级联查询
- 收货地址保存完整的code和name

### 2. 成本分解存储
```
goods.cost                    # 总成本（汇总）
goods.material_cost_items     # JSON: [{materialId, weight, unitPrice}]
goods.labor_cost              # 人工成本
goods.packaging_cost          # 包装成本
order_items.goods_cost        # 订单时的成本快照（历史追踪）
```

### 3. 库存预警异步设计
- 设置阈值在 `goods.low_stock_threshold`
- 库存 <= 阈值时自动插入 `low_stock_alerts` 记录
- 通过 `messages` 表发送通知
- 支持标记为已处理 (status = 'RESOLVED')

### 4. 评论三层审核
```
goods_reviews.is_approved = false   # 待审核
goods_reviews.is_approved = true    # 已批准
approved_at                         # 批准时间戳
```

### 5. 限购跨订单累计
```
SELECT SUM(quantity) FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.goods_id = ? AND o.user_id = ? AND o.mart_id = ?
```

---

## 📈 索引策略

### 常用查询索引

**用户查询**
- `idx_users_phone` - 登录时按手机号查询
- `idx_user_sessions_expires_at` - 清理过期会话

**地址查询**
- `idx_shipping_addresses_is_default` - 查询默认地址

**Mart查询**
- `idx_marts_created_at` - 列表流水排序
- `idx_marts_status` - 按状态筛选
- `idx_mart_delivery_areas_code` - 配送范围查询

**订单查询**
- `idx_orders_user_id` - 我的订单
- `idx_orders_province_city` - 按区域统计
- `idx_orders_created_at` - 订单流水

**商品查询**
- `idx_goods_category_id` - 分类浏览
- `idx_goods_mart_id` - Mart商品列表

**交互查询**
- `idx_goods_likes_user_id` - 我的喜欢
- `idx_goods_suggestions_status` - 待处理建议
- `idx_goods_reviews_is_approved` - 已公开评论

---

## 🔐 约束与完整性

### 外键约束

所有关联表通过外键建立关系，使用 `ON DELETE CASCADE` 或 `ON DELETE SET NULL`：

```
users (PK)
  ├── user_sessions (FK, CASCADE)
  ├── user_profiles (FK, CASCADE)
  ├── shipping_addresses (FK, CASCADE)
  ├── marts (FK, SET NULL) - 发起者可删除
  ├── orders (FK, SET NULL) - 用户可删除
  ├── messages (FK, CASCADE)
  └── mart_participations (FK, CASCADE)

marts (PK)
  ├── mart_images (FK, CASCADE)
  ├── goods (FK, CASCADE)
  ├── orders (FK, SET NULL)
  ├── mart_delivery_areas (FK, CASCADE)
  └── (新增) materials, low_stock_alerts, goods_reviews
```

### 唯一约束

- `users.phone` - 手机号唯一
- `orders.order_no` - 订单号唯一
- `goods_likes` - (user_id, goods_id) 复合唯一
- `mart_participations` - (mart_id, user_id) 复合唯一

### Check约束

- `goods_reviews.rating` - 1-5 范围

---

## 📝 数据类型选择

| 字段类型 | PostgreSQL类型 | 用途 |
|---------|---------------|------|
| UUID | UUID | 主键、外键 |
| 金额 | DECIMAL(10,2) | 价格、成本 |
| 数量 | INTEGER | 库存、购买量 |
| 时间 | TIMESTAMPTZ | 时间戳，带时区 |
| 文本 | VARCHAR(n) | 定长字符串 |
| 大文本 | TEXT | 描述、评论内容 |
| JSON | TEXT/JSONB | 材料清单 |
| 坐标 | DECIMAL(10,8) | 地理位置 |

---

## 🔄 数据一致性

### 触发器建议（可选实现）

```sql
-- 库存预警触发器
CREATE TRIGGER trigger_low_stock_alert
AFTER UPDATE ON goods
FOR EACH ROW
WHEN (NEW.repertory <= NEW.low_stock_threshold)
EXECUTE FUNCTION func_create_stock_alert();

-- 订单状态变更触发消息
CREATE TRIGGER trigger_order_status_message
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION func_send_order_message();
```

### 定时任务建议

```sql
-- 清理过期会话（建议每小时执行）
DELETE FROM user_sessions WHERE expires_at < NOW();

-- 自动确认订单（建议每天执行）
UPDATE orders SET status = 'COMPLETED'
WHERE status = 'DELIVERED' 
  AND delivered_at < NOW() - INTERVAL '7 days';
```

---

## 📜 迁移与版本管理

### Prisma 迁移

```bash
# 创建迁移
npx prisma migrate dev --name add_purchase_limit

# 生产环境应用
npx prisma migrate deploy

# 查看迁移历史
ls prisma/migrations/
```

### 备份与恢复

```bash
# 备份
pg_dump -U user -d vanmart -F c -f vanmart_backup.dump

# 恢复
pg_restore -U user -d vanmart -F c vanmart_backup.dump
```

---

## ✅ 验收清单

- [ ] PostgreSQL 已安装（版本 15+）
- [ ] 数据库已创建
- [ ] 所有表已创建
- [ ] 所有索引已创建
- [ ] 外键约束已验证
- [ ] 种子数据已加载
- [ ] Prisma Client 已初始化
- [ ] 连接池已配置
- [ ] 备份策略已实施

---

## 📞 常见问题

**Q: 如何修改表结构？**  
A: 使用 Prisma migrations (`npx prisma migrate dev`)，自动生成迁移文件。

**Q: 如何导出数据？**  
A: 使用 `pg_dump` 或应用层 SQL 查询，生成 CSV/Excel 文件。

**Q: 如何扩展字段？**  
A: 所有 JSON 字段（如 material_cost_items）支持灵活扩展，减少表修改需求。

**Q: 如何处理大数据量？**  
A: 创建相应的索引并使用分区表（PostgreSQL 11+），定时归档旧数据。

---

**最后更新**: 2026年2月13日  
**维护者**: VanMart Database Team
