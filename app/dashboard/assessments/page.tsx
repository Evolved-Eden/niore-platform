'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSelfClientKey } from '@/lib/client-view'

// ── Deep-dive standalone assessments (display list; the authoritative
// catalog/pricing lives in Supabase catalog_items and is resolved
// server-side by /api/stripe/create-session on checkout) ──────────────

const STANDALONE_ASSESSMENTS: Array<{
  id: string
  name: string
  amount: number
  description: string
  icon: string
  color: string
}> = [
  { id: 'essence_profile',            name: 'Essence Profile',             amount: 199, icon: '◆', color: '#C6A664', description: 'Emotional, somatic, and relational intelligence — 40 systems' },
  { id: 'rhythm_state',               name: 'Rhythm & State',              amount: 199, icon: '〰', color: '#5E8B84', description: 'Timing, cycles, somatic rhythms, and peak performance — 40 systems' },
  { id: 'alignment_purpose',          name: 'Alignment & Purpose',         amount: 149, icon: '✦', color: '#8B7AA8', description: 'Vocation, purpose, and life direction — 10 systems' },
  { id: 'momentum_execution',         name: 'Momentum & Execution',        amount: 149, icon: '➤', color: '#B5764A', description: 'Financial abundance and execution intelligence — 14 systems' },
  { id: 'connections_relationships',  name: 'Connections & Relationships', amount: 99,  icon: '❤', color: '#C9974A', description: 'Social, relational, and influence intelligence — 4 systems' },
  { id: 'evolution_intelligence',     name: 'Evolution & Intelligence',    amount: 199, icon: '∞', color: '#7A2E32', description: 'AI-enhanced learning, cognitive, and growth intelligence — 29 systems' },
]

const EXPANDED = { id: 'expanded_blueprint', name: 'Expanded Essence Assessment', amount: 150, icon: '◈', color: '#C6A664', description: 'Full whole-life scan, essence board links, and premium suggestions — 1 year' }
const ENHANCED = { id: 'enhanced_blueprint', name: 'Enhanced Essence Assessment', amount: 35, icon: '◇', color: '#5E8B84', description: 'Deeper intelligence analysis, priority insights, and cross-domain pattern recognition' }

interface Surface {
  href: string
  icon: string
  label: string
  desc: string
  color: string
  keyed: boolean // needs a clientKey prefix
}

export default function AssessmentsHub() {
  const { prefix, loading: keyLoading } = useSelfClientKey()
  const [user, setUser] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data?.user ?? null))
      .catch(() => {})
  }, [])

  async function handlePurchase(productId: string) {
    setCheckoutLoading(productId)
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [productId],
          email: user?.email,
          name: user?.user_metadata?.full_name,
        }),
      })
      const d = await res.json()
      if (d.url) window.location.href = d.url
    } catch {
      alert('Purchase failed. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const core: Surface[] = [
    { href: '/intake', icon: '◈', label: 'Blueprint Intake', desc: 'The guided assessment that powers your entire profile', color: '#C6A664', keyed: false },
    { href: `${prefix}/essence-profile`, icon: '◆', label: 'Essence Profile', desc: 'Your blueprint results, lenses, and domain modules', color: '#5E8B84', keyed: true },
    { href: `${prefix}/essence`, icon: '⊙', label: 'Essence Intelligence', desc: 'Daily intelligence board and multi-lens insights', color: '#8B7AA8', keyed: true },
    { href: `${prefix}/essence-profile/domain`, icon: '◇', label: 'Domain Modules', desc: 'Relationship, Personal, Spiritual, Lifestyle, Creativity, Legacy deep-dives', color: '#B5764A', keyed: true },
  ]

  const surfaces: Surface[] = [
    { href: `${prefix}/organization`, icon: '⊞', label: 'Organization', desc: 'Your business structure, members, and teams', color: '#C6A664', keyed: true },
    { href: `${prefix}/journal`, icon: '✎', label: 'Journal', desc: 'Reflections, moods, and personal records', color: '#5E8B84', keyed: true },
    { href: `${prefix}/workforce`, icon: '⊕', label: 'Workforce', desc: 'Deployed agents and department intelligence', color: '#8B7AA8', keyed: true },
    { href: `${prefix}/registry`, icon: '⟐', label: 'Twin Registry', desc: 'Twins, avatars, and connected profiles', color: '#B5764A', keyed: true },
    { href: `${prefix}/twin`, icon: '☿', label: 'My Twin', desc: 'Your AI twin configuration and presence', color: '#C9974A', keyed: true },
    { href: `${prefix}/vault`, icon: '▣', label: 'Vault', desc: 'Protected records and secure storage', color: '#7A2E32', keyed: true },
    { href: `${prefix}/plan`, icon: '⚖', label: 'Plan & Coverage', desc: 'Your subscription, add-ons, and entitlements', color: '#C6A664', keyed: true },
  ]

  if (keyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
          Assessments <span className="text-[#C6A664]">Hub</span>
        </h1>
        <p className="text-white/30 text-sm">Every intelligence assessment and surface in one place</p>
      </div>

      {/* Intake banner */}
      <Link
        href="/intake"
        className="relative block rounded-sm p-[2px] bg-gradient-to-r from-[#C6A664] via-white/20 to-[#C6A664] group mb-8"
      >
        <div className="bg-[#0A0A0B] rounded-[3px] p-6 h-full flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-[#C6A664] tracking-widest uppercase mb-1">Foundation</div>
            <h2 className="font-display text-lg font-semibold mb-1 text-white">Blueprint Intake</h2>
            <p className="text-sm text-white/40">Start or continue the guided assessment that unlocks your entire intelligence profile.</p>
          </div>
          <span className="px-6 py-3 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-all shrink-0">
            Start Blueprint →
          </span>
        </div>
      </Link>

      {/* Core assessments */}
      <div className="mb-10">
        <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Core Assessments</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {core.map((s) => (
            <Link
              key={s.label}
              href={s.keyed && !prefix ? '/dashboard' : s.href}
              className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all group"
            >
              <div className="flex items-start gap-4">
                <span className="text-xl mt-0.5" style={{ color: s.color }}>{s.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white mb-1 group-hover:text-[#C6A664] transition-colors">{s.label}</div>
                  <p className="text-xs text-white/40 leading-relaxed">{s.desc}</p>
                </div>
                <span className="text-white/20 group-hover:text-[#C6A664] transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Deep-dive assessments */}
      <div className="mb-10">
        <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Deep-Dive Assessments</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[EXPANDED, ...STANDALONE_ASSESSMENTS, ENHANCED].map((a) => (
            <div key={a.id} className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col">
              <div className="flex items-start gap-4 mb-3">
                <span className="text-xl" style={{ color: a.color }}>{a.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{a.name}</div>
                  <div className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5">${a.amount.toFixed(2)}</div>
                </div>
              </div>
              <p className="text-xs text-white/40 leading-relaxed flex-1">{a.description}</p>
              <button
                onClick={() => handlePurchase(a.id)}
                disabled={checkoutLoading === a.id}
                className="mt-4 w-full px-4 py-2 border border-white/10 text-white/60 text-[11px] font-bold rounded-sm hover:bg-white/[0.04] hover:text-white/80 transition-all disabled:opacity-50"
              >
                {checkoutLoading === a.id ? 'Processing...' : 'Unlock →'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence surfaces */}
      <div>
        <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Your Intelligence Surfaces</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surfaces.map((s) => (
            <Link
              key={s.label}
              href={s.keyed && !prefix ? '/dashboard' : s.href}
              className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all group"
            >
              <div className="flex items-start gap-4">
                <span className="text-lg mt-0.5" style={{ color: s.color }}>{s.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white mb-1 group-hover:text-[#C6A664] transition-colors">{s.label}</div>
                  <p className="text-xs text-white/40 leading-relaxed">{s.desc}</p>
                </div>
                <span className="text-white/20 group-hover:text-[#C6A664] transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {!prefix && (
        <div className="mt-8 glass rounded-sm p-4 text-xs text-white/40">
          Some surfaces unlock after your client profile is set up. Start with the Blueprint Intake above.
        </div>
      )}
    </div>
  )
}
