'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanBuilder from '@/components/demo/plan-builder'
import { type PathType } from '@/components/demo/vertical-data'

const PATHS: PathType[] = ['client', 'creator', 'personal']

function PricingContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const pathParam = searchParams?.get('path') as PathType | null
  const defaultPath: PathType = PATHS.includes(pathParam as PathType) ? (pathParam as PathType) : 'client'
  const [path, setPath] = useState<PathType>(defaultPath)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pathParam || pathParam !== path) {
      router.replace(`${pathname}?path=${path}`, { scroll: false })
    }
  }, [path, pathname, pathParam, router])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C6A664] border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return <UpgradeContent path={path} setPath={setPath} user={user} />
  }

  return <StandardPricing path={path} setPath={setPath} pathname={pathname} />
}

function StandardPricing({ path, setPath, pathname }: { path: PathType; setPath: (p: PathType) => void; pathname: string }) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0B]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-[0.3em] mb-2">Universal Pricing</p>
            <h1 className="text-4xl font-display font-bold tracking-tight">
              Build your intelligence plan with the same demo/legal experience.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/demo"
              className="text-xs text-white/40 border border-white/10 rounded-full px-3 py-2 hover:border-white/20 hover:text-white transition-all"
            >
              Explore Demos
            </Link>
            <Link href="/"
              className="text-xs text-white/40 border border-white/10 rounded-full px-3 py-2 hover:border-white/20 hover:text-white transition-all"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] items-start">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold">A clearer pricing flow for every path.</h2>
                <p className="mt-3 text-sm text-white/40 max-w-3xl leading-relaxed">
                  This page now matches the demo/legal build-your-plan structure with a strong hero,
                  clear path selection, and the same pricing builder UI for client, creator, and personal teams.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f1118] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/30">Build Your Plan</p>
                    <h3 className="text-2xl font-semibold mt-2">Three paths, one shared pricing builder.</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/40">
                    Demo/legal plan builder style
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4">Choose your path</p>
                <div className="grid grid-cols-3 gap-2">
                  {PATHS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setPath(option)}
                      className={`rounded-full px-4 py-3 text-sm transition-all ${path === option ? 'bg-[#C6A664] text-black' : 'border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/40">
                  {path === 'client' && 'Personal and small-team intelligence systems optimized for fast deployment.'}
                  {path === 'creator' && 'Creator and studio pricing for premium workflows, content systems, and agency operations.'}
                  {path === 'personal' && 'Personal intelligence pricing for individuals, partners, and families.'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4">Why this page</p>
                <ul className="space-y-3 text-sm text-white/40">
                  <li>• Clear path selection up front.</li>
                  <li>• Same plan builder UI as demo/legal.</li>
                  <li>• Pricing flow built for plan construction and checkout.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0f1118] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/30">Plan builder</p>
              <h2 className="text-3xl font-semibold">Build your plan</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/40">
              {path} pathway
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <PlanBuilder path={path} verticalColor="#C6A664" />
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-2">Full Blueprint</p>
              <h3 className="text-xl font-semibold">Take the full blueprint multistep assessment.</h3>
              <p className="text-sm text-white/40 max-w-2xl mt-2">
                Move beyond pricing and launch the real blueprint flow that builds your twin, essence boards, business OS, and deployment intake.
              </p>
            </div>
            <Link
              href={`/intake?path=${path}`}
              className="inline-flex items-center justify-center rounded-full bg-[#C6A664] px-6 py-3 text-sm font-bold text-black hover:bg-white transition-all"
            >
              Start Your Intelligence Intake →
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

function UpgradeContent({ path, setPath, user }: { path: PathType; setPath: (p: PathType) => void; user: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [currentPlanKey, setCurrentPlanKey] = useState<string | null>(null)
  const [tiers, setTiers] = useState<any[]>([])
  const [entitlements, setEntitlements] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        // Fetch current plan
        const { data: client } = await supabase
          .from('clients')
          .select('plan_tier_key')
          .eq('id', user.id)
          .maybeSingle()
        setCurrentPlanKey(client?.plan_tier_key || null)

        // Fetch all membership tiers sorted by sort_order
        const { data: tiersData } = await supabase
          .from('membership_tiers')
          .select('*')
          .order('sort_order', { ascending: true })
          .neq('key', 'service_free')
        if (tiersData) setTiers(tiersData)

        // Fetch entitlements for all tiers
        const { data: entData } = await supabase
          .from('tier_entitlements')
          .select('*')
          if (entData) {
            const map: Record<string, any> = {}
            for (const e of entData) {
              if (e.plan_key) map[e.plan_key] = e
            }
            setEntitlements(map)
          }
      } catch {}
      setLoading(false)
    })()
  }, [user.id])

  const handleUpgrade = async (tierKey: string) => {
    setUpgrading(tierKey)
    try {
      const res = await fetch('/api/stripe/checkout-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierKey, path }),
      })
      const d = await res.json()
      if (d.url) {
        window.location.href = d.url
      } else if (d.error) {
        alert(d.error)
      }
    } catch (e: any) {
      alert(e.message)
    }
    setUpgrading(null)
  }

  const currentTier = tiers.find(t => t.key === currentPlanKey)
  const upgradeTiers = tiers.filter(t => t.key !== currentPlanKey)

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0B]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-[0.3em] mb-2">Upgrade Your Plan</p>
            <h1 className="text-4xl font-display font-bold tracking-tight">
              Unlock more intelligence power.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard"
              className="text-xs text-white/40 border border-white/10 rounded-full px-3 py-2 hover:border-white/20 hover:text-white transition-all"
            >
              Dashboard
            </Link>
            <Link href="/"
              className="text-xs text-white/40 border border-white/10 rounded-full px-3 py-2 hover:border-white/20 hover:text-white transition-all"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        {/* Current session info */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/30">Signed in as</p>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/40">
            {currentPlanKey || 'no plan'}
          </div>
        </section>

        {/* Current plan card */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C6A664] border-t-transparent" />
          </div>
        ) : (
          <>
            {currentTier && (
              <section className="rounded-3xl border border-[#C6A664]/30 bg-[#C6A664]/5 p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <span className="inline-block rounded-full bg-[#C6A664]/20 text-[#C6A664] text-xs font-bold px-3 py-1 mb-3">
                      Current Plan
                    </span>
                    <h2 className="text-3xl font-semibold">{currentTier.name}</h2>
                    <p className="text-sm text-white/40 mt-1">{currentTier.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{currentTier.price_range}</p>
                    {currentTier.billing_interval === 'month' && <p className="text-xs text-white/40">per month</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {renderFeatures(currentTier, entitlements[currentTier.key])}
                </div>
              </section>
            )}

            {!currentTier && currentPlanKey && (
              <section className="rounded-3xl border border-white/10 bg-[#0f1118] p-8">
                <p className="text-sm text-white/40">Current plan: <span className="text-white font-medium">{currentPlanKey}</span></p>
              </section>
            )}

            {/* Available upgrades */}
            <section>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-2">Available Upgrades</p>
                <h2 className="text-3xl font-semibold">Choose your next level</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upgradeTiers.map(t => {
                  const ent = entitlements[t.key]
                  const isCurrent = t.key === currentPlanKey
                  return (
                    <div
                      key={t.key}
                      className={`rounded-3xl border p-6 flex flex-col transition-all ${isCurrent ? 'border-[#C6A664]/30 bg-[#C6A664]/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                    >
                      <div className="mb-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-1">{t.category}</p>
                        <h3 className="text-xl font-bold">{t.name}</h3>
                        <p className="text-sm text-white/40 mt-1 line-clamp-2">{t.description}</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-2xl font-bold">{t.price_range}</p>
                        {t.billing_interval === 'month' && <p className="text-xs text-white/40">per month</p>}
                      </div>
                      <div className="flex-1 space-y-2 text-sm text-white/60 mb-6">
                        {renderFeatures(t, ent)}
                      </div>
                      <button
                        onClick={() => handleUpgrade(t.key)}
                        disabled={upgrading === t.key || isCurrent}
                        className="w-full rounded-full bg-[#C6A664] px-4 py-3 text-sm font-bold text-black hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {upgrading === t.key ? 'Processing...' : isCurrent ? 'Current Plan' : 'Choose Plan'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Blueprint CTA */}
            <section className="rounded-3xl border border-white/10 bg-[#0f1118] p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-2">Not sure what you need?</p>
                  <h3 className="text-xl font-semibold">Take the full blueprint assessment.</h3>
                  <p className="text-sm text-white/40 max-w-2xl mt-2">
                    Get personalized plan recommendations based on your actual needs.
                  </p>
                </div>
                <Link
                  href={`/intake?path=${path}`}
                  className="inline-flex items-center justify-center rounded-full bg-[#C6A664] px-6 py-3 text-sm font-bold text-black hover:bg-white transition-all shrink-0"
                >
                  Take the Intake →
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function renderFeatures(tier: any, ent: any) {
  const features: string[] = []
  if (!tier?.features) {
    if (ent) {
      if (ent.max_agents && ent.max_agents < 999) features.push(`${ent.max_agents} AI Agent${ent.max_agents > 1 ? 's' : ''}`)
      if (ent.max_swarms && ent.max_swarms < 999) features.push(`${ent.max_swarms} Swarm${ent.max_swarms > 1 ? 's' : ''}`)
      if (ent.max_workflow_runs_monthly && ent.max_workflow_runs_monthly < 999999) features.push(`${ent.max_workflow_runs_monthly.toLocaleString()} workflow runs/mo`)
      if (ent.can_use_analytics) features.push('Analytics')
      if (ent.can_use_api_access) features.push('API Access')
      if (ent.can_use_custom_branding) features.push('Custom Branding')
      if (ent.can_use_white_label) features.push('White Label')
      if (ent.can_use_priority_support) features.push('Priority Support')
      if (ent.can_use_dedicated_infrastructure) features.push('Dedicated Infrastructure')
      if (ent.can_use_sla) features.push('SLA')
    }
  } else if (typeof tier.features === 'object') {
    const f = tier.features as Record<string, any>
    const labels: Record<string, string> = {
      agents: 'AI Agents',
      swarms: 'Swarms',
      workflows: 'Workflows',
      api_calls: 'API Calls',
      storage: 'Storage',
      analytics: 'Analytics',
      api_access: 'API Access',
      branding: 'Custom Branding',
      white_label: 'White Label',
      priority_support: 'Priority Support',
      dedicated_infra: 'Dedicated Infrastructure',
      sla: 'SLA',
      multi_tenant: 'Multi-Tenant',
      compliance: 'Compliance',
    }
    for (const [key, label] of Object.entries(labels)) {
      if (f[key]) features.push(`${label}: ${f[key]}`)
    }
    if (f.support) features.push(`Support: ${f.support}`)
  }
  return features.map(f => <div key={f} className="flex items-center gap-2"><span className="text-[#C6A664]">✓</span>{f}</div>)
}

function PricingFallback() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C6A664] border-t-transparent" />
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingFallback />}>
      <PricingContent />
    </Suspense>
  )
}
