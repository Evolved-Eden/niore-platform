'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type BlueprintData = {
  overallScore: number
  archetype: string
  scores: Record<string, number>
  summary: string
  recommended_agents: string[]
  intake_role: string
}

export default function AdminBlueprintPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null)
  const [hasIntake, setHasIntake] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: identity } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setName(identity?.full_name ?? user.email?.split('@')[0] ?? 'Admin')

      // Load blueprint from client_twins metadata
      const { data: twin } = await supabase
        .from('client_twins')
        .select('metadata')
        .eq('client_id', user.id)
        .maybeSingle()
      if (twin) {
        const meta = (twin.metadata as Record<string, any>) ?? {}
        const bp = meta.blueprint
        if (bp?.core) {
          setBlueprint({
            overallScore: bp.core.overallScore ?? 0,
            archetype: bp.core.archetype ?? 'Integrator',
            scores: bp.core.scores ?? {},
            summary: bp.core.summary ?? '',
            recommended_agents: bp.core.recommended_agents ?? [],
            intake_role: bp.intake?.role ?? '',
          })
        }
      }

      // Check intake & fallback to intake blueprint data
      const { data: clientRec } = await supabase
        .from('clients')
        .select('metadata')
        .eq('id', user.id)
        .maybeSingle()
      const intakeMeta = clientRec?.metadata as Record<string, any> | undefined
      setHasIntake(!!intakeMeta?.intake)

      // Fallback: use intake results if twin blueprint not found
      if (!blueprint && intakeMeta?.intake?.sections?.results?.blueprint) {
        const bp = intakeMeta.intake.sections.results.blueprint
        const scores = bp.scores || {}
        setBlueprint({
          overallScore: Object.values(scores).length > 0
            ? Math.round(Object.values(scores).reduce((a: number, b: any) => a + b, 0) / Object.keys(scores).length)
            : 0,
          archetype: bp.archetype || 'Integrator',
          scores,
          summary: bp.summary || '',
          recommended_agents: [],
          intake_role: '',
        })
      }

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/20 text-sm">Loading blueprint...</div>
      </div>
    )
  }

  const topScores = blueprint?.scores
    ? Object.entries(blueprint.scores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
    : []

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          My <span className="text-[#ff6b6b]">Blueprint</span>
        </h1>
        <p className="text-white/30 text-sm">Personal intelligence archetype and profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Archetype card */}
          <div className="glass rounded-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#ff6b6b]/10 border-2 border-[#ff6b6b]/30 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-[#ff6b6b]">
                  {blueprint?.archetype?.charAt(0) ?? '?'}
                </span>
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">{blueprint?.archetype ?? 'Integrator'} Archetype</h2>
                <p className="text-sm text-white/40">{name}</p>
              </div>
            </div>

            {blueprint ? (
              <div className="px-6 py-5 space-y-4">
                {/* Score bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/40">Blueprint Score</span>
                    <span className="text-[#ff6b6b] font-bold">{blueprint.overallScore}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${blueprint.overallScore}%`, background: 'linear-gradient(90deg, #ff6b6b, #ff8e8e)' }}
                    />
                  </div>
                </div>

                {/* Top scores */}
                {topScores.length > 0 && (
                  <div>
                    <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Top Intelligences</div>
                    <div className="space-y-2">
                      {topScores.map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-white/60 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-white/40">{val}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {blueprint.summary && (
                  <div className="p-4 rounded-sm bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Summary</div>
                    <p className="text-sm text-white/60 leading-relaxed">{blueprint.summary}</p>
                  </div>
                )}

                {/* Recommended agents */}
                {blueprint.recommended_agents?.length > 0 && (
                  <div>
                    <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Recommended Agents</div>
                    <div className="flex flex-wrap gap-2">
                      {blueprint.recommended_agents.map((agentId) => (
                        <span key={agentId} className="px-3 py-1.5 text-xs rounded-sm bg-white/[0.04] border border-white/[0.08] text-white/50">
                          {agentId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 py-8 text-center space-y-4">
                <div className="text-3xl mb-3 opacity-30">◆</div>
                <p className="text-white/30 text-sm">No blueprint profile yet</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/blueprint/assess"
                    className="inline-flex px-5 py-2.5 rounded-sm text-sm font-bold bg-[#ff6b6b] text-white hover:bg-[#ff6b6b]/80 transition-colors"
                  >
                    Take Blueprint Assessment →
                  </Link>
                  {!hasIntake && (
                    <Link
                      href="/dashboard/admin/essence"
                      className="inline-flex px-4 py-2.5 rounded-sm text-sm bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
                    >
                      Start with Essence Board
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {blueprint && (
            <Link
              href="/blueprint/assess"
              className="block p-4 rounded-sm glass-hover border border-[#ff6b6b]/20 hover:border-[#ff6b6b]/40 transition-colors"
            >
              <div className="text-xs text-[#ff6b6b] tracking-widest uppercase mb-1">Re-Assess</div>
              <div className="text-sm text-white/60">Update your blueprint →</div>
            </Link>
          )}
          <Link
            href="/dashboard/admin/essence"
            className="block p-4 rounded-sm glass-hover border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          >
            <div className="text-xs text-white/30 tracking-widest uppercase mb-1">Essence</div>
            <div className="text-sm text-white/60">Daily essence board →</div>
          </Link>
          <Link
            href="/dashboard/admin/twin"
            className="block p-4 rounded-sm glass-hover border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          >
            <div className="text-xs text-white/30 tracking-widest uppercase mb-1">Twin</div>
            <div className="text-sm text-white/60">View AI twin profile →</div>
          </Link>
          <Link
            href="/dashboard/chat"
            className="block p-4 rounded-sm glass-hover border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          >
            <div className="text-xs text-white/30 tracking-widest uppercase mb-1">Zuri</div>
            <div className="text-sm text-white/60">Chat with your AI →</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
