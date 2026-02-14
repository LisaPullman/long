# VanMart (Jielong) 重写需求文档 (Vite + React, Mobile Web, PWA, PostgreSQL)

## 0. 文档定位

本 `requirements.md` 用于指导 AI/工程师从零开发一个"接龙团购/社区团购"移动端 Web 应用，不依赖微信小程序框架，不使用任何 `wx.*` API。

文档目标是可执行与可验收：

- 覆盖业务全流程(预售 -> 截单 -> 汇总 -> 分拣 -> 配送履约 -> 确认收货 -> 导出/复盘)。
- 梳理模块职责与页面路由。
- 给出必须落地的数据模型、接口契约、状态机、边界条件、验收用例。
- 给出技术与部署要求(Vite + React + PWA + PostgreSQL 全栈方案)。

## 0.1 新增功能清单(优化后)

基于接龙.md"其他功能"部分，requirements.md已扩展以下需求：

| 功能 | 实现范围 | 数据库表 | API端点 | 验收用例 |
|------|---------|--------|--------|--------|
| **库存提醒** | 商品库存不足时通知管理员 | `low_stock_alerts`, `goods` | `/api/inventory/alerts` | 12用例 |
| **成本计算** | 材料成本录入、自动计算、利润分析 | `materials`, `goods`, `order_items` | `/api/cost/*` | 14用例 |
| **商品限购** | 每个客户限购X件，下单时校验 | `goods.purchase_limit`, `order_items` | `/api/orders` | 11用例 |
| **评论与建议** | 商品喜欢、改进建议、评论审核 | `goods_likes`, `goods_suggestions`, `goods_reviews` | `/api/goods/interactions` | 12,15用例 |
| **数据导出** | 订单明细、分拣单、商品汇总、配送清单 Excel | `orders`, `order_items`, `goods` | `/api/export` | 9,16用例 |

新增表总数：`6` 张 (materials, low_stock_alerts, goods_likes, goods_suggestions, goods_reviews, 及Mart/Order/Goods的字段扩展)  
新增API模块：`6` 个 (商品互动、成本管理、库存预警、订单导出、统计扩展)  
数据库设计满足度：**100%** (所有新增需求均有对应的表/字段支持)

## 1. 项目背景(现状)

当前仓库是原生微信小程序工程(目录结构 `app.js/app.json/pages/*`)。

已实现核心能力(legacy)：

- Mart(接龙活动)：发布、列表分页、详情、浏览数、参与记录、结束。
- 商品：单商品/多商品，分类、规格、价格、库存；单商品支持最小成团数量。
- 订单：下单、(部分)取消、导出订单。
- 消息：系统通知列表、未读提示。
- 个人中心：我发起/我参与、个人资料、帮助中心。

## 2. 目标与非目标

### 2.1 目标

- 重写为 **Vite + React + TypeScript** 的移动端 Web 应用 + **PostgreSQL 全栈后端**。
- 支持 **PWA**(使用 `vite-plugin-pwa`)：
  - 可安装(standalone)。
  - 可离线打开应用壳。
  - 有更新提示策略。
- 使用 **PostgreSQL** 作为数据持久化层：
  - 完整的数据库 Schema 设计。
  - 支持 ACID 事务。
  - 数据迁移与版本管理。
- 支持容器化部署 (Docker + Docker Compose)。
- **配送模式**：所有商品统一配送至用户收货地址，取消自提点逻辑。
- 业务闭环：
  - 浏览 Mart -> 下单(填写收货地址) -> 发起者统计 -> 发货配送 -> 用户确认收货 -> 导出。

### 2.2 非目标(本期不做，除非后续单开)

- 完整支付闭环与退款(若后端已有则可接入；否则先按无支付/线下支付模式)。
- 完整供应链系统(WMS/TMS)、多仓多供、多城市多价。
- 复杂分佣裂变与分销体系(本期只保留可分享链接，不做分佣结算)。
- 实时配送追踪(本期仅支持配送状态更新)。

## 3. 术语表

- Mart / 接龙：一次团购活动(主题、描述、商品、截止时间、配送范围等)。
- 截单：到达截止时间后禁止新增订单/改量(规则可配置，但默认禁止)。
- 收货地址：用户的配送地址，包含省市区、详细地址、联系人、联系电话。
- 配送范围：Mart 可配送的区域(省/市/区级别)。
- 发货：发起者将商品交付给配送方。
- 确认收货：用户确认已收到商品。
- 发起者：创建 Mart 的用户。
- 参与者：下单用户。

## 4. 业务全流程(行业通用基线)

该产品的核心不是"单笔电商下单"，而是"按时间节点汇总订单后履约"。

标准流程(本项目采用)：

1. 发起者发布 Mart(预售/接龙开始)，设置配送范围和配送说明。
2. 参与者在截止前下单并填写收货地址。
3. 截单：
  - 停止下单/改量。
  - 生成汇总统计(按商品、按区域)。
4. 采购/备货/分拣(系统本期仅提供统计与导出，不实现仓储流程)。
5. 发货配送：
  - 发起者按区域/订单分批发货。
  - 更新订单配送状态。
  - 用户可查看配送进度。
6. 确认收货：
  - 用户收到商品后确认收货。
  - 支持自动确认(发货N天后)。
7. 导出与复盘：
  - 导出订单/统计表。
  - 按区域/商品维度统计配送情况。

## 5. 角色与权限

### 5.1 角色

- 访客(Anonymous)：未登录用户。
- 登录用户(User)：可下单、查看我的订单、维护收货地址、个人资料。
- 发起者(Organizer)：可发布 Mart、结束 Mart、查看统计、发货管理、导出。
- 管理员(Admin，可选)：跨用户跨 Mart 管理(本期可不实现后台，仅预留角色字段)。

### 5.2 权限规则

- 所有写操作必须登录。
- Mart 管理操作(结束/统计/发货/导出)仅发起者可执行。
- 访客浏览权限(默认)：
  - 允许浏览列表/详情。
  - 下单与个人中心需要登录。

## 6. 状态机与业务规则(必须落地为代码约束)

### 6.1 Mart 状态机

Web 端内部统一用以下状态(不强依赖后端字段命名，需做适配)：

- `OPEN`：可下单。
- `CLOSED`：已截单(默认禁止下单)。
- `ENDED`：活动结束(禁止下单；管理视图仍可进入)。

规则：

- 若 `setFinishTime=1` 且 `finishTime` 已过，则前端视为 `CLOSED`。
- 若后端返回 `status` 表示结束，则视为 `ENDED`。
- 发起者可主动结束 Mart。

### 6.2 订单状态机(配送模式)

```
CREATED → PENDING_SHIPMENT → SHIPPED → DELIVERED → COMPLETED
    ↓           ↓               ↓           ↓
CANCELED    CANCELED        CANCELED   CANCELED
```

状态说明：

- `CREATED`：下单成功，待处理。
- `PENDING_SHIPMENT`：待发货(截单后进入此状态)。
- `SHIPPED`：已发货，配送中。
- `DELIVERED`：已送达，待确认收货。
- `COMPLETED`：已完成(用户确认收货或自动确认)。
- `CANCELED`：已取消。

状态流转规则：

- 下单成功 → `CREATED`
- Mart 截单 → 所有未取消订单 → `PENDING_SHIPMENT`
- 发起者发货 → `SHIPPED`
- 配送完成 → `DELIVERED`
- 用户确认收货/自动确认(发货7天后) → `COMPLETED`
- 任意非终态 → 可取消 → `CANCELED`

### 6.3 下单校验

提交订单前必须校验：

- Mart 未结束且允许下单(OPEN)。
- 每个商品购买量 `qty <= repertory`。
- **商品限购校验**：如果商品设置了 `purchaseLimit`，需校验：
  - 当前用户在该Mart中购买该商品的数量 + 本次购买量 <= `purchaseLimit`。
  - 超限时提示：`"该商品每位客户限购X件，您已购X件"`。
- 必须填写收货地址(省市区、详细地址)。
- 必须填写收货人姓名与手机号。
- 校验收货地址是否在 Mart 配送范围内(若设置了配送范围)。
- 姓名与手机号合法(手机号规则可配置)。

并发与最终一致性：

- 前端仅做预校验。
- 以"后端最终校验"结果为准，失败时展示明确原因并回滚 UI。

### 6.4 库存预警规则(新增)

- 每个商品可设置预警阈值 `lowStockThreshold`。
- 库存 <= 阈值时，系统自动生成 `LowStockAlert` 记录。
- 发起者看到库存预警消息通知，可标记为已处理。
- 预警消息类型为 `inventory_alert`，关联商品 ID。

### 6.5 成团规则(沿用 legacy 最小规则)

- 单商品模式：可设置最小成团数量 `groupSum`，并要求设置截止时间。
- 多商品模式：不支持成团(所有商品 `isSetGroup=0`)。

### 6.6 图片上传规则

- Mart 介绍图最多 9 张。
- 每个商品图片最多 9 张。
- 发布前必须通过上传守卫：
  - 不允许存在上传中项。
  - 不允许存在上传失败项(必须删除或重试成功)。

### 6.6 配送规则

- Mart 可设置配送范围(省/市/区级别，可多选)。
- 若未设置配送范围，则全国可配送。
- 发起者可设置配送说明(如配送时效、配送方式等)。
- 发起者可设置发货时间(截单后多久发货)。
- 支持自动确认收货时间配置(默认7天)。

### 6.7 收货地址规则

- 用户可管理多个收货地址。
- 每个地址必须包含：收货人姓名、手机号、省、市、区、详细地址。
- 可设置默认收货地址。
- 下单时可选择已有地址或新建地址。

## 7. 模块划分与职责(必须拆清)

- `auth`：
  - 登录、会话持久化、退出。
  - 401/会话失效统一处理。
- `api`：
  - 基础请求封装(baseURL、超时、错误解析、header 注入、重试策略)。
  - 支持取消请求(页面切换时)。
- `user`：
  - 个人资料读取/更新。
  - 手机号校验规则与提示语配置。
- `mart`：
  - 列表分页、详情、发布、结束、分享链接生成。
- `order`：
  - 下单、我的订单、取消、确认收货。
  - 发货管理、配送状态更新、导出。
- `address`：
  - 收货地址 CRUD、默认地址设置。
  - 地址格式校验、配送范围校验。
- `delivery`：
  - 配送范围管理。
  - 配送状态追踪。
- `messages`：
  - 消息列表、详情、已读更新、未读角标。
- `help`：
  - FAQ 列表与详情。
- `stats`：
  - 汇总统计(时间区间过滤、区域维度)。
  - 商品维度统计详情。
  - 配送统计(按区域/状态)。
- `upload`：
  - OSS policy 获取。
  - 多文件上传、进度、失败重试。
- `pwa`：
  - SW 注册、更新提示、离线策略。

## 8. 页面与路由(移动端)

建议路由(可调整，但必须覆盖能力)：

- `/`：首页(Mart 列表)
- `/mart/:id`：Mart 详情
- `/mart/new`：发布 Mart
- `/order/confirm`：订单确认(草稿)
- `/order/:id`：订单详情
- `/messages`：消息中心
- `/messages/:id`：消息详情
- `/me`：我的
- `/me/marts`：我发起的
- `/me/orders`：我参与的
- `/me/profile`：个人资料
- `/me/addresses`：收货地址管理
- `/me/addresses/new`：新增收货地址
- `/me/addresses/:id/edit`：编辑收货地址
- `/help`：帮助中心
- `/mart/:id/stats`：统计
- `/mart/:id/shipping`：发货管理
- `/mart/:id/delivery`：配送管理

页面必须具备的 UI 状态：

- `loading`：首屏/请求中。
- `empty`：无数据。
- `error`：网络或业务错误。
- `content`：正常展示。

## 9. 功能需求(按模块细化)

### 9.1 登录与会话(Auth)

需求：

- 支持 Web 登录并获取 `sessionId/userId`，持久化到 `localStorage`。
- API 请求自动携带认证 Token。
- 会话失效：
  - 清理 session。
  - 导航到登录页或弹窗提示重新登录。
- 退出登录：清 session 并回到首页。

### 9.2 首页(Mart 列表)

需求：

- 轮播图展示。
- Mart 列表分页/无限滚动。
- 支持下拉刷新(移动端交互等价)。
- 显示未读消息提示(角标/红点)。
- 每个 Mart 卡片至少展示：
  - 主题、创建时间、参与人数、状态(进行中/截单/结束)。
  - 配送说明(如有)。

### 9.3 Mart 详情

需求：

- 进入详情更新浏览量。
- 拉取详情。
- 展示：
  - 主题、描述、图片列表、商品列表、参与统计。
  - 配送范围说明、配送时效。
- 商品购买量加减：
  - 不可小于 0。
  - 可选上限为库存(超出时提示)。
- 选择收货地址：
  - 从用户地址列表选择。
  - 可新增地址。
  - 校验地址是否在配送范围内。
- 展示参与记录。
- 分享：
  - 生成可复制链接(带 Mart id)。
  - 支持 Web Share API(可选)。
- 若 Mart 已结束：
  - 参与者：提示并禁用下单。
  - 发起者：仍可进入统计/发货管理。

### 9.4 订单确认与下单

需求：

- 接收"订单草稿"(来自详情页)：
  - `martId`、商品列表与数量、收货地址、总价、是否成团等。
- 选择/新增收货地址。
- 展示配送信息：
  - 预计发货时间。
  - 配送方式说明。
- 提交订单前必须做预校验：
  - 姓名、手机号。
  - 收货地址是否填写完整。
  - 收货地址是否在配送范围内。
  - 再拉一次 Mart 详情校验库存与状态。
- 下单成功后：
  - toast 提示。
  - 回到 Mart 详情或"我参与的"。

### 9.5 发布 Mart

需求：

- 基础字段：
  - `topic`(必填)。
  - `description`(必填，字数上限 300)。
- 截止时间：
  - `setFinishTime` 开关。
  - 开启后必须填写 `finishTime`。
  - 若成团(单商品 `isSetGroup=1`)则必须开启截止时间。
- 配送设置：
  - 配送范围(可选，默认全国可配)：
    - 支持按省/市/区选择配送区域。
    - 多选模式。
  - 配送说明(可选)：
    - 配送时效说明。
    - 配送方式说明(快递/同城配送等)。
  - 预计发货时间(可选)：
    - 截单后多久发货(天数)。
  - 自动确认收货时间(默认7天)。
- 商品：
  - 支持 1..N。
  - 每个商品必填：名称、分类、规格、价格、库存、图片。
  - 分类数据来自商品分类接口。
  - 价格必须是正数，最多 2 位小数。
  - 库存必须是正整数。
- 图片上传：
  - 先获取 OSS policy。
  - 上传到 OSS。
  - 展示进度与失败状态。
  - 发布前上传守卫。
- 发布成功后进入新建 Mart 详情。

### 9.6 我的一(Me)

需求：

- 展示用户头像昵称(如有)。
- 入口：
  - 我发起的。
  - 我参与的。
  - 个人资料。
  - 收货地址管理。
  - 帮助中心。
- 数据统计(可选但建议)：
  - 我发起的数量。
  - 我参与的数量。

### 9.7 我发起的

需求：

- 列表展示我创建的 Mart。
- 显示每个 Mart 的状态、订单数、商品数。
- 点击进入详情(以发起者身份)。
- 快捷入口：统计、发货管理。

### 9.8 我参与的

需求：

- 列表展示我的订单。
- 显示订单状态、Mart 主题、下单时间、金额。
- 订单状态标签：待发货、配送中、已送达、已完成、已取消。
- 查看订单详情：
  - 商品列表、收货地址、配送信息。
  - 配送状态追踪。
- 确认收货按钮(已送达状态)。
- 支持取消订单(待发货状态)。

### 9.9 收货地址管理

需求：

- 列表展示用户所有收货地址。
- 新增地址：
  - 收货人姓名、手机号。
  - 省市区选择(级联选择器)。
  - 详细地址。
  - 可选：地址标签(家/公司/其他)。
  - 设置为默认地址。
- 编辑地址。
- 删除地址。
- 设置默认地址。
- 下单时快速选择地址。

### 9.10 订单详情

需求：

- 展示订单基本信息：
  - 订单号、下单时间、订单状态。
- 展示商品列表：
  - 商品名称、规格、价格、数量、小计。
- 展示收货信息：
  - 收货人、手机号、完整地址。
- 展示配送信息：
  - 配送状态时间线。
  - 预计送达时间(已发货)。
- 操作按钮：
  - 取消订单(待发货)。
  - 确认收货(已送达)。
  - 再次购买。

### 9.11 消息中心

需求：

- 消息列表。
- 消息类型：系统通知、订单通知、发货通知。
- 未读/已读展示。
- 进入详情后更新已读。
- 首页与 Tab 区域展示未读角标/红点。

### 9.12 帮助中心

需求：

- FAQ 列表。
- FAQ 详情展示(可做成一页内展开或路由详情)。

### 9.13 统计(发起者)

需求：

- 汇总统计：
  - 总订单数、总金额、参与人数。
  - 按商品维度统计：销量、金额。
  - 按区域维度统计：订单分布(省/市)。
- 支持时间区间过滤。
- 支持按配送状态筛选订单。

### 9.14 商品喜欢与建议(新增)

需求：

- 商品喜欢功能：
  - 商品详情页显示"喜欢"按钮，点击切换状态。
  - 显示"XX人喜欢该商品"。
  - 记录用户喜欢的商品列表。
  - 用户中心可查看"我的喜欢"列表。
- 建议功能：
  - 用户购买商品后（订单已完成）可提交改进建议。
  - 建议类型示例：甜度、口感、软硬度、包装等。
  - 建议内容最多500字。
  - 发起者可在后台查看建议并标记为已处理。
- 评论与评分：
  - 用户购买后可对商品/店铺进行评分(1-5星)与评论。
  - 评论发起者审核后公显。
  - 支持管理员删除不当评论。

### 9.15 库存提醒(新增)

需求：

- 商品库存预警：
  - 每个商品可设置库存预警阈值(如≤10件提醒)。
  - 商品库存低于阈值时，系统发送消息通知店主。
  - 店主可到商品编辑页查看和更新库存。
- 消息通知：
  - 新增库存预警类型消息。
  - 消息中心显示预警列表。

### 9.16 成本计算功能(新增，管理员可见)

需求：

- 材料成本管理(仅主管理员)：
  - 后台可录入各种材料单价(如奶油、面粉等)。
  - 支持批量导入材料。
- 商品成本计算(发布/编辑商品)：
  - 输入材料成分及使用克重。
  - 系统自动计算原料成本。
  - 发起者可输入其他成本(如人工、包装等)。
  - 显示总成本与利润率。
  - 成本计算结果仅发起者/管理员可见。
- 成本报表：
  - 按商品维度统计成本与毛利。
  - 按Mart维度统计整体成本与利润。

### 9.17 商品限购功能(新增)

需求：

- 发布Mart时可为商品设置限购数量：
  - 每个客户最多购买X件。
  - 下单时校验购买数量是否超限。
  - 超限时提示"该商品每位客户限购X件，您已购X件"。
- 修改现有Mart的商品限购设置。

### 9.18 数据导出功能详细设计(新增)

需求：

- 导出接龙订单数据(Excel 格式)：
  - 字段：接龙号、接龙主题、客户名称、手机号、商品名称、数量、商品单价、商品金额、订单总金额、用户备注、店主备注、取货方式(自提/配送)、省市区、详细地址、订单状态、下单时间、发货时间。
  - 支持按状态/区域/时间段筛选导出。
  - 支持自定义导出字段。

- 导出商品分拣表(Excel 格式)：
  - 字段：楼层号(或区域编号)、客户名称、联系电话、商品名称、订单数量、备注。
  - 至少预留25行空白行用于手动填写。
  - 支持按区域分页导出。

- 导出汇总统计表：
  - 按商品维度统计：商品名称、规格、总销量、总金额、平均单价。
  - 按区域维度统计：区域、订单数、总金额、人数。
  - 按配送状态统计：状态、订单数、人数。

### 9.19 发货管理(发起者)

需求：

- 订单列表(按状态筛选)：
  - 待发货、已发货、已送达、已完成。
- 批量发货：
  - 勾选订单。
  - 填写物流信息(物流公司、物流单号)。
  - 支持批量操作。
- 按区域分组展示订单，便于分拣配送。
- 导出订单数据(Excel 格式)：
  - 导出订单明细。
  - 导出商品汇总。
  - 导出配送清单(含收货地址)。
  - 导出分拣单。
- 订单搜索(按收货人/手机号/订单号)。

### 9.20 配送追踪

需求：

- 发起者视角：
  - 查看各区域配送进度。
  - 配送异常处理。
- 用户视角：
  - 查看订单配送状态。
  - 配送状态时间线：
    - 已下单 → 待发货 → 配送中 → 已送达 → 已完成。

## 10. PostgreSQL 数据库设计(必须)

### 10.1 数据库选型

- **数据库**: PostgreSQL 15+
- **ORM**: Prisma (推荐) 或 TypeORM
- **迁移工具**: Prisma Migrate
- **连接池**: pg-pool (生产环境必须)

### 10.2 核心 Schema 设计

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 用户相关表
-- ============================================

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE,
  nickname VARCHAR(100),
  avatar_url TEXT,
  password_hash VARCHAR(255), -- 密码哈希(可选，支持账号密码登录)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户详情表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  real_name VARCHAR(50),
  id_card VARCHAR(20), -- 身份证(可选，用于实名认证)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户会话表 (用于 JWT 刷新令牌管理)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info VARCHAR(500),
  ip_address VARCHAR(45),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 收货地址相关表
-- ============================================

-- 收货地址表
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_name VARCHAR(50) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  province VARCHAR(50) NOT NULL,
  province_code VARCHAR(10),
  city VARCHAR(50) NOT NULL,
  city_code VARCHAR(10),
  district VARCHAR(50) NOT NULL,
  district_code VARCHAR(10),
  detail_address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  tag VARCHAR(20), -- 标签: 家/公司/其他
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Mart (接龙活动) 相关表
-- ============================================

-- Mart 主表
CREATE TABLE marts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  topic VARCHAR(500) NOT NULL,
  description TEXT,
  set_finish_time BOOLEAN DEFAULT FALSE,
  finish_time TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CLOSED, ENDED
  browse_count INTEGER DEFAULT 0,
  is_single_product BOOLEAN DEFAULT FALSE,
  group_sum INTEGER, -- 最小成团数量
  -- 配送相关字段
  delivery_description TEXT, -- 配送说明
  expected_ship_days INTEGER DEFAULT 3, -- 截单后预计发货天数
  auto_confirm_days INTEGER DEFAULT 7, -- 自动确认收货天数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mart 图片表
CREATE TABLE mart_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mart 配送范围表
CREATE TABLE mart_delivery_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  province VARCHAR(50),
  province_code VARCHAR(10),
  city VARCHAR(50),
  city_code VARCHAR(10),
  district VARCHAR(50),
  district_code VARCHAR(10),
  level VARCHAR(20) NOT NULL, -- province/city/district
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 商品相关表
-- ============================================

-- 商品分类表
CREATE TABLE goods_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 商品表
CREATE TABLE goods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES goods_categories(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  specification VARCHAR(200),
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2), -- 原价(用于划线价)
  repertory INTEGER NOT NULL DEFAULT 0,
  sold_count INTEGER DEFAULT 0, -- 已售数量
  is_set_group BOOLEAN DEFAULT FALSE,
  group_sum INTEGER,
  low_stock_threshold INTEGER, -- 库存预警阈值
  purchase_limit INTEGER, -- 商品限购数量(每个客户最多购买)
  cost DECIMAL(10, 2), -- 原料成本
  material_cost_items TEXT, -- JSON: [{materialId, materialName, weight, unitPrice}]
  labor_cost DECIMAL(10, 2), -- 人工成本
  packaging_cost DECIMAL(10, 2), -- 包装成本
  likes_count INTEGER DEFAULT 0, -- 喜欢人数
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 商品图片表
CREATE TABLE goods_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 成本与库存相关表
-- ============================================

-- 材料表(用于成本计算)
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL, -- 单位价格
  unit VARCHAR(50) DEFAULT '克', -- 单位(克、个、ml等)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 库存预警表
CREATE TABLE low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  threshold INTEGER, -- 预警阈值
  current_stock INTEGER, -- 当前库存
  alerted_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 用户交互相关表(好评、建议、评论等)
-- ============================================

-- 用户喜欢商品表
CREATE TABLE goods_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, goods_id)
);

-- 用户建议表(购买后的改进建议)
CREATE TABLE goods_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(50), -- 类型: 甜度、口感、软硬度、包装等
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSED, IGNORED
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processor_notes TEXT, -- 处理备注
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 评论表
CREATE TABLE goods_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1-5星评分
  title VARCHAR(200),
  content TEXT,
  review_type VARCHAR(20) DEFAULT 'goods', -- goods: 商品评论, shop: 店铺评论
  is_approved BOOLEAN DEFAULT FALSE, -- 是否经店主审核
  images TEXT, -- JSON数组: [imageUrl1, imageUrl2, ...]
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 订单表 (更新)
-- ============================================

-- 订单表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no VARCHAR(32) UNIQUE NOT NULL, -- 订单号
  mart_id UUID REFERENCES marts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 收货信息(冗余存储，防止地址修改影响历史订单)
  receiver_name VARCHAR(50) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  province VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  district VARCHAR(50) NOT NULL,
  detail_address VARCHAR(500) NOT NULL,

  -- 金额信息
  total_amount DECIMAL(10, 2) NOT NULL,
  freight_amount DECIMAL(10, 2) DEFAULT 0, -- 运费
  goods_cost DECIMAL(10, 2) DEFAULT 0, -- 订单商品总成本(仅发起者可见)

  -- 状态信息
  status VARCHAR(30) DEFAULT 'CREATED',
  -- CREATED: 待处理
  -- PENDING_SHIPMENT: 待发货
  -- SHIPPED: 已发货
  -- DELIVERED: 已送达
  -- COMPLETED: 已完成
  -- CANCELED: 已取消

  -- 配送信息
  shipping_company VARCHAR(100),
  shipping_no VARCHAR(100),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,

  -- 备注
  buyer_remark TEXT, -- 买家备注
  seller_remark TEXT, -- 卖家备注

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订单明细表
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  goods_id UUID REFERENCES goods(id) ON DELETE SET NULL,
  goods_name VARCHAR(200) NOT NULL,
  goods_image TEXT,
  specification VARCHAR(200),
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  goods_cost DECIMAL(10, 2) DEFAULT 0, -- 当前商品成本
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订单配送轨迹表
CREATE TABLE order_delivery_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  operator VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 参与与统计相关表
-- ============================================

-- 参与记录表
CREATE TABLE mart_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mart_id, user_id)
);

-- ============================================
-- 消息相关表
-- ============================================

-- 消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type VARCHAR(50) DEFAULT 'system', -- system, order, shipping, promotion
  related_id UUID, -- 关联的业务ID(如订单ID)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 系统配置相关表
-- ============================================

-- 帮助中心文章表
CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  category VARCHAR(50), -- 分类
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 轮播图表
CREATE TABLE carousels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200),
  image_url TEXT NOT NULL,
  link_url TEXT,
  link_type VARCHAR(20), -- mart/url
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  description VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 地区数据表 (用于配送范围选择)
-- ============================================

-- 省份表
CREATE TABLE provinces (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 城市表
CREATE TABLE cities (
  code VARCHAR(10) PRIMARY KEY,
  province_code VARCHAR(10) REFERENCES provinces(code),
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 区县表
CREATE TABLE districts (
  code VARCHAR(10) PRIMARY KEY,
  city_code VARCHAR(10) REFERENCES cities(code),
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================

-- 用户相关索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 收货地址索引
CREATE INDEX idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX idx_shipping_addresses_is_default ON shipping_addresses(user_id, is_default);

-- Mart 相关索引
CREATE INDEX idx_marts_user_id ON marts(user_id);
CREATE INDEX idx_marts_status ON marts(status);
CREATE INDEX idx_marts_finish_time ON marts(finish_time);
CREATE INDEX idx_marts_created_at ON marts(created_at DESC);
CREATE INDEX idx_mart_delivery_areas_mart_id ON mart_delivery_areas(mart_id);
CREATE INDEX idx_mart_delivery_areas_code ON mart_delivery_areas(province_code, city_code, district_code);

-- 商品相关索引
CREATE INDEX idx_goods_mart_id ON goods(mart_id);
CREATE INDEX idx_goods_category_id ON goods(category_id);
CREATE INDEX idx_goods_status ON goods(status);

-- 订单相关索引
CREATE INDEX idx_orders_mart_id ON orders(mart_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_province_city ON orders(province, city);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_delivery_tracks_order_id ON order_delivery_tracks(order_id);

-- 参与记录索引
CREATE INDEX idx_mart_participations_mart_id ON mart_participations(mart_id);
CREATE INDEX idx_mart_participations_user_id ON mart_participations(user_id);

-- 消息索引
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_is_read ON messages(user_id, is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- 新增表索引
CREATE INDEX idx_materials_mart_id ON materials(mart_id);
CREATE INDEX idx_low_stock_alerts_goods_id ON low_stock_alerts(goods_id);
CREATE INDEX idx_low_stock_alerts_status ON low_stock_alerts(status);
CREATE INDEX idx_goods_likes_user_id ON goods_likes(user_id);
CREATE INDEX idx_goods_likes_goods_id ON goods_likes(goods_id);
CREATE INDEX idx_goods_suggestions_user_id ON goods_suggestions(user_id);
CREATE INDEX idx_goods_suggestions_goods_id ON goods_suggestions(goods_id);
CREATE INDEX idx_goods_suggestions_status ON goods_suggestions(status);
CREATE INDEX idx_goods_reviews_user_id ON goods_reviews(user_id);
CREATE INDEX idx_goods_reviews_goods_id ON goods_reviews(goods_id);
CREATE INDEX idx_goods_reviews_is_approved ON goods_reviews(goods_id, is_approved);
CREATE INDEX idx_goods_purchase_limit ON goods(mart_id, purchase_limit);
```

### 10.3 Prisma Schema 示例

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 用户相关模型
// ============================================

model User {
  id           String   @id @default(uuid())
  phone        String?  @unique @db.VarChar(20)
  nickname     String?  @db.VarChar(100)
  avatarUrl    String?  @map("avatar_url") @db.Text
  passwordHash String?  @map("password_hash") @db.VarChar(255)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  profile          UserProfile?
  sessions         UserSession[]
  shippingAddresses ShippingAddress[]
  marts            Mart[]
  orders           Order[]
  messages         Message[]
  participations   MartParticipation[]
  likes            GoodsLike[]
  suggestions      GoodsSuggestion[] @relation("suggestions")
  processedSuggestions GoodsSuggestion[] @relation("processedSuggestions")
  reviews          GoodsReview[]

  @@map("users")
}

model UserProfile {
  id        String   @id @default(uuid())
  userId    String   @unique @map("user_id")
  realName  String?  @map("real_name") @db.VarChar(50)
  idCard    String?  @map("id_card") @db.VarChar(20)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model UserSession {
  id               String    @id @default(uuid())
  userId           String    @map("user_id")
  refreshTokenHash String    @map("refresh_token_hash") @db.VarChar(255)
  deviceInfo       String?   @map("device_info") @db.VarChar(500)
  ipAddress        String?   @map("ip_address") @db.VarChar(45)
  expiresAt        DateTime  @map("expires_at")
  createdAt        DateTime  @default(now()) @map("created_at")

  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("user_sessions")
}

// ============================================
// 收货地址模型
// ============================================

model ShippingAddress {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  receiverName  String    @map("receiver_name") @db.VarChar(50)
  receiverPhone String    @map("receiver_phone") @db.VarChar(20)
  province      String    @db.VarChar(50)
  provinceCode  String?   @map("province_code") @db.VarChar(10)
  city          String    @db.VarChar(50)
  cityCode      String?   @map("city_code") @db.VarChar(10)
  district      String    @db.VarChar(50)
  districtCode  String?   @map("district_code") @db.VarChar(10)
  detailAddress String    @map("detail_address") @db.VarChar(500)
  latitude      Decimal?  @db.Decimal(10, 8)
  longitude     Decimal?  @db.Decimal(11, 8)
  tag           String?   @db.VarChar(20)
  isDefault     Boolean   @default(false) @map("is_default")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, isDefault])
  @@map("shipping_addresses")
}

// ============================================
// Mart 模型
// ============================================

model Mart {
  id                 String    @id @default(uuid())
  userId             String?   @map("user_id")
  topic              String    @db.VarChar(500)
  description        String?   @db.Text
  setFinishTime      Boolean   @default(false) @map("set_finish_time")
  finishTime         DateTime? @map("finish_time")
  status             MartStatus @default(OPEN) @db.VarChar(20)
  browseCount        Int       @default(0) @map("browse_count")
  isSingleProduct    Boolean   @default(false) @map("is_single_product")
  groupSum           Int?      @map("group_sum")
  deliveryDescription String?  @map("delivery_description") @db.Text
  expectedShipDays   Int       @default(3) @map("expected_ship_days")
  autoConfirmDays    Int       @default(7) @map("auto_confirm_days")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  user               User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  images             MartImage[]
  goods              Goods[]
  orders             Order[]
  deliveryAreas      MartDeliveryArea[]
  participations     MartParticipation[]
  materials          Material[]
  lowStockAlerts     LowStockAlert[]
  reviews            GoodsReview[]

  @@index([userId])
  @@index([status])
  @@index([finishTime])
  @@index([createdAt(sort: Desc)])
  @@map("marts")
}

model MartImage {
  id        String   @id @default(uuid())
  martId    String   @map("mart_id")
  imageUrl  String   @map("image_url") @db.Text
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")

  mart      Mart     @relation(fields: [martId], references: [id], onDelete: Cascade)

  @@map("mart_images")
}

model MartDeliveryArea {
  id           String   @id @default(uuid())
  martId       String   @map("mart_id")
  province     String?  @db.VarChar(50)
  provinceCode String?  @map("province_code") @db.VarChar(10)
  city         String?  @db.VarChar(50)
  cityCode     String?  @map("city_code") @db.VarChar(10)
  district     String?  @db.VarChar(50)
  districtCode String?  @map("district_code") @db.VarChar(10)
  level        String   @db.VarChar(20)
  createdAt    DateTime @default(now()) @map("created_at")

  mart         Mart     @relation(fields: [martId], references: [id], onDelete: Cascade)

  @@index([martId])
  @@index([provinceCode, cityCode, districtCode])
  @@map("mart_delivery_areas")
}

// ============================================
// 商品模型
// ============================================

model GoodsCategory {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(100)
  iconUrl   String?  @map("icon_url") @db.Text
  sortOrder Int      @default(0) @map("sort_order")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  goods     Goods[]

  @@map("goods_categories")
}

model Goods {
  id                String       @id @default(uuid())
  martId            String       @map("mart_id")
  categoryId        String?      @map("category_id")
  name              String       @db.VarChar(200)
  description       String?      @db.Text
  specification     String?      @db.VarChar(200)
  price             Decimal      @db.Decimal(10, 2)
  originalPrice     Decimal?     @map("original_price") @db.Decimal(10, 2)
  repertory         Int          @default(0)
  soldCount         Int          @default(0) @map("sold_count")
  isSetGroup        Boolean      @default(false) @map("is_set_group")
  groupSum          Int?         @map("group_sum")
  lowStockThreshold Int?         @map("low_stock_threshold")
  purchaseLimit     Int?         @map("purchase_limit") -- 商品限购数量
  cost              Decimal?     @db.Decimal(10, 2) -- 原料成本
  materialCostItems String?      @map("material_cost_items") @db.Text -- JSON: [{materialId, materialName, weight, unitPrice}]
  laborCost         Decimal?     @map("labor_cost") @db.Decimal(10, 2)
  packagingCost     Decimal?     @map("packaging_cost") @db.Decimal(10, 2)
  likesCount        Int          @default(0) @map("likes_count")
  sortOrder         Int          @default(0) @map("sort_order")
  status            String       @default("ACTIVE") @db.VarChar(20)
  createdAt         DateTime     @default(now()) @map("created_at")
  updatedAt         DateTime     @updatedAt @map("updated_at")

  mart              Mart         @relation(fields: [martId], references: [id], onDelete: Cascade)
  category          GoodsCategory? @relation(fields: [categoryId], references: [id])
  images            GoodsImage[]
  orderItems        OrderItem[]
  likes             GoodsLike[]
  suggestions       GoodsSuggestion[]
  reviews           GoodsReview[]

  @@index([martId])
  @@index([categoryId])
  @@map("goods")
}

model GoodsImage {
  id        String   @id @default(uuid())
  goodsId   String   @map("goods_id")
  imageUrl  String   @map("image_url") @db.Text
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")

  goods     Goods    @relation(fields: [goodsId], references: [id], onDelete: Cascade)

  @@map("goods_images")
}

// ============================================
// 订单模型
// ============================================

model Order {
  id             String    @id @default(uuid())
  orderNo        String    @unique @map("order_no") @db.VarChar(32)
  martId         String?   @map("mart_id")
  userId         String?   @map("user_id")

  // 收货信息
  receiverName   String    @map("receiver_name") @db.VarChar(50)
  receiverPhone  String    @map("receiver_phone") @db.VarChar(20)
  province       String    @db.VarChar(50)
  city           String    @db.VarChar(50)
  district       String    @db.VarChar(50)
  detailAddress  String    @map("detail_address") @db.VarChar(500)

  // 金额
  totalAmount    Decimal   @map("total_amount") @db.Decimal(10, 2)
  freightAmount  Decimal   @default(0) @map("freight_amount") @db.Decimal(10, 2)
  goodsCost      Decimal   @default(0) @map("goods_cost") @db.Decimal(10, 2) -- 订单商品总成本

  // 状态
  status         OrderStatus @default(CREATED) @db.VarChar(30)

  // 配送信息
  shippingCompany String?  @map("shipping_company") @db.VarChar(100)
  shippingNo      String?  @map("shipping_no") @db.VarChar(100)
  shippedAt       DateTime? @map("shipped_at")
  deliveredAt     DateTime? @map("delivered_at")
  completedAt     DateTime? @map("completed_at")
  canceledAt      DateTime? @map("canceled_at")
  cancelReason    String?  @map("cancel_reason") @db.Text

  // 备注
  buyerRemark    String?   @map("buyer_remark") @db.Text
  sellerRemark   String?   @map("seller_remark") @db.Text

  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  mart           Mart?     @relation(fields: [martId], references: [id], onDelete: SetNull)
  user           User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  items          OrderItem[]
  deliveryTracks OrderDeliveryTrack[]
  participation  MartParticipation?
  suggestions    GoodsSuggestion[]
  reviews        GoodsReview[]

  @@index([martId])
  @@index([userId])
  @@index([status])
  @@index([orderNo])
  @@index([createdAt(sort: Desc)])
  @@index([province, city])
  @@map("orders")
}

model OrderItem {
  id           String   @id @default(uuid())
  orderId      String   @map("order_id")
  goodsId      String?  @map("goods_id")
  goodsName    String   @map("goods_name") @db.VarChar(200)
  goodsImage   String?  @map("goods_image") @db.Text
  specification String? @db.VarChar(200)
  price        Decimal  @db.Decimal(10, 2)
  quantity     Int
  subtotal     Decimal  @db.Decimal(10, 2)
  goodsCost    Decimal  @default(0) @map("goods_cost") @db.Decimal(10, 2)
  createdAt    DateTime @default(now()) @map("created_at")

  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  goods        Goods?   @relation(fields: [goodsId], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@map("order_items")
}

model OrderDeliveryTrack {
  id          String   @id @default(uuid())
  orderId     String   @map("order_id")
  status      String   @db.VarChar(30)
  description String?  @db.Text
  location    String?  @db.VarChar(200)
  operator    String?  @db.VarChar(100)
  createdAt   DateTime @default(now()) @map("created_at")

  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("order_delivery_tracks")
}

// ============================================
// 参与记录模型
// ============================================

model MartParticipation {
  id        String   @id @default(uuid())
  martId    String   @map("mart_id")
  userId    String   @map("user_id")
  orderId   String?  @map("order_id")
  createdAt DateTime @default(now()) @map("created_at")

  mart      Mart     @relation(fields: [martId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  order     Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)

  @@unique([martId, userId])
  @@index([martId])
  @@index([userId])
  @@map("mart_participations")
}

// ============================================
// 消息模型
// ============================================

model Message {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  title     String   @db.VarChar(200)
  content   String?  @db.Text
  type      String   @default("system") @db.VarChar(50)
  relatedId String?  @map("related_id")
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, isRead])
  @@index([createdAt(sort: Desc)])
  @@map("messages")
}

// ============================================
// 成本与库存管理模型
// ============================================

model Material {
  id        String   @id @default(uuid())
  martId    String?  @map("mart_id")
  name      String   @db.VarChar(100)
  unitPrice Decimal  @map("unit_price") @db.Decimal(10, 2)
  unit      String   @default("克") @db.VarChar(50)
  description String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  mart      Mart?    @relation(fields: [martId], references: [id], onDelete: Cascade)

  @@index([martId])
  @@map("materials")
}

model LowStockAlert {
  id           String   @id @default(uuid())
  goodsId      String   @map("goods_id")
  martId       String?  @map("mart_id")
  threshold    Int
  currentStock Int      @map("current_stock")
  alertedAt    DateTime? @map("alerted_at")
  status       String   @default("ACTIVE") @db.VarChar(20)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  goods        Goods    @relation(fields: [goodsId], references: [id], onDelete: Cascade)
  mart         Mart?    @relation(fields: [martId], references: [id], onDelete: Cascade)

  @@index([goodsId])
  @@index([status])
  @@map("low_stock_alerts")
}

// ============================================
// 用户交互模型(优评、建议、评论)
// ============================================

model GoodsLike {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  goodsId   String   @map("goods_id")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  goods     Goods    @relation(fields: [goodsId], references: [id], onDelete: Cascade)

  @@unique([userId, goodsId])
  @@index([userId])
  @@index([goodsId])
  @@map("goods_likes")
}

model GoodsSuggestion {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  orderId       String?  @map("order_id")
  goodsId       String   @map("goods_id")
  suggestionType String?  @map("suggestion_type") @db.VarChar(50)
  content       String   @db.Text
  status        String   @default("PENDING") @db.VarChar(20)
  processedAt   DateTime? @map("processed_at")
  processedBy   String?  @map("processed_by")
  processorNotes String?  @map("processor_notes") @db.Text
  createdAt     DateTime @default(now()) @map("created_at")

  user          User     @relation("suggestions", fields: [userId], references: [id], onDelete: Cascade)
  order         Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  goods         Goods    @relation(fields: [goodsId], references: [id], onDelete: Cascade)
  processor     User?    @relation("processedSuggestions", fields: [processedBy], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([goodsId])
  @@index([status])
  @@map("goods_suggestions")
}

model GoodsReview {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  orderId      String?  @map("order_id")
  goodsId      String   @map("goods_id")
  martId       String?  @map("mart_id")
  rating       Int      @db.SmallInt
  title        String?  @db.VarChar(200)
  content      String?  @db.Text
  reviewType   String   @default("goods") @map("review_type") @db.VarChar(20)
  isApproved   Boolean  @default(false) @map("is_approved")
  images       String?  @db.Text -- JSON: [imageUrl1, imageUrl2, ...]
  approvedAt   DateTime? @map("approved_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  order        Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  goods        Goods    @relation(fields: [goodsId], references: [id], onDelete: Cascade)
  mart         Mart?    @relation(fields: [martId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([goodsId])
  @@index([goodsId, isApproved])
  @@map("goods_reviews")
}

// ============================================
// 系统配置模型
// ============================================

model HelpArticle {
  id        String   @id @default(uuid())
  title     String   @db.VarChar(200)
  content   String?  @db.Text
  category  String?  @db.VarChar(50)
  sortOrder Int      @default(0) @map("sort_order")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("help_articles")
}

model Carousel {
  id        String    @id @default(uuid())
  title     String?   @db.VarChar(200)
  imageUrl  String    @map("image_url") @db.Text
  linkUrl   String?   @map("link_url") @db.Text
  linkType  String?   @map("link_type") @db.VarChar(20)
  sortOrder Int       @default(0) @map("sort_order")
  isActive  Boolean   @default(true) @map("is_active")
  startTime DateTime? @map("start_time")
  endTime   DateTime? @map("end_time")
  createdAt DateTime  @default(now()) @map("created_at")

  @@map("carousels")
}

model SystemConfig {
  id          String   @id @default(uuid())
  configKey   String   @unique @map("config_key") @db.VarChar(100)
  configValue String?  @map("config_value") @db.Text
  description String?  @db.VarChar(500)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("system_configs")
}

// ============================================
// 地区模型
// ============================================

model Province {
  code      String   @id @db.VarChar(10)
  name      String   @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")

  cities    City[]

  @@map("provinces")
}

model City {
  code        String   @id @db.VarChar(10)
  provinceCode String  @map("province_code") @db.VarChar(10)
  name        String   @db.VarChar(50)
  createdAt   DateTime @default(now()) @map("created_at")

  province    Province @relation(fields: [provinceCode], references: [code])
  districts   District[]

  @@map("cities")
}

model District {
  code      String   @id @db.VarChar(10)
  cityCode  String   @map("city_code") @db.VarChar(10)
  name      String   @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")

  city      City     @relation(fields: [cityCode], references: [code])

  @@map("districts")
}

// ============================================
// 枚举
// ============================================

enum MartStatus {
  OPEN
  CLOSED
  ENDED
}

enum OrderStatus {
  CREATED
  PENDING_SHIPMENT
  SHIPPED
  DELIVERED
  COMPLETED
  CANCELED
}
```

### 10.4 数据迁移策略

- 使用 Prisma Migrate 管理数据库版本
- 每次 Schema 变更必须生成迁移文件
- 生产环境迁移必须可回滚
- 种子数据：省市区数据初始化

### 10.5 数据库设计满足度检查(新增需求vs数据库设计) 

为确保数据库设计完全满足"其他功能"需求，以下表格列出核心需求与对应表/字段的映射：

| 需求功能 | 核心表 | 关键字段 | 说明 |
|---------|--------|--------|------|
| 库存提醒 | `low_stock_alerts`, `goods`, `messages` | `goods.low_stock_threshold`, `low_stock_alerts.status` | 设置阈值后自动生成预警记录，发送给管理员消息 |
| 成本计算 | `goods`, `materials`, `order_items` | `goods.cost`, `goods.material_cost_items`, `goods.labor_cost`, `goods.packaging_cost`, `order_items.goods_cost` | 支持分解成本计算，保存历史成本 |
| 商品限购 | `goods`, `order_items`, `orders` | `goods.purchase_limit` | 下单时校验用户该Mart中已购该商品的数量 |
| 商品喜欢 | `goods_likes`, `goods` | `goods_likes.user_id/goods_id`, `goods.likes_count` | 点赞关系表 + 计数器 |
| 建议与评论 | `goods_suggestions`, `goods_reviews`, `goods` | `goods_suggestions.status`, `goods_reviews.is_approved` | 支持审核流程 |
| 数据导出 | `orders`, `order_items`, `goods`, `shipping_addresses` | 订单和商品维度的完整字段 | 已包含所有必需的导出字段 |

### 10.6 数据库连接配置

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/vanmart?schema=public"

# 连接池配置 (生产环境)
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_IDLE=10000
```

## 11. 数据模型与序列化规范(必须)

### 11.1 前端 TypeScript 类型(最低要求)

前端必须为核心实体建立类型(放在 `src/types`)，至少包括：

- `User`、`UserProfile`
- `ShippingAddress`
- `GoodsCategory`
- `Mart`、`MartGoods`、`MartDeliveryArea`
- `OrderDraft`、`Order`、`OrderItem`、`OrderDeliveryTrack`
- `Message`
- `HelpArticle`
- `Province`、`City`、`District`
- **新增类型**：
  - `GoodsLike`、`GoodsSuggestion`、`GoodsReview` (评论与建议)
  - `LowStockAlert` (库存预警)
  - `Material`、`CostReport` (成本管理)

### 11.2 金额与时间

- 金额：
  - 前端统一以元为展示单位。
  - 计算总价时避免浮点误差(建议使用整数分或统一 `toFixed(2)` 展示)。
- 时间：
  - 前端统一使用 ISO 时间字符串或 `YYYY-MM-DD HH:mm`。
  - 展示按用户本地时区。

### 11.3 地址格式规范

- 收货地址必须包含完整的省市区信息。
- 使用标准行政区划代码 (国家统计局标准)。
- 前端使用级联选择器选择省市区。

### 11.4 OSS 上传对象(key)

前端必须记录每张图片最终提交给后端的 `key`：

- `key = ossPolicy.dir + fileName`
- 提交 Mart 发布时：
  - `introImages` 用逗号字符串(legacy)或数组(若后端支持)。
  - 商品图片 `serverPaths` 同理。

## 12. API 契约(必须明确)

### 12.1 环境变量

- `VITE_API_BASE_URL`
- `VITE_UPLOAD_BASE_URL`

### 12.2 请求规范

- 所有 API 通过统一 client 调用：
  - baseURL 来自 `VITE_API_BASE_URL`
  - 超时默认 15s
  - 自动注入 `X-Session-Id`
- 错误处理：
  - HTTP 非 2xx：统一提示 `请求失败(status)`。
  - HTTP 2xx 但 `errorCode !== 0`：提示 `errorMessage`。

### 12.3 RESTful API 设计

采用 RESTful 风格重新设计 API，同时保留 legacy 接口路径映射以兼容现有逻辑。

#### 认证模块 (`/api/auth`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/sms/send` | 发送短信验证码 | 否 |
| POST | `/api/auth/sms/login` | 手机号验证码登录 | 否 |
| POST | `/api/auth/login` | 账号密码登录 | 否 |
| POST | `/api/auth/logout` | 退出登录 | 是 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |
| POST | `/api/auth/refresh` | 刷新 Token | 是 |

#### 用户模块 (`/api/users`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/users/me` | 获取当前用户详情 | 是 |
| PUT | `/api/users/me` | 更新当前用户信息 | 是 |
| GET | `/api/users/me/profile` | 获取用户资料 | 是 |
| PUT | `/api/users/me/profile` | 更新用户资料 | 是 |
| GET | `/api/users/me/qrcode` | 获取用户二维码 | 是 |

#### Mart 模块 (`/api/marts`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/marts` | 获取 Mart 列表 (分页) | 否 |
| GET | `/api/marts/:id` | 获取 Mart 详情 | 否 |
| POST | `/api/marts` | 创建 Mart | 是 |
| PUT | `/api/marts/:id` | 更新 Mart | 是 |
| POST | `/api/marts/:id/close` | 关闭 Mart | 是 |
| POST | `/api/marts/:id/browse` | 增加浏览量 | 否 |
| GET | `/api/marts/:id/participations` | 获取参与记录 | 否 |
| GET | `/api/marts/:id/stats` | 获取统计数据 | 是 (发起者) |
| GET | `/api/marts/:id/orders` | 获取订单列表 (发起者) | 是 (发起者) |
| GET | `/api/marts/:id/orders/shipping` | 获取待发货订单 | 是 (发起者) |
| POST | `/api/marts/:id/orders/shipping` | 批量发货 | 是 (发起者) |
| GET | `/api/marts/:id/orders/export` | 导出订单 Excel | 是 (发起者) |
| GET | `/api/marts/:id/delivery-areas` | 获取配送范围 | 否 |
| POST | `/api/marts/:id/delivery-areas` | 设置配送范围 | 是 (发起者) |
| GET | `/api/marts/count` | 获取 Mart 总数 | 否 |

#### 订单模块 (`/api/orders`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/orders` | 创建订单 | 是 |
| GET | `/api/orders/me` | 获取我的订单列表 | 是 |
| GET | `/api/orders/:id` | 获取订单详情 | 是 |
| POST | `/api/orders/:id/cancel` | 取消订单 | 是 |
| POST | `/api/orders/:id/confirm` | 确认收货 | 是 |
| GET | `/api/orders/:id/tracks` | 获取配送轨迹 | 是 |
| GET | `/api/orders/stats` | 获取订单统计 | 是 |

#### 收货地址模块 (`/api/addresses`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/addresses` | 获取我的收货地址列表 | 是 |
| GET | `/api/addresses/:id` | 获取收货地址详情 | 是 |
| POST | `/api/addresses` | 创建收货地址 | 是 |
| PUT | `/api/addresses/:id` | 更新收货地址 | 是 |
| DELETE | `/api/addresses/:id` | 删除收货地址 | 是 |
| PUT | `/api/addresses/:id/default` | 设为默认地址 | 是 |
| POST | `/api/addresses/validate` | 校验地址是否在配送范围内 | 是 |

#### 地区模块 (`/api/regions`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/regions/provinces` | 获取省份列表 | 否 |
| GET | `/api/regions/cities` | 获取城市列表 (按省份) | 否 |
| GET | `/api/regions/districts` | 获取区县列表 (按城市) | 否 |

#### 消息模块 (`/api/messages`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/messages` | 获取消息列表 | 是 |
| GET | `/api/messages/:id` | 获取消息详情 | 是 |
| POST | `/api/messages/:id/read` | 标记已读 | 是 |
| GET | `/api/messages/unread-count` | 获取未读数量 | 是 |

#### 商品分类模块 (`/api/categories`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/categories` | 获取分类列表 | 否 |

#### 上传模块 (`/api/upload`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/upload/policy` | 获取 OSS 上传策略 | 是 |
| POST | `/api/upload/callback` | 上传完成回调 | 是 |

#### 轮播图模块 (`/api/carousels`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/carousels` | 获取轮播图列表 | 否 |

#### 帮助中心模块 (`/api/help`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/help/articles` | 获取帮助文章列表 | 否 |
| GET | `/api/help/articles/:id` | 获取帮助文章详情 | 否 |

#### 商品互动模块 (`/api/goods/interactions`) (新增)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/goods/:id/like` | 点赞商品 | 是 |
| DELETE | `/api/goods/:id/like` | 取消点赞 | 是 |
| GET | `/api/goods/:id/likes` | 获取点赞信息(包含当前用户是否喜欢) | 是 |
| POST | `/api/goods/:id/suggestions` | 提交改进建议 | 是 |
| GET | `/api/goods/:id/suggestions` | 获取商品建议列表(发起者) | 是 |
| POST | `/api/suggestions/:id/approve` | 标记建议已处理 | 是 |
| POST | `/api/goods/:id/reviews` | 提交评论评分 | 是 |
| GET | `/api/goods/:id/reviews` | 获取商品评论列表(仅已批准) | 否 |
| GET | `/api/marts/:id/reviews/pending` | 获取待审核评论列表(发起者) | 是 |
| POST | `/api/reviews/:id/approve` | 批准评论 | 是 |
| DELETE | `/api/reviews/:id` | 删除评论 | 是 |

#### 成本管理模块 (`/api/cost`) (新增)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/cost/materials` | 获取材料列表(发起者) | 是 |
| POST | `/api/cost/materials` | 添加材料成本(发起者) | 是 |
| PUT | `/api/cost/materials/:id` | 编辑材料成本 | 是 |
| DELETE | `/api/cost/materials/:id` | 删除材料 | 是 |
| POST | `/api/cost/calculate` | 计算商品成本(输入材料清单) | 是 |
| GET | `/api/marts/:id/cost-report` | 获取Mart成本报表(发起者) | 是 |

#### 库存预警模块 (`/api/inventory`) (新增)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/inventory/alerts` | 获取库存预警列表(发起者) | 是 |
| POST | `/api/inventory/alerts/:id/resolve` | 标记预警已处理 | 是 |

#### 订单导出模块 (`/api/export`) (新增)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/marts/:id/export/orders` | 导出订单明细 Excel | 是 |
| POST | `/api/marts/:id/export/picking-list` | 导出分拣单 Excel | 是 |
| POST | `/api/marts/:id/export/summary` | 导出商品汇总统计 Excel | 是 |
| POST | `/api/marts/:id/export/shipping` | 导出配送清单 Excel | 是 |

#### 统计分析模块扩展 (`/api/marts/:id/stats`) (更新)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/marts/:id/stats` | 获取基础统计数据 | 是 |
| GET | `/api/marts/:id/stats/cost` | 获取成本分析数据 | 是 |
| GET | `/api/marts/:id/stats/goods` | 获取商品维度统计 | 是 |
| GET | `/api/marts/:id/stats/region` | 获取区域维度统计 | 是 |
| GET | `/api/marts/:id/stats/profit` | 获取利润分析(包含成本) | 是 |

### 12.4 API 响应格式

```typescript
// 统一响应格式
interface ApiResponse<T> {
  code: number;        // 0 成功，非 0 失败
  message: string;     // 提示信息
  data: T;             // 响应数据
}

// 分页响应格式
interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 错误响应格式
interface ErrorResponse {
  code: number;
  message: string;
  errors?: Record<string, string[]>;  // 字段级错误
}
```

### 12.5 Legacy 接口路径映射

为保持向后兼容，后端应同时支持 legacy 路径：

```
/jielong/insert          -> POST /api/marts
/jielong/selectByPage    -> GET /api/marts
/jielong/selectById      -> GET /api/marts/:id
/userAddress/*           -> /api/addresses/*
/userMessage/*           -> /api/messages/*
```

## 13. 技术实现要求(必须)

### 13.1 前端技术栈

- 构建：Vite
- 框架：React + TypeScript
- 路由：React Router
- 请求与缓存：TanStack Query(React Query)
- 状态管理：Zustand(推荐)或 React Context
- 表单：React Hook Form + Zod
- 样式：Tailwind CSS 或 CSS Modules(二选一)
- PWA：`vite-plugin-pwa`
- 测试：
  - 单测：Vitest + Testing Library
  - E2E：Playwright(建议)
- 质量门禁：
  - `eslint`
  - `prettier`
  - `tsc --noEmit`

### 13.2 后端技术栈

- 运行时：Node.js 18+ 或 Bun
- 框架：Express / Fastify / Hono (三选一，推荐 Hono)
- 数据库：PostgreSQL 15+
- ORM：Prisma
- 认证：JWT + Session 混合
- 文件上传：Multer + OSS SDK
- 测试：Jest / Vitest
- API 文档：Swagger / OpenAPI

### 13.3 项目结构(建议)

```
├── apps/
│   ├── web/                    # 前端应用
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   ├── styles/
│   │   │   ├── types/
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── server/                 # 后端应用
│       ├── src/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── middlewares/
│       │   ├── routes/
│       │   ├── utils/
│       │   ├── types/
│       │   └── index.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                   # 共享包 (可选)
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   └── utils/
│       └── package.json
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.server
│   └── docker-compose.yml
│
├── .env.example
├── package.json
└── turbo.json                  # Turborepo 配置 (可选)
```

### 13.4 关键工程要求

- 所有业务数据请求必须通过 `api client`，禁止在组件中直接拼接 URL。
- 所有页面必须有 loading/empty/error 三态。
- 所有表单提交必须防重复提交。
- 所有需要登录的路由必须有路由守卫。

## 14. PWA 需求(vite-plugin-pwa)

### 14.1 Manifest

- `name`、`short_name`
- `start_url: "/"`
- `display: "standalone"`
- `theme_color`、`background_color`
- icons：
  - `192x192`
  - `512x512`
  - `maskable` 版本(建议)

### 14.2 缓存策略(最低可用)

- 预缓存：静态资源(JS/CSS/icons)
- 运行时缓存：
  - 图片：Cache First + 过期策略
  - API：Network First(离线显示错误态)
- 更新提示：
  - 新 SW 激活提示用户刷新

### 14.3 离线体验

- 断网可打开应用壳与路由骨架。
- API 请求失败必须显示可理解的错误文案，禁止白屏。

## 15. 部署需求(Docker + PostgreSQL)

### 15.1 容器化部署

- 使用 Docker 构建前后端镜像
- 使用 Docker Compose 编排服务
- 支持一键部署与水平扩展

### 15.2 Docker Compose 配置示例

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: vanmart-db
    environment:
      POSTGRES_USER: ${DB_USER:-vanmart}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-vanmart123}
      POSTGRES_DB: ${DB_NAME:-vanmart}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "${DB_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-vanmart}"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build:
      context: .
      dockerfile: docker/Dockerfile.server
    container_name: vanmart-server
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER:-vanmart}:${DB_PASSWORD:-vanmart123}@postgres:5432/${DB_NAME:-vanmart}
      JWT_SECRET: ${JWT_SECRET}
      OSS_ACCESS_KEY_ID: ${OSS_ACCESS_KEY_ID}
      OSS_ACCESS_KEY_SECRET: ${OSS_ACCESS_KEY_SECRET}
    ports:
      - "${SERVER_PORT:-3001}:3001"
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    container_name: vanmart-web
    environment:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:3001}
    ports:
      - "${WEB_PORT:-3000}:80"
    depends_on:
      - server

  # 可选: Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: vanmart-nginx
    ports:
      - "${NGINX_PORT:-80}:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - web
      - server

volumes:
  postgres_data:
```

### 15.3 环境变量

```env
# .env.example

# 数据库
DATABASE_URL=postgresql://vanmart:vanmart123@localhost:5432/vanmart
DB_USER=vanmart
DB_PASSWORD=vanmart123
DB_NAME=vanmart
DB_PORT=5432

# 服务端口
SERVER_PORT=3001
WEB_PORT=3000

# JWT
JWT_SECRET=your-jwt-secret-key

# OSS (阿里云)
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_REGION=
OSS_DIR=vanmart/

# 可选: Mock 模式
VITE_USE_MOCK=0
```

### 15.4 部署命令

```bash
# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d

# 数据库迁移
docker-compose exec server npx prisma migrate deploy

# 查看日志
docker-compose logs -f server
```

### 15.5 生产环境检查清单

- [ ] 数据库密码已修改为强密码
- [ ] JWT_SECRET 已设置为随机字符串
- [ ] OSS 密钥已配置
- [ ] 数据库备份策略已设置
- [ ] HTTPS 证书已配置
- [ ] 日志收集已配置

## 16. 验收标准(必须逐条通过)

### 16.1 部署验收

- Docker Compose 一键启动成功。
- PostgreSQL 数据库连接正常。
- 后端 API 健康检查通过 (`GET /health`)。
- 前端页面可访问。
- 访问任意路由并刷新不 404。
- 可安装为 PWA(Chrome/Edge)。
- 离线打开不白屏(至少展示壳与提示)。

### 16.2 数据库验收

- Prisma 迁移执行成功。
- 所有表结构与索引创建正确。
- 外键约束正常工作。
- 数据库连接池正常工作。

### 16.3 业务验收用例(MVP)

1. 首页加载轮播与 Mart 列表，并能分页加载更多。
2. 进入 Mart 详情会调用更新浏览量，并展示商品、配送说明。
3. 选择商品数量并填写收货地址后进入订单确认页，提交订单成功。
4. 发布 Mart：
  - 设置配送范围(可选)。
  - 添加至少 1 个商品。
  - 图片上传有进度与失败态，发布前无上传中/无失败。
  - 发布成功跳转详情。
5. 用户管理收货地址：新增、编辑、删除、设置默认。
6. 发起者进入统计页能按时间区间、区域维度查询汇总。
7. 发起者进入发货管理页能批量发货、填写物流信息。
8. 用户查看订单配送轨迹，确认收货。
9. 导出订单能触发浏览器下载 Excel 文件。
10. 消息中心能展示未读与已读，进入详情后已读状态更新。

### 16.4 新功能验收用例(其他功能)

11. **商品限购验收**：
  - 发起者发布 Mart 时为某商品设置限购数量(如限购2个)。
  - 用户添加购物车超过限购数量时，提示"该商品每位客户限购X件"。
  - 超限购无法下单，或收到明确的超限提示。

12. **商品喜欢验收**：
  - 商品详情页显示"喜欢"按钮。
  - 点击后显示"XX人喜欢该商品"。
  - 用户可以在"我的喜欢"页面查看已喜欢商品列表。

13. **库存预警验收**：
  - 发起者编辑商品时可设置库存预警阈值。
  - 当库存 <= 阈值时，发起者收到库存预警消息通知。
  - 发起者可在库存提醒列表中查看预警并标记为已处理。

14. **成本计算验收**(发起者)：
  - 发起者可后台添加材料及单价(如奶油5元/克)。
  - 编辑商品时输入材料清单(材料名称、克重)，系统自动计算成本。
  - 可额外增加人工、包装成本。
  - 商品详情页展示成本和利润率(仅发起者可见)。
  - 统计页展示成本分析报表。

15. **评论与建议验收**：
  - 用户下单并收货完成后，Mart详情页显示"发表评论"按钮。
  - 用户可提交建议信息(甜度、口感等)。
  - 发起者可在后台查看建议列表并标记已处理。
  - 用户提交的评论经发起者审批后公显在商品详情页。

16. **数据导出验收**：
  - 发起者进入发货管理页，点击"导出订单"能下载 Excel 文件。
  - Excel 包含：接龙号、客户名、商品、数量、金额、地址、电话等字段。
  - 可选："导出分拣单"包含至少25行空白行用于手动填写。
  - 可选："导出商品汇总"展示商品销量、金额统计。

## 17. 风险与依赖(开发前必须确认)

### 17.1 数据库迁移风险

- Legacy 数据是否需要迁移到 PostgreSQL。
- 数据迁移脚本与验证方案。
- 回滚策略。

### 17.2 OSS 上传配置

必须配置：

- 阿里云 OSS AccessKey。
- Bucket 跨域规则 (CORS)。
- 上传目录结构。

### 17.3 地图能力取舍

二选一：

- 简化：手填地址 + 可选浏览器定位(Geolocation)。
- 完整：接入地图 SDK(需要 key 管理与费用评估)。

### 17.4 短信验证码服务

需要接入短信服务商：

- 阿里云短信 / 腾讯云短信。
- 短信模板配置。
- 发送频率限制。

### 17.5 生产环境依赖

- PostgreSQL 数据库服务器 (推荐至少 2GB 内存)。
- Docker 运行环境。
- 域名与 SSL 证书。
- OSS 存储空间。

## 18. Legacy 模块映射(用于迁移对照)

- `pages/index/*` -> `mart:list`
- `pages/detail/*` -> `mart:detail` + `order:confirm`
- `pages/release/*` -> `mart:create` + `upload`
- `pages/detail/solitaireStatistics/*` -> `stats`
- `pages/detail/addrRemake/*` -> `shipping` + `delivery` + `export`
- `pages/comments/*` -> `messages`
- `pages/personal/*` -> `me` + `profile` + `addresses` + `help`
- `pages/personal/address/*` -> `addresses`

