'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardBlueprintAssess() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the full assessment — results auto-save to DB on completion
    router.replace('/blueprint/assess?return=/dashboard/client/blueprint')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
