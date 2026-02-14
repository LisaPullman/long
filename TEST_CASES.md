# VanMart MVP 验收测试用例

## 1. 订单模块

### 1.1 创建订单 (POST /api/orders)

| 用例ID | 场景 | 前置条件 | 输入 | 预期结果 |
|--------|------|----------|------|----------|
| ORD-001 | 正常创建订单 | Mart状态为OPEN，商品有库存 | 完整订单信息 | 返回201，订单创建成功 |
| ORD-002 | Mart不存在 | Mart ID无效 | martId: invalid | 返回404，"接龙活动不存在" |
| ORD-003 | Mart已结束 | Mart状态为ENDED | martId: ended_mart | 返回400，"接龙活动已结束或关闭" |
| ORD-004 | Mart已截单 | setFinishTime=true且已过期 | 过期martId | 返回400，"接龙活动已截止" |
| ORD-005 | 商品库存不足 | 商品repertory=5 | quantity=10 | 返回400，"商品xxx库存不足" |
| ORD-006 | 商品限购 | purchaseLimit=2, 已购1件 | quantity=2 | 返回400，"商品xxx限购2件，您已购1件" |
| ORD-007 | 缺少必填字段 | - | 缺少receiverName | 返回400，"缺少必填字段" |

### 1.2 获取订单详情 (GET /api/orders/:id)

| 用例ID | 场景 | 前置条件 | 输入 | 预期结果 |
|--------|------|----------|------|----------|
| ORD-101 | 正常获取 | 订单存在 | orderId: valid | 返回200，包含订单完整信息 |
| ORD-102 | 订单不存在 | - | orderId: invalid | 返回404，"订单不存在" |

### 1.3 更新订单状态 (PATCH /api/orders/:id/status)

| 用例ID | 场景 | 前置条件 | 输入 | 预期结果 |
|--------|------|----------|------|----------|
| ORD-201 | 正常发货 | 订单状态PENDING_SHIPMENT | status: SHIPPED | 返回200，shippedAt已设置 |
| ORD-202 | 正常送达 | 订单状态SHIPPED | status: DELIVERED | 返回200，deliveredAt已设置 |
| ORD-203 | 确认收货 | 订单状态DELIVERED | status: COMPLETED | 返回200，completedAt已设置 |
| ORD-204 | 取消订单-CREATED | 订单状态CREATED | status: CANCELED | 返回200，库存已恢复 |
| ORD-205 | 取消订单-SHIPPED | 订单状态SHIPPED | status: CANCELED | 返回200，库存已恢复 |
| ORD-206 | 无效状态转换 | 订单状态COMPLETED | status: CANCELED | 返回400，"不能从COMPLETED转换到CANCELED" |
| ORD-207 | 无效状态值 | - | status: INVALID | 返回400，"无效的订单状态" |

### 1.4 获取订单列表 (GET /api/orders)

| 用例ID | 场景 | 输入 | 预期结果 |
|--------|------|------|----------|
| ORD-301 | 分页查询 | page=1, pageSize=10 | 返回data数组和pagination |
| ORD-302 | 按Mart筛选 | martId: xxx | 只返回该Mart的订单 |
| ORD-303 | 按用户筛选 | userId: xxx | 只返回该用户的订单 |
| ORD-304 | 按状态筛选 | status: SHIPPED | 只返回已发货订单 |
| ORD-305 | 订单号搜索 | orderNo: VM24 | 返回匹配的订单 |

## 2. 消息模块

### 2.1 发送消息 (POST /api/messages)

| 用例ID | 场景 | 输入 | 预期结果 |
|--------|------|------|----------|
| MSG-001 | 正常发送 | userId, title, content | 返回201，消息创建成功 |
| MSG-002 | 缺少必填字段 | 只有title | 返回400，"缺少必填字段" |

### 2.2 获取消息列表 (GET /api/messages)

| 用例ID | 场景 | 输入 | 预期结果 |
|--------|------|------|----------|
| MSG-101 | 正常获取 | userId: xxx | 返回data数组和unreadCount |
| MSG-102 | 按类型筛选 | type: system | 只返回系统消息 |
| MSG-103 | 按已读状态筛选 | isRead: false | 只返回未读消息 |
| MSG-104 | 缺少userId | 无userId | 返回400，"userId是必填参数" |

## 3. 统计模块

### 3.1 Mart统计摘要 (GET /api/stats/mart/:id/summary)

| 用例ID | 场景 | 前置条件 | 预期结果 |
|--------|------|----------|----------|
| STA-001 | 正常获取 | Mart存在且有订单 | 返回mart、orders、goods、regions统计 |
| STA-002 | Mart不存在 | - | 返回404，"接龙活动不存在" |
| STA-003 | 无订单 | Mart存在但无订单 | orders统计为0 |

### 3.2 用户订单统计 (GET /api/stats/user/orders)

| 用例ID | 场景 | 输入 | 预期结果 |
|--------|------|------|----------|
| STA-101 | 正常获取 | userId: xxx | 返回total、byStatus、recentOrders |
| STA-102 | 缺少userId | 无userId | 返回400，"userId是必填参数" |

## 4. 前端页面

### 4.1 订单列表页 (OrderList.tsx)

| 用例ID | 场景 | 操作 | 预期结果 |
|--------|------|------|----------|
| UI-001 | 加载订单列表 | 进入页面 | 显示订单列表 |
| UI-002 | 状态筛选 | 点击"待发货" | 只显示待发货订单 |
| UI-003 | 分页 | 点击"下一页" | 加载下一页数据 |
| UI-004 | 查看详情 | 点击订单 | 跳转到订单详情页 |

### 4.2 订单详情页 (OrderDetail.tsx)

| 用例ID | 场景 | 操作 | 预期结果 |
|--------|------|------|----------|
| UI-101 | 显示详情 | 进入页面 | 显示订单完整信息 |
| UI-102 | 取消订单 | 点击"取消订单" | 弹出确认，成功后状态变为CANCELED |
| UI-103 | 确认收货 | 点击"确认收货" | 状态变为COMPLETED |

### 4.3 订单创建页 (OrderCreate.tsx)

| 用例ID | 场景 | 操作 | 预期结果 |
|--------|------|------|----------|
| UI-201 | 显示商品 | 进入页面 | 显示Mart商品列表 |
| UI-202 | 选择数量 | 点击+/- | 数量增减，计算总价 |
| UI-203 | 选择地址 | 点击地址区域 | 显示地址选择弹窗 |
| UI-204 | 提交订单 | 点击"提交订单" | 创建成功跳转详情页 |
| UI-205 | 库存限制 | 点击+超过库存 | 按钮禁用，数量不变 |

### 4.4 消息中心 (MessageCenter.tsx)

| 用例ID | 场景 | 操作 | 预期结果 |
|--------|------|------|----------|
| UI-301 | 显示消息列表 | 进入页面 | 显示消息列表和未读数 |
| UI-302 | 查看详情 | 点击消息 | 显示消息详情，标记已读 |
| UI-303 | 全部已读 | 点击"全部已读" | 所有消息变为已读 |
| UI-304 | 类型筛选 | 点击"订单消息" | 只显示订单消息 |

## 5. 集成测试场景

### 5.1 完整下单流程

1. 用户进入Mart详情页
2. 选择商品，调整数量
3. 选择/填写收货地址
4. 提交订单
5. 查看订单详情
6. 确认收货

### 5.2 库存扣减与恢复

1. 检查商品当前库存
2. 创建订单，验证库存扣减
3. 取消订单，验证库存恢复

### 5.3 状态流转

1. CREATED -> PENDING_SHIPMENT (Mart截单)
2. PENDING_SHIPMENT -> SHIPPED (发货)
3. SHIPPED -> DELIVERED (送达)
4. DELIVERED -> COMPLETED (确认收货)

## 6. 性能基准

| 指标 | 目标 | 说明 |
|------|------|------|
| API响应时间 | < 200ms | P95延迟 |
| 订单列表加载 | < 500ms | 20条记录 |
| 订单创建 | < 300ms | 含库存校验 |
| 并发订单 | 100 QPS | 无错误 |
