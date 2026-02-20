# =============================================================================
# STAGE 1: DEPENDENCIES
# Install all Node.js dependencies (including devDependencies for TS compilation)
# =============================================================================
FROM node:20-alpine AS deps

# libc6-compat is required for Next.js to work properly on Alpine Linux
# openssl is needed by Prisma's query engine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json ./

# Install all dependencies (dev included, needed for build stage)
# --ignore-scripts prevents postinstall hooks from running prematurely
RUN npm install --ignore-scripts

# =============================================================================
# STAGE 2: BUILDER
# Generate Prisma client and build the Next.js app
# =============================================================================
FROM node:20-alpine AS builder

# OpenSSL is needed by Prisma during client generation
RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the entire project source code
COPY . .

# Dummy DATABASE_URL so that `prisma generate` and `next build` don't fail
# The real value is injected at runtime via environment variables
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# 1. Generate the Prisma client based on the schema
RUN npx prisma generate

# 2. Build the Next.js application
#    Requires `output: 'standalone'` in next.config.mjs for optimized output
RUN npm run build

# =============================================================================
# STAGE 3: RUNNER (PRODUCTION)
# Minimal image with only the files needed to run the application
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# -- System dependencies --
# OpenSSL is required by the Prisma query engine at runtime
RUN apk add --no-cache openssl

# -- Environment variables --
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3001

# -- Security: create a non-root user --
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# -- Copy public/static assets --
COPY --from=builder /app/public ./public

# -- Copy the Next.js standalone build --
# The standalone folder contains a self-sufficient server.js and minimal node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# -- Switch to non-root user --
USER nextjs

# -- Start the application --
CMD ["node", "server.js"]
