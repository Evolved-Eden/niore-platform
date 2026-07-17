'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

type Listing = {
  id: string
  title: string
  category_id: string | null
  description: string
  price_label: string
  author: string
  downloads: number
  tags: string[]
  featured: boolean
  // joined category name
  category_name?: string
}

type Twin = {
  id: string
  name: string
  title: string
  experience: string
  location: string
  skills: string[]
  available: boolean
  rating: number
}

type Tab = 'marketplace' | 'twins'

export default function IntelligenceExchangePage() {
  const [tab, setTab] = useState<Tab>('marketplace')
  const [listings, setListings] = useState<Listing[]>([])
  const [twins, setTwins] = useState<Twin[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [loadingTwins, setLoadingTwins] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('ie_listings')
      .select('*, ie_categories!category_id(name)')
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('downloads', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load listings:', error)
        } else if (data) {
          setListings(
            data.map((l: any) => ({
              ...l,
              category_name: l.ie_categories?.name ?? 'Uncategorized',
            }))
          )
        }
        setLoadingListings(false)
      })

    supabase
      .from('ie_twin_registry')
      .select('*')
      .eq('active', true)
      .order('rating', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load twins:', error)
        } else if (data) {
          setTwins(data)
        }
        setLoadingTwins(false)
      })
  }, [])

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

        {/* Marketplace */}
        {tab === 'marketplace' && (
          <section className="px-6 py-12 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              {loadingListings ? (
                <p className="text-sm text-white/40">Loading listings...</p>
              ) : (
                <p className="text-sm text-white/40">{listings.length} listings</p>
              )}
            </div>
            {loadingListings ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5E8B84] border-t-transparent" />
              </div>
            ) : (
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
            )}
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
            {loadingTwins ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5E8B84] border-t-transparent" />
              </div>
            ) : (
              <>
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
              </>
            )}
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
