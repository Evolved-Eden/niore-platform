// ── Sentry + Next.js Config ───────────────────────────────
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // The /admin -> /dashboard/admin redirect used to be duplicated here AND
  // in proxy.ts. proxy.ts runs before Next.js's config-level redirects, so
  // this block never actually fired for /admin paths -- removed to keep the
  // redirect logic in exactly one place (see proxy.ts).
};

export default withSentryConfig(nextConfig)
