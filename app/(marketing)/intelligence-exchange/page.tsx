'use client'

import { useState } from 'react'
import Link from 'next/link'

const MARKETPLACE_LISTINGS = [
  {
    title: 'Scheduling Agent',
    category: 'Productivity',
    price: 'Free',
    author: 'Zuri Labs',
    downloads: '2.4k',
    description: 'AI-powered calendar coordination — books, reschedules, and syncs across all platforms.',
    tags: ['calendar', 'automation', 'sync'],
  },
  {
    title: 'Lead Intelligence Pipeline',
    category: 'Sales',
    price: '$29/mo',
    author: 'GrowthOS',
    downloads: '1.8k',
    description: 'Automated lead scoring, enrichment, and qualification workflow for small sales teams.',
    tags: ['sales', 'leads', 'crm'],
  },
  {
    title: 'Content Studio',
    category: 'Creation',
    price: '$19/mo',
    author: 'CreatorOS',
    downloads: '3.1k',
    description: 'Write, schedule, and repurpose content across platforms with your brand voice.',
    tags: ['content', 'writing', 'social'],
  },
  {
    title: 'Analytics Twin',
    category: 'Data',
    price: '$49/mo',
    author: 'DataOS',
    downloads: '980',
    description: 'A natural-language analytics agent that lives in your data stack.',
    tags: ['analytics', 'sql', 'reports'],
  },
  {
    title: 'Email Orchestrator',
    category: 'Marketing',
    price: '$15/mo',
    author: 'Flow Labs',
    downloads: '4.2k',
    description: 'Multi-channel email campaigns with AI-optimized send times and A/B testing.',
    tags: ['email', 'marketing', 'automation'],
  },
  {
    title: 'Compliance Monitor',
    category: 'Operations',
    price: '$39/mo',
    author: 'SecureStack',
    downloads: '560',
    description: 'Real-time compliance checking and audit trail automation for regulated industries.',
    tags: ['compliance', 'audit', 'security'],
  },
]

const TWIN_REGISTRY_LISTINGS = [
  {
    name: 'Alex Chen',
    title: 'AI Systems Architect',
    experience: '12 years',
    location: 'Remote / SF',
    skills: ['Agent Design', 'System Architecture', 'LLM Ops'],
    available: true,
    rating: 4.9,
  },
  {
    name: 'Maria Santos',
    title: 'Creative Director & Brand Strategist',
    experience: '8 years',
    location: 'Remote / NYC',
    skills: ['Brand Voice', 'Content Strategy', 'Visual Design'],
    available: true,
    rating: 4.8,
  },
  {
    name: 'James Okafor',
    title: 'Full-Stack Builder',
    experience: '10 years',
    location: 'Remote / Lagos',
    skills: ['React', 'Node.js', 'AI Integration', 'DevOps'],
    available: false,
    rating: 4.7,
  },
  {
    name: 'Priya Kapoor',
    title: 'Data Science & Analytics Lead',
    experience: '9 years',
    location: 'Remote / London',
    skills: ['ML Ops', 'Data Pipelines', 'Analytics', 'Python'],
    available: true,
    rating: 4.9,
  },
  {
    name: 'Liam Torres',
    title: 'Product Manager — AI Products',
    experience: '7 years',
    location: 'Remote / Austin',
    skills: ['Product Strategy', 'Agile', 'User Research', 'API Design'],
    available: true,
    rating: 4.6,
  },
  {
    name: 'Zara Williams',
    title: 'Operations & Workflow Automation',
    experience: '6 years',
    location: 'Remote / Toronto',
    skills: ['Zapier', 'n8n', 'Process Design', 'Documentation'],
    available: false,
    rating: 4.5,
  },
]

type Tab = 'marketplace' | 'twins'

export default function IntelligenceExchangePage() {
  const [tab, setTab] = useState<Tab>('marketplace')

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl">
        <Link href="/" className="font-display font-bold tracking-tight text-lg">
          EVOLVED <span className="text-[#C6A664]">EDEN</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-white/50">
          <Link href="/define-intelligence" className="hover:text-white transition-colors">Define Intelligence</Link>
          <Link href="/define-os" className="hover:text-white transition-colors">Define OS</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero */}
        <section className="px-6 py-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full text-xs text-white/40 mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5E8B84] animate-pulse-slow" />
            Intelligence Exchange
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
            The Marketplace for <span className="text-[#5E8B84]">Intelligence Work</span>
          </h1>
          <p className="text-white/40 text-base max-w-xl mx-auto leading-relaxed mb-8">
            Browse agents, tools, and workflows built by the community — or list your own.
            Find the ready-made intelligence components your system needs.
          </p>
        </section>

        {/* Tabs */}
        <section className="px-6">
          <div className="max-w-6xl mx-auto border-b border-white/10">
            <div className="flex gap-0">
              <button
                onClick={() => setTab('marketplace')}
                className={`px-8 py-4 text-sm font-bold tracking-wider transition-all relative ${
                  tab === 'marketplace'
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                MARKETPLACE
                {tab === 'marketplace' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E8B84]" />
                )}
              </button>
              <button
                onClick={() => setTab('twins')}
                className={`px-8 py-4 text-sm font-bold tracking-wider transition-all relative ${
                  tab === 'twins'
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                TWIN REGISTRY
                {tab === 'twins' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E8B84]" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        {tab === 'marketplace' && (
          <section className="px-6 py-12 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm text-white/40">{MARKETPLACE_LISTINGS.length} listings</p>
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-white/10 rounded-sm text-xs text-white/60 hover:text-white transition-all">
                  Filter
                </button>
                <button className="px-4 py-2 border border-white/10 rounded-sm text-xs text-white/60 hover:text-white transition-all">
                  Sort: Popular
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MARKETPLACE_LISTINGS.map((item, i) => (
                <div key={i} className="group rounded-lg border border-white/10 bg-white/[0.025] p-6 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-white/30">{item.category}</span>
                      <h3 className="font-display text-lg font-bold mt-0.5">{item.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-[#5E8B84] whitespace-nowrap ml-4">{item.price}</span>
                  </div>
                  <p className="text-sm text-white/40 mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.tags.map((t, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/40">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/30 border-t border-white/5 pt-3 mt-auto">
                    <span>{item.author}</span>
                    <span>{item.downloads} downloads</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'twins' && (
          <section className="px-6 py-12 max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-2">Twin Registry</h2>
              <p className="text-sm text-white/40">
                Browse verified human experts available for collaboration, consulting, and partnership.
                Your Twin can connect you with the right person — or help you offer your own expertise.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TWIN_REGISTRY_LISTINGS.map((twin, i) => (
                <div key={i} className="group rounded-lg border border-white/10 bg-white/[0.025] p-6 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display text-lg font-bold">{twin.name}</h3>
                      <p className="text-sm text-white/60">{twin.title}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[#C6A664]">★</span>
                      <span className="text-white/60">{twin.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/30 mb-3">
                    <span>{twin.experience}</span>
                    <span>·</span>
                    <span>{twin.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {twin.skills.map((s, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/40">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                    <span className={`text-xs font-bold ${twin.available ? 'text-green-400/70' : 'text-white/30'}`}>
                      {twin.available ? 'Available for work' : 'Currently booked'}
                    </span>
                    <button className="text-xs text-[#5E8B84] hover:text-white transition-colors">
                      Connect →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <button className="px-8 py-3.5 border border-[#5E8B84] text-[#5E8B84] text-sm font-bold rounded-sm hover:bg-white/10 transition-all">
                Register Your Twin →
              </button>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="px-6 py-16 border-t border-white/5 text-center">
          <p className="text-white/30 text-xs tracking-widest uppercase mb-3">Exchange</p>
          <h2 className="font-display text-3xl font-bold mb-3">Ready to contribute?</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto mb-6">
            Builders can list agents, tools, and workflows. Experts register their Twin.
            The Intelligence Exchange is community-powered.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/define-intelligence" className="px-8 py-3.5 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all">
              Build Your Intelligence →
            </Link>
            <Link href="/pricing" className="px-8 py-3.5 border border-white/20 text-white font-bold text-sm rounded-sm hover:bg-white/10 transition-all">
              View Pricing
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
