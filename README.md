# VanMart Backend

VanMart API Server - 接龙团购平台后端

功能梳理文档：`FUNCTIONAL_OVERVIEW.md`

## 部署到 Ubuntu VPS（生产建议）

本仓库默认的 `docker-compose.yml` 偏向本地开发联调（会暴露 `5432/3001` 到宿主机端口）。部署到公网 VPS 时，建议使用更安全的生产 compose：

- 生产 compose：`docker-compose.prod.yml`
- 环境变量示例：`.env.prod.example`
- 部署注意事项：`DEPLOY_UBUNTU_VPS.md`

## 项目概述

VanMart 是一个接龙团购平台的后端服务，基于 Node.js + Express + Prisma 构建。

## 技术栈

### 运行时环境
- Node.js >= 18.x（建议使用 Node.js 20 LTS）
- TypeScript 5.3.3（后端）

### 前端建议稳定版本（用于本地/生产更稳的组合）

说明：
- 本仓库 `frontend/package.json` 当前使用的是更“新”的主版本组合（React 19 / React Router 7 / Vite 7 / Tailwind 4）。
- 下面这组是基于 Context7 MCP 文档对 Node 支持策略、Tailwind v4 PostCSS 插件拆分等信息整理出的“兼容性优先”的稳定组合，便于你在本地快速验证 UI 表现。

| 依赖包 | 建议稳定版本 | 说明 |
|--------|--------------|------|
| react | 18.3.1 | 更成熟、生态更广的 React 主版本 |
| react-dom | 18.3.1 | 与 react 同步 |
| react-router-dom | 6.30.3 | React Router v6（相对 v7 更稳） |
| vite | 6.4.1 | 避免 Vite 7 对 Node 版本的更高要求 |
| @vitejs/plugin-react | 4.7.0 | 与 Vite 6 组合常见 |
| tailwindcss | 3.4.19 | Tailwind v3（相对 v4 变更更少） |
| postcss | 8.5.6 | Tailwind v3/v4 均常用的 PostCSS 主版本 |
| autoprefixer | 10.4.24 | Tailwind v3 常用（v4 可选） |
| i18next | 25.8.7 | i18n 核心库（本项目已接入） |
| react-i18next | 16.5.4 | React 绑定（本项目已接入） |
| typescript（前端） | 5.9.3 | 可保持现状；若你希望更保守可降到 5.6.x 左右 |

### 核心依赖

| 依赖包 | 当前版本 | 最新版本 | 说明 |
|--------|----------|----------|------|
| express | 4.18.2 | 5.2.1 | Web 框架 |
| @prisma/client | 5.22.0 | 7.4.0 | ORM 数据库客户端 |
| prisma | 5.22.0 | 7.4.0 | ORM 工具链 |
| bcryptjs | 2.4.3 | 3.0.3 | 密码加密 |
| jsonwebtoken | 9.0.2 | 9.0.3 | JWT 认证 |
| helmet | 7.1.0 | 8.1.0 | 安全中间件 |
| cors | 2.8.5 | 2.8.6 | 跨域处理 |
| dotenv | 16.3.1 | 17.3.1 | 环境变量 |

### 开发依赖

| 依赖包 | 当前版本 | 最新版本 | 说明 |
|--------|----------|----------|------|
| typescript | 5.3.3 | 5.9.3 | TypeScript 编译器 |
| ts-node | 10.9.2 | 10.9.2 | TypeScript 运行时 |
| jest | 29.7.0 | 30.2.0 | 测试框架 |
| ts-jest | 29.2.6 | 29.4.6 | Jest TypeScript 支持 |
| supertest | 6.3.4 | 7.2.2 | HTTP 测试 |

## 快速开始

### 安装依赖

```bash
cd backend
npm install
```

### 数据库配置

```bash
# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充种子数据
npm run db:seed
```

### 开发运行

```bash
npm run dev
```

### 生产构建

```bash
npm run build
npm start
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式运行 |
| `npm run build` | 构建生产代码 |
| `npm start` | 运行生产代码 |
| `npm test` | 运行测试 |
| `npm run lint` | 代码检查 |
| `npm run prisma:studio` | 打开 Prisma Studio |

## 更新日志

### 依赖版本更新记录 (2026-02-13)

基于 npm registry 和 context7 MCP 查询的最新版本：

**主要更新可用：**
- Express 4.18.2 → 5.2.1 (大版本更新)
- Prisma 5.22.0 → 7.4.0 (大版本更新)
- Helmet 7.1.0 → 8.1.0 (大版本更新)
- Jest 29.7.0 → 30.2.0 (大版本更新)
- Supertest 6.3.4 → 7.2.2 (大版本更新)

**注意：** 大版本更新可能包含破坏性变更，升级前请查看各库的 CHANGELOG。

## 许可证

ISC
