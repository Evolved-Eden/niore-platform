// ── Sentry + Next.js Config ───────────────────────────────
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      // Redirect old /admin/* to /dashboard/admin/*
      { source: '/admin', destination: '/dashboard/admin', permanent: true },
      { source: '/admin/:path*', destination: '/dashboard/admin/:path*', permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig)
