# =============================================================================
# Multi-stage Dockerfile for NestJS Backend
# =============================================================================
# .dockerignore patterns:
#   node_modules
#   dist
#   .env
#   .env.local
#   *.log
#   .git
#   .gitignore
#   docker-compose.yml
#   Dockerfile
#   README.md
#   coverage
#   .nyc_output
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY packages/backend/package*.json ./

RUN npm ci --ignore-scripts

COPY packages/backend/ .

RUN npx prisma generate && npx nest build

# ---------------------------------------------------------------------------
# Stage 2: Production
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

RUN apk add --no-cache curl

RUN addgroup -S almokhtabar && adduser -S almokhtabar -G almokhtabar

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages/backend/prisma ./prisma

RUN npm install prisma --no-save 2>/dev/null || true

COPY packages/backend/start.sh ./start.sh
RUN chmod +x ./start.sh

RUN mkdir -p uploads logs && chown -R almokhtabar:almokhtabar /app

USER almokhtabar

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1

CMD ["./start.sh"]
