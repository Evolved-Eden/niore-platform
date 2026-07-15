'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FAQ_CATEGORIES, searchFaq, type FaqItem } from '@/lib/faq-data'

function ChatHomePage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    return searchFaq(search)
  }, [search])

  const displayedCategories = useMemo(() => {
    if (activeCategory) {
      return FAQ_CATEGORIES.filter(c => c.id === activeCategory)
    }
    return FAQ_CATEGORIES
  }, [activeCategory])

  function toggleQuestion(q: string) {
    setExpandedQuestion(expandedQuestion === q ? null : q)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0A0A0B]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Image src="/logo.JPG" alt="Evolved Eden" width={100} height={22} className="object-contain" />
          <span className="text-xs text-white/40 ml-1">Knowledge Base</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/chat/demo-frontdesk"
            className="px-4 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
          >
            Talk to Zuri
          </Link>
          <Link href="/pricing" className="text-xs text-white/40 hover:text-white transition-colors">
            Pricing
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold tracking-tight mb-3">
              How can we <span className="text-[#C6A664]">help</span>?
            </h1>
            <p className="text-white/40 max-w-xl mx-auto">
              Browse our knowledge base or ask Zuri directly in the chat.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-10">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search the knowledge base..."
              className="w-full pl-12 pr-4 py-4 bg-white/[0.04] border border-white/10 rounded-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/50 transition-all text-sm"
            />
          </div>

          {/* Search results */}
          {searchResults !== null && (
            <div className="mb-12">
              <p className="text-xs text-white/30 mb-4">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
              </p>
              {searchResults.length === 0 ? (
                <div className="text-center py-12 border border-white/10 rounded-sm bg-white/[0.02]">
                  <div className="text-3xl mb-3">◈</div>
                  <p className="text-white/40 text-sm mb-2">No results found</p>
                  <p className="text-xs text-white/20">Try different keywords or ask Zuri</p>
                  <Link
                    href="/chat/demo-frontdesk"
                    className="inline-block mt-4 px-5 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
                  >
                    Ask Zuri →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((item, i) => (
                    <FaqCard key={i} item={item} isOpen={expandedQuestion === item.q} onToggle={() => toggleQuestion(item.q)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category chips (when not searching) */}
          {searchResults === null && (
            <div className="flex flex-wrap gap-2 mb-10">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  activeCategory === null
                    ? 'bg-[#C6A664] text-black'
                    : 'border border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                }`}
              >
                All
              </button>
              {FAQ_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[#C6A664] text-black'
                      : 'border border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* FAQ accordion */}
          {searchResults === null && (
            <div className="space-y-8">
              {displayedCategories.map(cat => (
                <div key={cat.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-lg">{cat.icon}</div>
                    <div>
                      <h2 className="text-lg font-semibold">{cat.label}</h2>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cat.questions.map((item, i) => (
                      <FaqCard
                        key={i}
                        item={item}
                        isOpen={expandedQuestion === item.q}
                        onToggle={() => toggleQuestion(item.q)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center border-t border-white/10 pt-12">
            <p className="text-white/40 text-sm mb-4">Still have questions?</p>
            <Link
              href="/chat/demo-frontdesk"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A664] text-black font-bold rounded-sm hover:bg-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Talk to Zuri — Your Intelligence Architect
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function FaqCard({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-white/[0.08] rounded-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-medium text-white/80 pr-4">{item.q}</span>
        <svg
          className={`w-4 h-4 text-white/30 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-4">
          <div className="text-sm text-white/50 leading-relaxed border-t border-white/[0.06] pt-4 whitespace-pre-line">
            {item.a}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return <ChatHomePage />
}
