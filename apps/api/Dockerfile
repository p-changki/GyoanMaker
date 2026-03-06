FROM node:20.9-alpine AS builder
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

RUN pnpm --filter @gyoanmaker/api build

FROM node:20.9-alpine AS runner
WORKDIR /workspace
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile --prod --filter @gyoanmaker/api

COPY --from=builder /workspace/apps/api/dist ./apps/api/dist

WORKDIR /workspace/apps/api
EXPOSE 8080

CMD ["node", "dist/server.js"]
