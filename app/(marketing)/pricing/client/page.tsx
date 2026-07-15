'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import PlanBuilder from '@/components/demo/plan-builder'

function PricingClientPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0B]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-[0.3em] mb-2">Client Pricing</p>
            <h1 className="text-4xl font-display font-bold tracking-tight">
              Client intelligence plans — solo to enterprise.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/pricing" className="text-xs text-white/40 border border-white/10 rounded-full px-3 py-2 hover:border-white/20 hover:text-white transition-all">
              All Pricing
            </Link>
            <Link href="/demo" className="text-xs text-white/40 border border-white/10 rounded-full px-3 py-2 hover:border-white/20 hover:text-white transition-all">
              Explore Demos
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <section className="rounded-3xl border border-white/10 bg-[#0f1118] p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/30">Plan builder</p>
              <h2 className="text-3xl font-semibold">Client plans</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/40">client pathway</span>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <PlanBuilder path="client" verticalColor="#C6A664" />
          </div>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-2">Full Blueprint</p>
              <h3 className="text-xl font-semibold">Take the full blueprint multistep assessment.</h3>
              <p className="text-sm text-white/40 max-w-2xl mt-2">
                Move beyond pricing and launch the real blueprint flow that builds your twin, essence boards, business OS, and deployment intake.
              </p>
            </div>
            <Link href="/intake?path=client" className="inline-flex items-center justify-center rounded-full bg-[#C6A664] px-6 py-3 text-sm font-bold text-black hover:bg-white transition-all">
              Start Full Blueprint Assessment →
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B]" />}><PricingClientPage /></Suspense>
}
