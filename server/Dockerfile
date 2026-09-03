# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install all deps (including dev) for prisma generate + tsup build
COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY tsconfig.json tsup.config.ts ./
COPY src ./src
RUN npm run build

# ---- Production stage ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/health || exit 1

EXPOSE ${PORT:-5000}
CMD ["node", "dist/server.mjs"]