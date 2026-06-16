'use client'

import { Suspense, useState } from 'react'
import PlanBuilder from '@/components/demo/plan-builder'

function PersonalPricingContent() {
  const [path] = useState<'personal'>('personal')
  return <PlanBuilder path={path} />
}

export default function PricingPersonalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white/30 text-sm">Loading...</div>}>
      <PersonalPricingContent />
    </Suspense>
  )
}
