'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type BlueprintResult = {
  template_key: string
  template_name: string
  vertical_key: string
  subcategory_key: string | null
  scores: Record<string, number>
  section_scores: Record<string, { score: number; total: number }>
  recommended_agents: string[]
  recommended_swarms: string[]
  essence_template: string | null
  ris_template: string | null
  summary: string
}

export default function BlueprintResultPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [result, setResult] = useState<BlueprintResult | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auth gate
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/blueprint/result')
        return
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (checkingAuth) return
    const stored = sessionStorage.getItem('blueprintResult')
    if (!stored) {
      router.push('/blueprint/assess')
      return
    }
    setResult(JSON.parse(stored))
  }, [checkingAuth, router])

  const handleDeploy = async () => {
    if (!result) return
    setDeploying(true)
    setError(null)

    try {
      const r = await fetch('/api/blueprint/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: 'b0eebc99-9c0b-4ef8-9a01-ff0000000001', // placeholder — will use auth org later
          blueprint_template_id: result.template_key,
          vertical_key: result.vertical_key,
          subcategory_key: result.subcategory_key,
          assessment_scores: result.scores,
          assessment_answers: result.section_scores,
          selected_agents: result.recommended_agents,
          selected_swarms: result.recommended_swarms,
          blueprint_summary: result.summary,
        }),
      })
      const d = await r.json()
      if (d.error) {
        setError(d.error)
        setDeploying(false)
        return
      }
      setDeployed(true)
    } catch (err: any) {
      setError(err.message)
      setDeploying(false)
    }
  }

  if (checkingAuth || !result) return (
    <main className="min-h-screen bg-[#080810] text-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
    </main>
  )

  const domainColors: Record<string, string> = {
    maturity: '#c8ff00',
    scale: '#60a5fa',
    revenue_quality: '#34d399',
    client_experience: '#f472b6',
    tech_adoption: '#a78bfa',
    marketing_sophistication: '#fbbf24',
    sophistication: '#e879f9',
    ai_readiness: '#22d3ee',
    operational_health: '#fb923c',
    growth_velocity: '#f87171',
    service_level: '#38bdf8',
    revenue_sophistication: '#4ade80',
    breadth: '#c084fc',
    marketing: '#facc15',
    guest_tech: '#7dd3fc',
    guest_experience: '#f9a8d4',
    distribution: '#86efac',
    ambition: '#fdba74',
    service_focus: '#d8b4fe',
    challenge_focus: '#fca5a5',
  }

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {deployed ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-6">✓</div>
            <h1 className="text-3xl font-display font-bold mb-3">Blueprint Deployed</h1>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Your intelligence blueprint has been activated. Agents are being provisioned based on your assessment.
            </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-[#c8ff00] text-[#080810] rounded-xl font-medium hover:bg-[#b8ee00] transition-all"
              >
                Go to Dashboard
              </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-12">
              <div className="text-xs text-[#c8ff00] uppercase tracking-widest mb-3">
                {result.vertical_key.replace(/_/g, ' ')} Blueprint
              </div>
              <h1 className="text-3xl font-display font-bold mb-3">{result.template_name}</h1>
              <p className="text-white/50 leading-relaxed">{result.summary}</p>
            </div>

            {/* Domain Scores */}
            <section className="mb-12">
              <h2 className="text-lg font-semibold mb-6">Intelligence Scores</h2>
              <div className="space-y-4">
                {Object.entries(result.scores).map(([key, score]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-white/70 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium">{score}/100</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${score}%`,
                          backgroundColor: domainColors[key] ?? '#c8ff00',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommended Agents */}
            <section className="mb-12">
              <h2 className="text-lg font-semibold mb-4">Recommended Intelligence Agents</h2>
              <div className="flex flex-wrap gap-3">
                {result.recommended_agents.map(a => (
                  <span key={a} className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-sm text-white/70 capitalize">
                    {a.replace(/_/g, ' ')}
                  </span>
                ))}
                {result.recommended_agents.length === 0 && (
                  <p className="text-white/40 text-sm">No specific agent recommendations</p>
                )}
              </div>
            </section>

            {/* Recommended Swarms */}
            <section className="mb-12">
              <h2 className="text-lg font-semibold mb-4">Agent Swarms</h2>
              <div className="flex flex-wrap gap-3">
                {result.recommended_swarms.map(s => (
                  <span key={s} className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-sm text-white/70 capitalize">
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
                {result.recommended_swarms.length === 0 && (
                  <p className="text-white/40 text-sm">No specific swarm recommendations</p>
                )}
              </div>
            </section>

            {/* Essence & RIS */}
            {(result.essence_template || result.ris_template) && (
              <section className="mb-12">
                <h2 className="text-lg font-semibold mb-4">Intelligence Products</h2>
                <div className="flex flex-wrap gap-3">
                  {result.essence_template && (
                    <span className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/70">
                      📋 Daily Essence: {result.essence_template.replace(/_/g, ' ')}
                    </span>
                  )}
                  {result.ris_template && (
                    <span className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/70">
                      📊 RIS: {result.ris_template.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Deploy Button */}
            <div className="flex items-center gap-4 pt-8 border-t border-white/10">
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="px-8 py-3 bg-[#c8ff00] text-[#080810] rounded-xl font-medium hover:bg-[#b8ee00] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {deploying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#080810] border-t-transparent rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy Blueprint'
                )}
              </button>
              <button
                onClick={() => router.push('/blueprint/assess')}
                className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all text-sm"
              >
                Retake Assessment
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
