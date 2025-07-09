# Multi-stage Docker build for Clickdown
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

# Install dependencies
RUN npm ci --only=production
RUN cd server && npm ci --only=production
RUN cd client && npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN cd server && npx prisma generate

# Build Next.js app
RUN cd client && npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/client/.next ./client/.next
COPY --from=builder --chown=nextjs:nodejs /app/client/public ./client/public
COPY --from=builder --chown=nextjs:nodejs /app/server ./server
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy node_modules
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=deps --chown=nextjs:nodejs /app/client/node_modules ./client/node_modules

# Copy client package.json for runtime
COPY --from=builder --chown=nextjs:nodejs /app/client/package.json ./client/package.json

# Create necessary directories
RUN mkdir -p ./server/logs ./server/prisma && chown -R nextjs:nodejs ./server/logs ./server/prisma

# Install PM2 globally
RUN npm install -g pm2

# Copy PM2 ecosystem file
COPY --from=builder --chown=nextjs:nodejs /app/ecosystem.config.js ./ecosystem.config.js

USER nextjs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start both services with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]