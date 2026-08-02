FROM node:20-alpine AS builder

WORKDIR /app

COPY packages/backend/package*.json ./

RUN npm ci --ignore-scripts

COPY packages/backend/ .

RUN npx prisma generate && npx nest build

FROM node:20-alpine AS production

RUN apk add --no-cache curl

RUN addgroup -S almokhtabar && adduser -S almokhtabar -G almokhtabar

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads logs && chown -R almokhtabar:almokhtabar /app

USER almokhtabar

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
