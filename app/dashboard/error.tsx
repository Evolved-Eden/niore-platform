'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { area: 'dashboard' } })
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-widest text-red-400/80 mb-3">
          Dashboard error
        </p>
        <h2 className="text-xl font-semibold text-white mb-3">
          This section failed to load
        </h2>
        <p className="text-white/60 mb-6 text-sm">
          {error.digest ? `Reference: ${error.digest}` : 'Try reloading this page.'}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90 transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
