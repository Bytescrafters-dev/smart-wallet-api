# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-scripts

COPY prisma ./prisma
RUN yarn prisma generate

COPY . .
RUN node_modules/.bin/tsc -p tsconfig.build.json

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN yarn prisma generate

COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

CMD ["node", "-r", "./dist/register-paths.js", "dist/main.js"]
