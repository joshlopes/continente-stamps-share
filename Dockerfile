# syntax=docker/dockerfile:1.4

# =============================================================================
# Continente Stamps Share - Single Container Build (Optimized for Fast CI/CD)
# Combines frontend (static files) + backend (Bun) + nginx (reverse proxy)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies - Install all dependencies (cached separately)
# -----------------------------------------------------------------------------
FROM oven/bun:1.3-alpine AS deps

WORKDIR /app

# Install build dependencies needed for native modules
RUN apk add --no-cache python3 make g++

# Copy only package files first (maximizes Docker layer cache)
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies with cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder - Build everything in one stage
# -----------------------------------------------------------------------------
FROM deps AS builder

# Copy all source code
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY apps/web ./apps/web

# Build shared package first (dependency for both apps)
RUN cd packages/shared && bun run build

# Generate Prisma client
RUN cd apps/server && bunx prisma generate

# Build web frontend
RUN cd apps/web && bun run build

# -----------------------------------------------------------------------------
# Stage 3: Production dependencies only
# -----------------------------------------------------------------------------
FROM oven/bun:1.3-alpine AS prod-deps

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --production --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 4: Production runtime
# -----------------------------------------------------------------------------
FROM oven/bun:1.3-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache nginx supervisor && \
    mkdir -p /var/cache/nginx /var/log/nginx /run/nginx /var/log/supervisor

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy supervisor config
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/server/node_modules ./apps/server/node_modules

# Copy server source (Bun runs TypeScript natively, no build step needed)
COPY --from=builder /app/apps/server/src ./apps/server/src
COPY --from=builder /app/apps/server/generated ./apps/server/generated
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Copy built web frontend
COPY --from=builder /app/apps/web/dist ./web

# Copy entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
