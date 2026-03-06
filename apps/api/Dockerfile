FROM node:20.9-alpine AS builder
WORKDIR /workspace

COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

RUN npm run build --workspace @gyoanmaker/api

FROM node:20.9-alpine AS runner
WORKDIR /workspace
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci --omit=dev --workspace @gyoanmaker/api

COPY --from=builder /workspace/apps/api/dist ./apps/api/dist
COPY --from=builder /workspace/apps/api/system-prompt.txt ./apps/api/system-prompt.txt
COPY --from=builder /workspace/apps/api/system-prompt-basic.txt ./apps/api/system-prompt-basic.txt

WORKDIR /workspace/apps/api
EXPOSE 4000

CMD ["node", "dist/server.js"]
