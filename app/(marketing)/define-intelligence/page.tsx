'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DefineIntelligenceFlow from '@/components/demo/define-intelligence-flow'

function DefineIntelligencePageInner() {
  const searchParams = useSearchParams()
  const pathParam = searchParams.get('path')

  const validPaths = ['client', 'creator', 'personal', 'affiliate'] as const
  const initialPath = validPaths.includes(pathParam as any)
    ? (pathParam as 'client' | 'creator' | 'personal' | 'affiliate')
    : undefined

  return <DefineIntelligenceFlow initialPath={initialPath} />
}

export default function DefineIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#080810]">
        <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DefineIntelligencePageInner />
    </Suspense>
  )
}
