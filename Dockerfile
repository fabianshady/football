# =============================================================================
# STAGE 1: DEPENDENCIES
# Install all Node.js dependencies (including devDependencies for TS compilation)
# =============================================================================
FROM node:20-alpine AS deps

# libc6-compat is required for Next.js to work properly on Alpine Linux
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./

# Install all dependencies (dev included, needed for build stage)
# --ignore-scripts prevents postinstall hooks from running prematurely
RUN npm ci --ignore-scripts

# =============================================================================
# STAGE 2: BUILDER
# Build the Next.js app
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the entire project source code
COPY . .

# Supabase env vars needed at build time for Next.js to inline NEXT_PUBLIC_ values
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

# Build the Next.js application
#    Requires `output: 'standalone'` in next.config.mjs for optimized output
RUN npm run build

# =============================================================================
# STAGE 3: RUNNER (PRODUCTION)
# Minimal image with only the files needed to run the application
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

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
