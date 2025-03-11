FROM node:18-alpine AS base

# 安装必要的依赖
RUN apk add --no-cache libc6-compat

# 创建工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 设置环境变量
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=8192"

# 安装依赖阶段
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 安装Sharp
RUN npm install sharp

# 构建应用
RUN pnpm build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"] 