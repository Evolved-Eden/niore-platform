// ── Sentry Instrumentation ─────────────────────────────────
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
