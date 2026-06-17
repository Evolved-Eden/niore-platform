'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type IntakeInfo = {
  hdType?: string
  archetype?: string
  profile?: string
  profileName?: string
  sunGate?: { number: number; name: string }
  geneKey?: string
  hasIntake: boolean
}

type BlueprintData = {
  overallScore: number
  archetype: string
  scores: Record<string, number>
  summary: string
  recommended_agents: string[]
  intake_role: string
}

const EXPANDED_PRICE = 150
const DOMAIN_PRICE = 50

const DOMAIN_MODULES = [
  { id: 'domain_relationship', name: 'Relationship', desc: 'Deep relationship intelligence — partnership, family, social dynamics', icon: '❤' },
  { id: 'domain_personal', name: 'Personal', desc: 'Personal development intelligence — growth, habits, self-mastery', icon: '✦' },
  { id: 'domain_spiritual', name: 'Spiritual', desc: 'Spiritual intelligence — purpose, alignment, inner wisdom', icon: '◈' },
  { id: 'domain_lifestyle', name: 'Lifestyle', desc: 'Lifestyle intelligence — environment, routines, wellness', icon: '◆' },
  { id: 'domain_creativity', name: 'Creativity', desc: 'Creative intelligence — expression, innovation, flow', icon: '◇' },
  { id: 'domain_legacy', name: 'Legacy', desc: 'Legacy intelligence — impact, contribution, long-term vision', icon: '⊙' },
]

export default function ClientBlueprintPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null)
  const [twinExists, setTwinExists] = useState(false)
  const [intake, setIntake] = useState<IntakeInfo>({ hasIntake: false })

  // Upgrade state
  const [purchasedExpanded, setPurchasedExpanded] = useState(false)
  const [purchasedDomains, setPurchasedDomains] = useState<Set<string>>(new Set())
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      setUser(u)

      // Flush pending intake from localStorage (filled before auth)
      try {
        const pending = localStorage.getItem('intake_pending')
        if (pending) {
          const parsed = JSON.parse(pending)
          localStorage.removeItem('intake_pending')
          // Save to server in background
          for (const [section, sectionData] of Object.entries(parsed)) {
            fetch('/api/intake/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ section, data: sectionData }),
            }).catch(() => {}) // silent
          }
        }
      } catch {}

      // Check intake data
      const { data: clientRec } = await supabase
        .from('clients')
        .select('metadata')
        .eq('id', u.id)
        .maybeSingle()
      if (clientRec) {
        const meta = (clientRec.metadata as Record<string, any>) ?? {}
        const intakeSections = meta.intake?.sections
        if (intakeSections?.results?.humanDesign) {
          const hd = intakeSections.results.humanDesign
          const gk = intakeSections.results.geneKeys
          setIntake({
            hasIntake: true,
            hdType: hd.type,
            archetype: hd.archetype,
            profile: hd.profile,
            profileName: hd.profileName,
            sunGate: hd.sunGate ? { number: hd.sunGate.number, name: hd.sunGate.name } : undefined,
            geneKey: gk?.primaryGeneKey,
          })
        }
      }

      // Check if twin exists → read blueprint from DB
      const { data: twin } = await supabase
        .from('client_twins')
        .select('id, metadata')
        .eq('client_id', u.id)
        .single()
      
      if (twin) {
        setTwinExists(true)
        const meta = (twin as any).metadata || {}

        // Read blueprint from DB (saved by /api/blueprint/save)
        const bp = meta.blueprint
        if (bp?.core) {
          setBlueprint({
            overallScore: bp.core.overallScore ?? 0,
            archetype: bp.core.archetype ?? 'Custom',
            scores: bp.core.scores ?? {},
            summary: bp.core.summary ?? '',
            recommended_agents: bp.core.recommended_agents ?? [],
            intake_role: bp.intake?.role ?? 'client',
          })
        } else {
          // Fallback: try sessionStorage (legacy)
          const stored = sessionStorage.getItem('blueprintResult')
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              setBlueprint({
                overallScore: parsed.scores ? Math.round(Object.values(parsed.scores).reduce((a: number, b: any) => a + b, 0) / Object.keys(parsed.scores).length) : 0,
                archetype: parsed.template_name || 'Custom',
                scores: parsed.scores || {},
                summary: parsed.summary || '',
                recommended_agents: parsed.recommended_agents || [],
                intake_role: parsed.vertical_key || 'client',
              })
            } catch {}
          }
        }

        // Check purchases in metadata
        if (meta.blueprint_expanded) setPurchasedExpanded(true)
        if (meta.purchased_domains) setPurchasedDomains(new Set(meta.purchased_domains))
      }

      setLoading(false)
    }
    load()
  }, [router])

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

  async function purchaseAllDomains() {
    const allIds = DOMAIN_MODULES.map(m => m.id)
    setCheckoutLoading('all_domains')
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: allIds,
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          My <span className="text-[#c8ff00]">Blueprint</span>
        </h1>
        <p className="text-white/30 text-sm">Your complete intelligence assessment and expansion modules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main — Blueprint Results */}
        <div className="lg:col-span-2 space-y-6">
          {!blueprint ? (
            /* No blueprint yet */
            <div className="glass rounded-sm p-8 text-center">
              <div className="text-4xl mb-4">◈</div>
              <h2 className="text-xl font-semibold mb-2">No Blueprint Yet</h2>
              <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
                Your blueprint is the foundation of your intelligence system. Take the assessment to map your identity, vision, and capabilities.
              </p>

              {/* Intake-derived profile preview */}
              {intake.hasIntake && (
                <div className="mb-6 p-4 rounded-sm bg-white/[0.03] border border-white/[0.06] text-left max-w-sm mx-auto space-y-1.5">
                  <div className="text-[10px] text-white/30 tracking-widest uppercase mb-2">From Your Intake</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Type</span>
                    <span className="text-[#c8ff00] font-medium">{intake.hdType}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Archetype</span>
                    <span className="text-white font-medium">{intake.archetype}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Profile</span>
                    <span className="text-[#a78bfa] font-medium">{intake.profile} {intake.profileName}</span>
                  </div>
                  {intake.sunGate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Sun Gate</span>
                      <span className="text-white/80">Gate {intake.sunGate.number} — {intake.sunGate.name}</span>
                    </div>
                  )}
                  {intake.geneKey && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Gene Key</span>
                      <span className="text-[#00d4ff] font-medium">{intake.geneKey}</span>
                    </div>
                  )}
                </div>
              )}

              <Link
                href="/dashboard/client/blueprint/assess"
                className="inline-block px-6 py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-all"
              >
                {intake.hasIntake ? 'Complete Full Blueprint Assessment →' : 'Start Blueprint Assessment →'}
              </Link>
            </div>
          ) : (
            <>
              {/* Score Overview */}
              <div className="glass rounded-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs text-white/30 tracking-widest uppercase">Blueprint Score</div>
                    <div className="text-4xl font-bold text-[#c8ff00] mt-1">{blueprint.overallScore}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/30 tracking-widest uppercase">Archetype</div>
                    <div className="text-sm text-white/70 mt-1">{blueprint.archetype}</div>
                  </div>
                </div>

                {/* Section scores */}
                {Object.keys(blueprint.scores).length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Dimension Scores</div>
                    {Object.entries(blueprint.scores).map(([key, score]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/60 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-white/40">{score}/100</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-[#c8ff00] rounded-full" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {blueprint.summary && (
                  <p className="text-sm text-white/50 mt-6 pt-4 border-t border-white/[0.06] leading-relaxed">
                    {blueprint.summary}
                  </p>
                )}
              </div>

              {/* Recommended Agents */}
              {blueprint.recommended_agents.length > 0 && (
                <div className="glass rounded-sm p-6">
                  <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Recommended Agents</div>
                  <div className="flex flex-wrap gap-2">
                    {blueprint.recommended_agents.map((a: string) => (
                      <span key={a} className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/60 capitalize">
                        {a.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Twin Status */}
              <div className={`glass rounded-sm p-5 border ${twinExists ? 'border-[#c8ff00]/20' : 'border-white/[0.06]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${twinExists ? 'bg-[#c8ff00] animate-pulse-slow' : 'bg-white/20'}`} />
                  <div>
                    <p className="text-sm text-white/70">
                      {twinExists ? 'Your AI Twin is active and linked to this blueprint.' : 'No AI Twin deployed yet.'}
                    </p>
                    {!twinExists && (
                      <Link href="/dashboard/client/twin" className="text-xs text-[#c8ff00] hover:underline mt-1 inline-block">
                        Configure Twin from Blueprint →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Expanded Blueprint Upgrade ── */}
          <div className={`glass rounded-sm p-6 border ${purchasedExpanded ? 'border-[#c8ff00]/30' : 'border-white/[0.06] hover:border-white/15'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">Expanded Blueprint</h3>
                  {purchasedExpanded && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c8ff00]/20 text-[#c8ff00] uppercase tracking-wider">Purchased</span>
                  )}
                </div>
                <p className="text-sm text-white/50 mb-3">
                  Unlock the complete whole-life intelligence scan — 35 additional questions across 7 life domains.
                  Includes full essence board integration and premium AI-powered suggestions for your first year.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Essence Board Links</span>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Premium Suggestions</span>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Life Intelligence Profile</span>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">23-Domain Resonance Map</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-[#c8ff00]">${EXPANDED_PRICE}</div>
                <div className="text-[10px] text-white/30">one-time</div>
              </div>
            </div>
            {!purchasedExpanded && (
              <button
                onClick={() => handlePurchase('expanded_blueprint')}
                disabled={checkoutLoading === 'expanded_blueprint'}
                className="w-full mt-4 px-5 py-2.5 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'expanded_blueprint' ? 'Processing...' : 'Purchase Expanded Blueprint'}
              </button>
            )}
          </div>

          {/* ── Domain Modules ── */}
          <div className="glass rounded-sm p-6 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Domain Intelligence Modules</h3>
                <p className="text-sm text-white/50">Add specific life-domain intelligence assessments to your blueprint. Each module unlocks 5 questions in that domain.</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[#c8ff00]">${DOMAIN_PRICE}</div>
                <div className="text-[10px] text-white/30">each</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOMAIN_MODULES.map((mod) => {
                const owned = purchasedDomains.has(mod.id)
                return (
                  <div key={mod.id} className={`rounded-sm border p-4 transition-all ${owned ? 'border-[#c8ff00]/30 bg-[#c8ff00]/05' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mod.icon}</span>
                          <h4 className="text-sm font-medium text-white/80">{mod.name}</h4>
                          {owned && <span className="text-[9px] text-[#c8ff00] font-bold">✓</span>}
                        </div>
                        <p className="text-xs text-white/40 mt-1">{mod.desc}</p>
                      </div>
                      <div className="shrink-0">
                        {!owned && (
                          <button
                            onClick={() => handlePurchase(mod.id)}
                            disabled={checkoutLoading === mod.id}
                            className="px-3 py-1.5 text-[10px] font-bold rounded-sm border border-[#c8ff00]/40 text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {checkoutLoading === mod.id ? '...' : `$${DOMAIN_PRICE}`}
                          </button>
                        )}
                        {owned && (
                          <span className="text-[10px] text-white/30 italic">Owned</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Purchase all domains */}
            {purchasedDomains.size < DOMAIN_MODULES.length && (
              <button
                onClick={purchaseAllDomains}
                disabled={checkoutLoading === 'all_domains'}
                className="w-full mt-4 px-5 py-2.5 border border-white/10 text-white/50 text-xs font-bold rounded-sm hover:bg-white/[0.04] hover:text-white/70 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'all_domains' ? 'Processing...' : `Purchase All ${DOMAIN_MODULES.length} Modules — $${DOMAIN_PRICE * DOMAIN_MODULES.length}`}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Info */}
          <div className="glass rounded-sm p-5 border border-white/[0.06]">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Blueprint Summary</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Score</span>
                <span className="text-white/80 font-medium">{blueprint?.overallScore ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Archetype</span>
                <span className="text-white/80">{blueprint?.archetype ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Domains</span>
                <span className="text-white/80">{Object.keys(blueprint?.scores ?? {}).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Expanded</span>
                <span className={purchasedExpanded ? 'text-[#c8ff00]' : 'text-white/40'}>{purchasedExpanded ? 'Active' : 'Locked'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Modules</span>
                <span className="text-white/80">{purchasedDomains.size} / {DOMAIN_MODULES.length}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="glass rounded-sm p-5 border border-white/[0.06] space-y-3">
            <Link href="/dashboard/client/twin" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              → View AI Twin
            </Link>
            <Link href="/dashboard/client/zuri" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              → Ask Zuri
            </Link>
            <Link href="/dashboard/client/blueprint/assess" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              → Re-take Assessment
            </Link>
            <Link href="/pricing" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              → Upgrade Plan
            </Link>
          </div>

          {/* Essence Teaser */}
          <div className="glass rounded-sm p-5 border border-white/[0.06]">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Essence Board</div>
            <p className="text-sm text-white/50 leading-relaxed">
              {purchasedExpanded
                ? 'Your expanded blueprint powers premium essence board suggestions — daily intelligence briefs tailored to your full life profile.'
                : 'Purchase the Expanded Blueprint to unlock essence board integration and premium daily suggestions.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
