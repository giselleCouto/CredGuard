# Multi-stage Dockerfile for CredGuard Platform
# Optimized for Manus deployment

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build frontend and backend
RUN pnpm build

# Stage 3: Production
FROM node:22-alpine AS runner
WORKDIR /app

# Install pnpm and Python (for ML models)
RUN apk add --no-cache python3 py3-pip && \
    npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Install Python dependencies for ML models
COPY ml_models/requirements.txt ./ml_models/
RUN pip3 install --no-cache-dir -r ml_models/requirements.txt

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Copy necessary files
COPY drizzle ./drizzle
COPY ml_models ./ml_models
COPY server/_core ./server/_core
COPY shared ./shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
