'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

const FALLBACK_LISTINGS = [
  { id: '1', title: 'Scheduling Agent', category_name: 'Productivity', description: 'AI-powered calendar coordination — books, reschedules, and syncs across all platforms.', price_label: 'Free', author: 'Zuri Labs', downloads: 2400, tags: ['calendar', 'automation', 'sync'], featured: true },
  { id: '2', title: 'Lead Intelligence Pipeline', category_name: 'Sales', description: 'Automated lead scoring, enrichment, and qualification workflow for small sales teams.', price_label: '$29/mo', author: 'GrowthOS', downloads: 1800, tags: ['sales', 'leads', 'crm'], featured: true },
  { id: '3', title: 'Content Studio', category_name: 'Creation', description: 'Write, schedule, and repurpose content across platforms with your brand voice.', price_label: '$19/mo', author: 'CreatorOS', downloads: 3100, tags: ['content', 'writing', 'social'], featured: true },
  { id: '4', title: 'Analytics Twin', category_name: 'Data', description: 'A natural-language analytics agent that lives in your data stack.', price_label: '$49/mo', author: 'DataOS', downloads: 980, tags: ['analytics', 'sql', 'reports'], featured: false },
  { id: '5', title: 'Email Orchestrator', category_name: 'Marketing', description: 'Multi-channel email campaigns with AI-optimized send times and A/B testing.', price_label: '$15/mo', author: 'Flow Labs', downloads: 4200, tags: ['email', 'marketing', 'automation'], featured: true },
  { id: '6', title: 'Compliance Monitor', category_name: 'Operations', description: 'Real-time compliance checking and audit trail automation for regulated industries.', price_label: '$39/mo', author: 'SecureStack', downloads: 560, tags: ['compliance', 'audit', 'security'], featured: false },
]

const FALLBACK_TWINS = [
  { id: '1', name: 'Alex Chen', title: 'AI Systems Architect', experience: '12 years', location: 'Remote / SF', skills: ['Agent Design', 'System Architecture', 'LLM Ops'], available: true, rating: 4.9 },
  { id: '2', name: 'Maria Santos', title: 'Creative Director & Brand Strategist', experience: '8 years', location: 'Remote / NYC', skills: ['Brand Voice', 'Content Strategy', 'Visual Design'], available: true, rating: 4.8 },
  { id: '3', name: 'James Okafor', title: 'Full-Stack Builder', experience: '10 years', location: 'Remote / Lagos', skills: ['React', 'Node.js', 'AI Integration', 'DevOps'], available: false, rating: 4.7 },
  { id: '4', name: 'Priya Kapoor', title: 'Data Science & Analytics Lead', experience: '9 years', location: 'Remote / London', skills: ['ML Ops', 'Data Pipelines', 'Analytics', 'Python'], available: true, rating: 4.9 },
  { id: '5', name: 'Liam Torres', title: 'Product Manager — AI Products', experience: '7 years', location: 'Remote / Austin', skills: ['Product Strategy', 'Agile', 'User Research', 'API Design'], available: true, rating: 4.6 },
  { id: '6', name: 'Zara Williams', title: 'Operations & Workflow Automation', experience: '6 years', location: 'Remote / Toronto', skills: ['Zapier', 'n8n', 'Process Design', 'Documentation'], available: false, rating: 4.5 },
]

type Tab = 'marketplace' | 'twins'

export default function IntelligenceExchangePage() {
  const [tab, setTab] = useState<Tab>('marketplace')
  const [listings, setListings] = useState(FALLBACK_LISTINGS)
  const [twins, setTwins] = useState(FALLBACK_TWINS)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('ie_listings')
      .select('*, ie_categories!category_id(name)')
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('downloads', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setListings(
            data.map((l: any) => ({
              ...l,
              category_name: l.ie_categories?.name ?? 'Uncategorized',
            }))
          )
        }
      })

    supabase
      .from('ie_twin_registry')
      .select('*')
      .eq('active', true)
      .order('rating', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setTwins(data)
        }
      })
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <main>
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

        {/* Marketplace */}
        {tab === 'marketplace' && (
          <section className="px-6 py-12 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm text-white/40">{listings.length} listings</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((item) => (
                <div key={item.id} className="group rounded-lg border border-white/10 bg-white/[0.025] p-6 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-white/30">{item.category_name}</span>
                      <h3 className="font-display text-lg font-bold mt-0.5">{item.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-[#5E8B84] whitespace-nowrap ml-4">{item.price_label}</span>
                  </div>
                  <p className="text-sm text-white/40 mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.tags?.map((t, j) => (
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

        {/* Twin Registry */}
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
              {twins.map((twin) => (
                <div key={twin.id} className="group rounded-lg border border-white/10 bg-white/[0.025] p-6 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer">
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
                    {twin.skills?.map((s, j) => (
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
            Creators can list agents, tools, and workflows. Experts register their Twin.
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
