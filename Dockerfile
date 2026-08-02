# ============================================================
# Coolify-ready Next.js Dockerfile — standalone output mode
# Produces ~150MB image instead of 1GB+
# ============================================================
# ---------- Dependencies ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* pnpm-workspace.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    npm install -g pnpm && pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci --only=production; \
  else \
    npm install; \
  fi

# ---------- Builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# NEXT_PUBLIC_* vars are inlined into the client bundle at BUILD time, so
# every one the code reads must be present here as a build arg. If it is
# missing, Next bakes in `undefined` and the failure only shows up at
# runtime in the browser (e.g. Stripe.js refusing to initialise).
# Keep this list in sync with:  grep -rhoE 'NEXT_PUBLIC_[A-Z0-9_]+' app components lib
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SERVICES_URL
ARG NEXT_PUBLIC_EXCHANGE_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SUPABASE_SERVICE_ROLE_KEY
ARG RESEND_API_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SERVICES_URL=$NEXT_PUBLIC_SERVICES_URL
ENV NEXT_PUBLIC_EXCHANGE_URL=$NEXT_PUBLIC_EXCHANGE_URL
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV RESEND_API_KEY=$RESEND_API_KEY

# Next 16's build runs a full separate TypeScript check phase after
# compiling. On a codebase this size, that phase needs more than Node's
# default heap (~2GB), which is what was causing
# "JavaScript heap out of memory" / SIGABRT during `npm run build` --
# not a code error, a memory ceiling. Confirmed locally: the exact same
# OOM happened running `tsc --noEmit` directly until the heap was raised.
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# ---------- Runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]