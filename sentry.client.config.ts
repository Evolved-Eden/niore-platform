// ── Sentry Client-Side Configuration ──────────────────────
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for
    // performance monitoring. We recommend adjusting this value in production.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
    // Enable Spotlight for local debugging
    spotlight: process.env.NODE_ENV === 'development',
  })
}
