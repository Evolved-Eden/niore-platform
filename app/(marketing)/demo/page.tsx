'use client'

import Link from 'next/link'
import { SPECIALTY_LIST } from '@/components/demo/specialty-data'

export default function DemoHubPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">


      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full text-xs text-white/40 mb-6 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C6A664] animate-pulse-slow" />
          Explore Intelligence Demos
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-4">
          See Intelligence <span className="text-[#C6A664]">In Action</span>
        </h1>
        <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed mb-12">
          Pick a specialty below. Every demo shows the exact agents, swarms, essence board,
          and pricing for that industry — all personalized by Zuri.
        </p>

        {/* Specialty Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {SPECIALTY_LIST.map((v) => (
            <Link
              key={v.slug}
              href={`/demo/${v.slug}`}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-left hover:border-white/[0.2] hover:bg-white/[0.04] transition-all"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 transition-all group-hover:scale-110"
                style={{ backgroundColor: `${v.color}15`, color: v.color }}
              >
                {v.emoji}
              </div>
              <h3 className="font-display text-lg font-bold mb-1">{v.title}</h3>
              <p className="text-sm text-white/40 mb-3">{v.tagline}</p>
              <p className="text-xs text-white/30 line-clamp-2">{v.description}</p>
              <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: v.color }}>
                <span>{v.agents.length} agents</span>
                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                <span>1 swarm</span>
                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                <span>Essence Board</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-2xl border border-[#C6A664]/10 bg-[#C6A664]/[0.02] p-10">
          <h2 className="text-2xl font-display font-bold mb-3">Not seeing your world?</h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Every intelligence system is custom-built. Tell us what you do, and Zuri will design
            the system around your specific needs.
          </p>
          <Link
            href="/define-intelligence"
            className="inline-block px-8 py-3.5 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all glow-acid"
          >
            Define Your Intelligence
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-8 text-center text-xs text-white/20">
        Evolved Eden — Human Intelligence + Artificial Intelligence Optimization System
      </footer>
    </div>
  )
}
