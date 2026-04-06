FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Production ---
FROM node:22-alpine

WORKDIR /app

RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN chown -R nodejs:nodejs /app
USER nodejs

ENV PORT=4100
ENV NZB_STORAGE_DIR=/data/nzb

EXPOSE 4100

CMD ["node", "dist/index.js"]
