# syntax=docker/dockerfile:1

# Multi-stage build producing a minimal Next.js standalone runtime image.
# NOTE: the build statically renders pages that READ Postgres (see AGENTS.md —
# "the app needs a reachable, migrated DB at build and runtime"). So the
# builder stage needs DATABASE_URL pointing at a reachable, migrated database.
# With docker-compose this is handled by building on the host network so the
# build reaches the published postgres port (see docker-compose.yml).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time configuration. DATABASE_URL must reach a migrated DB during build.
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so they
# must be provided here (not just at runtime).
ARG DATABASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_COUNTLESS_SITE
ARG NEXT_PUBLIC_COUNTLESS_SRC
ENV DATABASE_URL=$DATABASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_COUNTLESS_SITE=$NEXT_PUBLIC_COUNTLESS_SITE \
    NEXT_PUBLIC_COUNTLESS_SRC=$NEXT_PUBLIC_COUNTLESS_SRC \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Run as an unprivileged user.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
# Standalone output: server bundle + the minimal node_modules it needs.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
# Lightweight liveness check against the health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
