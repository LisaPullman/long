# VanMart 功能梳理（前端 + 后端）

本文档用于梳理当前仓库已实现的前端页面与后端 API 能力，并对“用户可发起接龙团购、上传图片、创建订单”的业务流程做端到端说明。

## 1. 角色与核心流程

### 1.1 角色

- 团长/发起人：创建接龙团购（Mart），配置主题、商品、库存、截止时间、配送说明、图片等。
- 参团用户/买家：浏览接龙团购商品，选择数量，选择收货地址，创建订单；后续可取消/确认收货。

### 1.2 端到端流程（期望业务）

1. 团长发起接龙团购（创建 Mart，包含图片与商品信息）
2. 买家进入 Mart，选择商品与数量
3. 买家选择收货地址，提交订单
4. 团长截单/结束 Mart，订单进入发货流程
5. 订单状态流转（发货/送达/完成或取消），消息中心查看通知

说明：当前仓库后端已提供 Mart 创建 API，但前端暂未提供“发起接龙团购”的页面；图片“上传”能力也未实现（目前仅支持提交图片 URL）。

## 2. 前端（frontend/）现状

### 2.1 技术栈与运行方式

- Vite + React + React Router
- Tailwind CSS（用于页面样式）
- i18n：i18next + react-i18next（全局中英文切换）
- Docker 运行：由 `frontend/nginx.conf` 将 `/api` 反向代理到后端

### 2.2 路由与页面

入口：`frontend/src/App.tsx`

- `/` 首页（HomePage）
  - 入口按钮：创建订单、我的订单、消息中心
  - 语言切换按钮（全局）
- `/orders/create?martId=...` 订单创建页（OrderCreate）
  - 加载 Mart（含商品列表）与用户地址
  - 选择商品数量、填写备注、提交订单
- `/orders` 订单列表页（OrderList）
  - 状态筛选、分页、点击进入详情
- `/orders/:id` 订单详情页（OrderDetail）
  - 展示订单信息
  - 支持“取消订单”（CREATED）与“确认收货”（DELIVERED）
- `/messages` 消息中心（MessageCenter）
  - 消息类型筛选、查看详情、批量已读

### 2.3 前端调用的 API（services）

见：`frontend/src/services/api.ts`

- `martsApi.getById(martId)`：订单创建页依赖 Mart 数据（商品/图片）
- `usersApi.getAddresses(userId)`：订单创建页依赖地址数据
- `ordersApi.create(...)`：创建订单
- `ordersApi.list(...)` / `ordersApi.getById(orderId)` / `ordersApi.updateStatus(...)`：订单列表/详情/状态更新
- `messagesApi.list(...)` / `messagesApi.markRead(...)` / `messagesApi.markAllRead(...)`：消息中心

### 2.4 未实现/缺口（与目标业务对照）

- 缺少“发起接龙团购（创建 Mart）”页面：
  - 目前前端只有“创建订单”，没有“创建 Mart / 管理 Mart / 上架商品”等 UI。
- 缺少“图片上传”能力：
  - 前端没有选择文件并上传的组件与流程。
  - 现有后端 Mart/商品的图片字段为 `imageUrl`，只能提交 URL。

## 3. 后端（backend/）现状

### 3.1 技术栈

- Node.js + Express
- Prisma + PostgreSQL
- Docker Compose：`postgres` + `backend` + `frontend(nginx)`

服务入口：

- `backend/src/index.ts` 启动服务
- `backend/src/app.ts` 注册路由（`/api/*`）

### 3.2 API 路由总览

以 `backend/src/app.ts` 为准：

- `/api/marts`：接龙团购（Mart）
- `/api/goods`：商品
- `/api/orders`：订单
- `/api/messages`：消息中心
- `/api/users`：用户与收货地址
- `/api/stats`：统计

#### 3.2.1 Mart（接龙团购）

代码：`backend/src/routes/marts.ts`

- `GET /api/marts`
  - 查询 Mart 列表（支持 `status`、`userId`、分页）
  - 返回：`{ data, pagination }`
- `GET /api/marts/:id`
  - 获取 Mart 详情（包含图片、商品、配送区域、团长信息、计数）
  - 额外行为：浏览数 `browseCount` 自增
- `POST /api/marts`
  - 创建 Mart（支持批量创建图片、配送区域、商品与商品图片）
  - 注意：`images` 结构为 `{ imageUrl }`，并非文件上传
- `PUT /api/marts/:id`
  - 更新 Mart（直接透传 `updateData`，未做字段白名单）
- `POST /api/marts/:id/close`
  - 截单（将 Mart 状态置为 `CLOSED`）
- `POST /api/marts/:id/end`
  - 结束（将 Mart 状态置为 `ENDED`）
  - 额外行为：把该 Mart 下所有 `CREATED` 订单更新为 `PENDING_SHIPMENT`

#### 3.2.2 Orders（订单）

代码：`backend/src/routes/orders.ts`

- `POST /api/orders`
  - 创建订单（强校验：`martId/userId/收货信息/items` 必填）
  - 校验：
    - Mart 必须存在且 `status=OPEN`
    - 截止时间（`setFinishTime/finishTime`）
    - 库存/限购
  - 事务相关行为：
    - 创建订单与订单项
    - 扣减库存与增加销量
    - 创建/更新参团记录（`MartParticipation`）
- `GET /api/orders/:id` 订单详情
- `GET /api/orders` 订单列表（分页 + 多条件筛选）
- `PATCH /api/orders/:id/status` 更新订单状态
  - 状态机校验（限定转换路径）
  - 发货/送达/完成/取消等时间字段写入
  - 取消时恢复库存、回滚销量
  - 写入物流跟踪记录（`OrderDeliveryTrack`）

#### 3.2.3 Messages（消息）

代码：`backend/src/routes/messages.ts`

- `POST /api/messages` 发送消息
- `GET /api/messages` 获取消息列表（分页 + `type/isRead`）
- `PATCH /api/messages/:id/read` 标记已读
- `POST /api/messages/read-all` 批量已读
- `DELETE /api/messages/:id` 删除消息

#### 3.2.4 Users（用户与地址）

代码：`backend/src/routes/users.ts`

- `POST /api/users/register` 注册
- `POST /api/users/login` 登录（当前返回用户信息，未签发 JWT）
- `GET /api/users/:id` 获取用户信息（含地址与计数）
- `PUT /api/users/:id` 更新用户信息（nickname/avatarUrl）
- 地址：
  - `GET /api/users/:id/addresses`
  - `POST /api/users/:id/addresses`
  - `PUT /api/users/:id/addresses/:addressId`
  - `DELETE /api/users/:id/addresses/:addressId`

#### 3.2.5 Goods（商品）

代码：`backend/src/routes/goods.ts`

- `GET /api/goods` 商品列表（非分页，支持条件查询）
- `GET /api/goods/:id` 商品详情
- `POST /api/goods` 创建商品（支持图片 `images: [{ imageUrl }]`）
- `PUT /api/goods/:id` 更新商品
- `DELETE /api/goods/:id` 删除商品
- 点赞：
  - `POST /api/goods/:id/like`
  - `DELETE /api/goods/:id/like`

#### 3.2.6 Stats（统计）

代码：`backend/src/routes/stats.ts`

- `GET /api/stats/mart/:id/summary`
  - Mart 维度统计（订单/金额/利润/商品汇总/地区汇总/状态汇总）
- `GET /api/stats/user/orders?userId=...`
  - 用户维度统计（按状态、总计、最近订单、参与 Mart 数）

### 3.3 “图片上传”能力现状与建议方案

现状：

- 当前后端没有 `multipart/form-data` 上传接口（未集成 multer / S3 / OSS 等）。
- Mart 与 Goods 的图片模型均是 `imageUrl`（字符串 URL），创建 Mart/商品时以 JSON 传入 URL 即可。

要实现“用户上传图片”的两种常见方案：

1. 由后端提供上传接口（最简单的 MVP）
   - `POST /api/uploads`（multipart/form-data）
   - 保存到本地卷或对象存储
   - 返回 `{ url }`，前端再把 URL 写入 Mart/Goods 创建 payload
2. 走对象存储直传（更标准）
   - 后端提供 `POST /api/uploads/presign` 返回预签名 URL
   - 前端直传文件到对象存储
   - 再提交 Mart/Goods 创建时携带最终 URL

## 4. “发起接龙团购 + 上传图片 + 下单”交互建议（前端待补齐）

为了匹配目标业务，建议前端补充以下页面/能力：

- Mart 发起页（团长）
  - 基本信息：主题、描述、截止时间、配送说明
  - 图片：本地选择 + 上传（得到 URL）
  - 商品：添加商品、价格/库存/限购、商品图片上传（得到 URL）
  - 提交：调用 `POST /api/marts`
- Mart 列表/详情页（买家）
  - 展示 Mart 图片与商品
  - 进入“创建订单”页（目前仅支持通过 query 传 martId）

## 5. 本地运行与验收（Docker Compose）

默认端口（见 `docker-compose.yml`）：

- 前端：`http://localhost:8080`
- 后端：`http://localhost:3001/api`
- 数据库：`localhost:5432`

前端通过 Nginx 反代：

- `http://localhost:8080/api/*` -> `http://backend:3001/*`

