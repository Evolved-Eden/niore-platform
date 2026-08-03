'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardEssenceProfileAssess() {
  const router = useRouter()

  useEffect(() => {
    // The old standalone /blueprint/assess quiz (Round 31 finding: orphaned,
    // admin-only-linked, no real signup path reached it) has been retired.
    // The real, live assessment is /intake — results auto-save to DB on
    // completion via /api/intake/calculate.
    router.replace('/intake')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
