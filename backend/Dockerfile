# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma on Alpine needs OpenSSL available for engine selection/runtime.
RUN apk add --no-cache openssl

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 TypeScript
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# Runtime image. Database migrations/seeding are executed by the container entry command (see docker-compose).
RUN apk add --no-cache openssl

# 复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# 设置环境变量
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/index.js"]
