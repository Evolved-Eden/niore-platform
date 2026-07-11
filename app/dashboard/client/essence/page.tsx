'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ErrorBoundary from '@/components/ErrorBoundary'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type EssenceRow = {
  id: string
  client_id: string
  type: string
  content: string
  priority?: string | null
  status?: string | null
  created_at?: string
}

type DailyEssenceItem = {
  type: 'focus' | 'optimization' | 'timing' | 'opportunity' | 'growth' | 'brand' | 'habit' | 'action'
  content: string
  priority: 'high' | 'medium' | 'low'
}

type IntelligenceItem = {
  id: string
  client_id: string
  type: string
  content: string
  priority: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  linked_agent_id?: string | null
  linked_swarm_id?: string | null
  created_at: string
  updated_at?: string
}

type AgentData = {
  id: string
  agent_id: string
  name: string
  tagline?: string
  description?: string
  icon?: string
  color?: string
  agent_type?: string
  category?: string
}

type BlueprintInfo = {
  overallScore: number
  archetype: string
  scores: Record<string, number>
  summary: string
  exists: boolean
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  focus:        { label: 'Focus Priority',  icon: '\uD83C\uDFAF', color: '#c8ff00' },
  optimization: { label: 'Optimization',    icon: '\u26A1', color: '#00d4ff' },
  timing:       { label: 'Timing',          icon: '\uD83D\uDD50', color: '#a78bfa' },
  opportunity:  { label: 'Opportunity',     icon: '\uD83D\uDCA1', color: '#34d399' },
  growth:       { label: 'Growth',          icon: '\uD83D\uDCC8', color: '#fb923c' },
  brand:        { label: 'Brand',           icon: '\u2728', color: '#f472b6' },
  habit:        { label: 'Habit',           icon: '\uD83D\uDD04', color: '#22d3ee' },
  action:       { label: 'Action',          icon: '\u2713', color: '#e879f9' },
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ff6b6b',
  medium: '#fb923c',
  low: '#22d3ee',
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',    color: '#fb923c' },
  active:      { label: 'Active',     color: '#c8ff00' },
  running:     { label: 'Running',    color: '#00d4ff' },
  completed:   { label: 'Completed',  color: '#34d399' },
  cancelled:   { label: 'Cancelled',  color: '#ffffff40' },
}

const ACTION_TYPE_ICON: Record<string, string> = {
  agent_deploy: '\u2699\uFE0F',
  schedule: '\uD83D\uDD50',
  notify: '\uD83D\uDD14',
  report: '\uD83D\uDCCA',
  analyze: '\uD83D\uDD0D',
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

function EssenceIntelligencePage() {
  const router = useRouter()
  const supabase = createClient()

  // Auth & data
  const [user, setUser] = useState<any>(null)
  const [dailyItems, setDailyItems] = useState<DailyEssenceItem[]>([])
  const [intelItems, setIntelItems] = useState<IntelligenceItem[]>([])
  const [blueprint, setBlueprint] = useState<BlueprintInfo | null>(null)
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [dailyQuestion, setDailyQuestion] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Feed
  const [expandedFeed, setExpandedFeed] = useState(false)

  // Execute modal
  const [executingItem, setExecutingItem] = useState<DailyEssenceItem | IntelligenceItem | null>(null)
  const [modalTab, setModalTab] = useState<'review' | 'deploy'>('review')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [promptText, setPromptText] = useState('')
  const [deployLoading, setDeployLoading] = useState(false)
  const [intelFile, setIntelFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Load everything on mount ──

  useEffect(() => {
    async function load() {
      try {
        // Auth
        const { data: { user: _u } } = await supabase.auth.getUser()
        // Guaranteed non-null by root middleware
        const u = _u!
        setUser(u)

        // 0. Flush pending intake from localStorage into DB
        try {
          const pending = localStorage.getItem('intake_pending')
          if (pending) {
            const parsed = JSON.parse(pending)
            localStorage.removeItem('intake_pending')
            for (const [section, sectionData] of Object.entries(parsed)) {
              fetch('/api/intake/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, data: sectionData }),
              }).catch(() => {})
            }
          }
        } catch {}

        // 0. Fetch intake context for personalized essence
        let intakeContext = ''
        try {
          const intakeRes = await fetch('/api/intake/results')
          if (intakeRes.ok) {
            const intakeData = await intakeRes.json()
            if (intakeData.intake?.sections) {
              const s = intakeData.intake.sections
              const parts: string[] = []
              if (s.personal) parts.push(`Name: ${s.personal.name}, DOB: ${s.personal.dob}`)
              if (s.results?.blueprint) {
                const bp = s.results.blueprint
                parts.push(`Blueprint: ${bp.archetype}, Energy Type: ${bp.foundation?.energyType || ''}, Core Architecture: ${bp.foundation?.coreArch || ''}`)
                parts.push(`Natural Gift: ${bp.foundation?.naturalGift || ''}, Growth Edge: ${bp.foundation?.growthEdge || ''}`)
              }
              if (s.results?.essence) {
                const es = s.results.essence
                parts.push(`Mind Architecture: ${es.mindArchitecture || ''}, Decision Style: ${es.decisionStyle || ''}, Communication: ${es.communicationStyle || ''}`)
              }
              if (s.results?.recommendation) {
                parts.push(`Suggested Path: ${s.results.recommendation.suggestedPath}`)
              }
              if (s.role) {
                parts.push(`Role: sells to ${s.role.sellTo}, role type: ${s.role.roleType}, offers: ${s.role.offerType}`)
              }
              intakeContext = parts.join('. ')
            }
          }
        } catch {}

        // 1. Fetch daily essence
        const essenceRes = await fetch('/api/zuri/essence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: u.id, userRole: 'client', context: intakeContext }),
        })
        if (essenceRes.ok) {
          const essenceData = await essenceRes.json()
          if (essenceData.items?.length) {
            setDailyItems(essenceData.items)
          }
          if (essenceData.dailyQuestion) {
            setDailyQuestion(essenceData.dailyQuestion)
          }
        }

        // 2. Fetch stored intelligence
        const intelRes = await fetch('/api/client/essence/intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: u.id }),
        })
        if (intelRes.ok) {
          const intelData = await intelRes.json()
          if (intelData.items?.length) {
            setIntelItems(intelData.items)
          }
        }

        // 3. Fetch agents for dropdown
        try {
          const agentRes = await fetch('/api/agents')
          if (agentRes.ok) {
            const agentData = await agentRes.json()
            setAgents(agentData.agents ?? [])
          }
        } catch {
          // Agents fetch is non-critical
        }

        // 4. Fetch blueprint info from twin metadata (via API to bypass RLS)
        try {
          const twinRes = await fetch('/api/client/twin')
          if (twinRes.ok) {
            const twinData = await twinRes.json()
            const twin = twinData.twin
            if (twin) {
              const meta: any = twin.metadata || {}
              const bp = meta.blueprint
              if (bp?.core) {
                setBlueprint({
                  overallScore: bp.core.overallScore ?? 0,
                  archetype: bp.core.archetype ?? 'Custom',
                  scores: bp.core.scores ?? {},
                  summary: bp.core.summary ?? '',
                  exists: true,
                })
              } else {
                setBlueprint({ exists: false, overallScore: 0, archetype: '', scores: {}, summary: '' })
              }
            } else {
              setBlueprint({ exists: false, overallScore: 0, archetype: '', scores: {}, summary: '' })
            }
          } else {
            setBlueprint({ exists: false, overallScore: 0, archetype: '', scores: {}, summary: '' })
          }
        } catch {
          setBlueprint({ exists: false, overallScore: 0, archetype: '', scores: {}, summary: '' })
        }
      } catch (err: any) {
        console.error('Essence intelligence load error:', err)
        setError(err.message || 'Failed to load intelligence data')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Derived data ──

  const allFeedItems = [
    ...dailyItems.map((item, i) => ({ ...item, _source: 'daily' as const, _key: `daily_${i}` })),
    ...intelItems.map((item) => ({ ...item, _source: 'stored' as const, _key: item.id })),
  ]

  const activeActions = intelItems.filter(
    (item) => item.status === 'active' && item.linked_agent_id
  )

  const completedCount = intelItems.filter((item) => item.status === 'completed').length
  const pendingCount = intelItems.filter((item) => item.status === 'pending').length

  const displayed = expandedFeed ? allFeedItems : allFeedItems.slice(0, 8)

  // ── Handlers ──

  function openExecuteModal(item: DailyEssenceItem | IntelligenceItem, tab: 'review' | 'deploy' = 'review') {
    setExecutingItem(item)
    setModalTab(tab)
    setSelectedAgent('')
    setPromptText(item.content)
    setIntelFile(null)
  }

  async function handleDeploy() {
    if (!executingItem || !selectedAgent) return
    setDeployLoading(true)

    try {
      let essenceItemId: string | null = null

      // If it's a daily item (no real ID), save to intelligence table first
      const isDaily = '_source' in executingItem && (executingItem as Record<string, string>)._source === 'daily'

      if (!('id' in executingItem) || isDaily) {
        const insertRes = await (supabase
          .from('essence_intelligence')
          .insert({
            client_id: user.id,
            type: executingItem.type,
            content: promptText || executingItem.content,
            priority: executingItem.priority,
            status: 'pending',
          } as any)
          .select()
          .single()) as unknown as { data: EssenceRow | null; error: any }

        const insertError = insertRes?.error
        if (insertError) throw insertError
        essenceItemId = insertRes?.data?.id ?? null
        if (!essenceItemId) throw new Error('Failed to save essence item')
      } else {
        essenceItemId = (executingItem as IntelligenceItem).id
      }

      // Execute
      const res = await fetch('/api/client/essence/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essenceItemId,
          actionType: 'agent_deploy',
          prompt: promptText,
          agentId: selectedAgent,
        }),
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error || 'Execution failed')

      // Refresh intelligence items
      const intelRes = await fetch('/api/client/essence/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: user.id }),
      })
      if (intelRes.ok) {
        const intelData = await intelRes.json()
        setIntelItems(intelData.items ?? [])
      }

      setExecutingItem(null)
    } catch (err: any) {
      console.error('Deploy error:', err)
      alert(err.message || 'Failed to deploy agent execution')
    } finally {
      setDeployLoading(false)
    }
  }

  async function handleCancelAction(itemId: string) {
    try {
      const cancelRes = await (supabase as any)
        .from('essence_intelligence')
        .update({ status: 'cancelled' })
        .eq('id', itemId) as { error: any }
      const error = cancelRes?.error

      if (error) throw error

      setIntelItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'cancelled' as const } : item
        )
      )
    } catch (err: any) {
      console.error('Cancel action error:', err)
      alert('Failed to cancel action')
    }
  }

  // ── Render helpers ──

  function renderTypeBadge(type: string) {
    const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.action
    return (
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
        style={{ backgroundColor: `${config.color}20`, color: config.color }}
      >
        {config.label}
      </span>
    )
  }

  function renderStatusBadge(status: string) {
    const badge = STATUS_BADGE[status] ?? { label: status, color: '#ffffff40' }
    return (
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
        style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
      >
        {badge.label}
      </span>
    )
  }

  function renderPriorityDot(priority: string) {
    return (
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
        style={{ backgroundColor: PRIORITY_COLORS[priority] ?? '#22d3ee' }}
      />
    )
  }

  // ── Loading state ──

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-white/30">Loading intelligence system...</p>
        </div>
      </div>
    )
  }

  // ── Error state ──

  if (error && !dailyItems.length && !intelItems.length) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="glass rounded-sm p-8 text-center">
          <div className="text-3xl mb-4">\u26A0\uFE0F</div>
          <h2 className="text-lg font-semibold mb-2">System Error</h2>
          <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Render ──

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          Essence <span className="text-[#c8ff00]">Intelligence</span>
        </h1>
        <p className="text-white/30 text-sm">
          Your intelligence system &mdash; suggestions, actions, and agent execution
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ══════════ Main — 2/3 ══════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── A. Intelligence Feed ── */}
          <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse-slow" />
                <span className="text-xs text-[#c8ff00] tracking-widest uppercase font-medium">
                  Intelligence Feed
                </span>
                <span className="text-[10px] text-white/30">
                  ({allFeedItems.length} items)
                </span>
              </div>
              <button
                onClick={() => setExpandedFeed(!expandedFeed)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                {expandedFeed ? 'Show less' : `View all (${allFeedItems.length})`}
              </button>
            </div>

            {allFeedItems.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-white/30 mb-2">No intelligence items yet</p>
                <p className="text-xs text-white/20 max-w-sm mx-auto">
                  Run your Blueprint Assessment to activate your intelligence system,
                  then check back for daily suggestions and actionable insights.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {displayed.map((item: any) => {
                  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.action
                  const isPending = item.status === 'pending' || ('_source' in item && item._source === 'daily')
                  const isStoredWithId = 'id' in item && !String(item.id).startsWith('daily_')

                  return (
                    <div
                      key={item._key}
                      className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors animate-fade-in"
                    >
                      <div className="flex items-start gap-3">
                        {renderPriorityDot(item.priority)}

                        <div className="flex-1 min-w-0">
                          {/* Type + Status row */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {renderTypeBadge(item.type)}
                            {item.status && renderStatusBadge(item.status)}
                            {'_source' in item && item._source === 'daily' && (
                              <span className="text-[9px] text-white/20 uppercase tracking-wider">
                                Today&apos;s Suggestion
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <p className="text-sm text-white/70 mb-2.5">{item.content}</p>

                          {/* Actions row */}
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => openExecuteModal(item, 'review')}
                                  className="px-3 py-1.5 bg-white/[0.06] text-white/70 text-[10px] font-bold rounded-sm hover:bg-white/[0.1] transition-all"
                                >
                                  Review
                                </button>
                                <button
                                  onClick={() => openExecuteModal(item, 'deploy')}
                                  className="px-3 py-1.5 bg-[#c8ff00] text-black text-[10px] font-bold rounded-sm hover:bg-white transition-all"
                                >
                                  Execute as Agent
                                </button>
                              </>
                            )}
                            {isStoredWithId && item.status === 'active' && (
                              <button
                                onClick={() => handleCancelAction(item.id)}
                                className="px-3 py-1.5 border border-white/10 text-white/30 text-[10px] font-bold rounded-sm hover:border-white/30 hover:text-white/50 transition-all"
                              >
                                Cancel
                              </button>
                            )}
                            {item.linked_agent_id && (
                              <span className="text-[10px] text-white/20">
                                Agent: {item.linked_agent_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── B. Blueprint/Assessment Status ── */}
          <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <span className="text-xs text-white/30 tracking-widest uppercase">
                Blueprint &amp; Assessment Status
              </span>
            </div>
            <div className="p-5">
              {!blueprint?.exists ? (
                <div className="text-center py-4">
                  <div className="text-2xl mb-3">\u25C8</div>
                  <p className="text-sm text-white/50 mb-4 max-w-md mx-auto">
                    No blueprint assessment found. Run your assessment to unlock
                    personalized essence intelligence calibrated to your profile.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href="/intake"
                      className="px-5 py-2 border border-white/10 text-white/50 text-xs font-bold rounded-sm hover:text-white hover:border-white/30 transition-all"
                    >
                      Review Your Intake \u2190
                    </Link>
                    <Link
                      href="/dashboard/client/blueprint/assess"
                      className="px-5 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
                    >
                      Run Blueprint Assessment \u2192
                    </Link>
                  </div>
                  <p className="text-[10px] text-white/20 mt-3">
                    Already have a blueprint?{' '}
                    <Link href="/dashboard/client/blueprint" className="text-white/40 hover:text-white/60 underline">
                      View it here
                    </Link>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-white/30 tracking-widest uppercase mb-1">
                        Blueprint Score
                      </div>
                      <div className="text-2xl font-bold text-[#c8ff00]">
                        {blueprint.overallScore}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/30 tracking-widest uppercase mb-1">
                        Archetype
                      </div>
                      <div className="text-sm text-white/70">{blueprint.archetype}</div>
                    </div>
                    <div>
                      {renderStatusBadge('active')}
                    </div>
                  </div>

                  {Object.keys(blueprint.scores).length > 0 && (
                    <div className="space-y-2 mb-4">
                      {Object.entries(blueprint.scores)
                        .slice(0, 4)
                        .map(([key, score]) => (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-white/50 capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className="text-white/30">{score}/100</span>
                            </div>
                            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#c8ff00] rounded-full"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <p className="text-xs text-white/30 italic">
                    Your essence intelligence is calibrated to your blueprint profile.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── C. Active Essence Actions ── */}
          <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse-slow" />
              <span className="text-xs text-white/30 tracking-widest uppercase">
                Active Essence Actions
              </span>
              {activeActions.length > 0 && (
                <span className="text-[10px] text-white/30">
                  ({activeActions.length})
                </span>
              )}
            </div>
            <div className="p-5">
              {activeActions.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-4">
                  No active actions. Execute an essence item as an agent to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeActions.map((action) => {
                    const agent = agents.find(
                      (a) => a.agent_id === action.linked_agent_id || a.id === action.linked_agent_id
                    )
                    const actionIcon = ACTION_TYPE_ICON['agent_deploy'] ?? '\u2699\uFE0F'
                    return (
                      <div
                        key={action.id}
                        className="flex items-start gap-3 p-3 rounded-sm bg-white/[0.03] border border-white/[0.06]"
                      >
                        <span className="text-sm mt-0.5">{actionIcon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-white/70 font-medium">
                              {agent?.name ?? action.linked_agent_id ?? 'Agent'}
                            </span>
                            {renderStatusBadge(action.status)}
                          </div>
                          <p className="text-xs text-white/40 line-clamp-2 mb-2">
                            {action.content}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/20">
                              {renderTypeBadge(action.type)}
                            </span>
                            {action.status === 'active' && (
                              <button
                                onClick={() => handleCancelAction(action.id)}
                                className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ Sidebar — 1/3 ══════════ */}
        <div className="lg:col-span-1 space-y-6">
          {/* Intelligence Summary */}
          <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <span className="text-xs text-white/30 tracking-widest uppercase">
                Intelligence Summary
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Total Items</span>
                <span className="text-white/80 font-medium">{intelItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Active Actions</span>
                <span className="text-[#c8ff00] font-medium">{activeActions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Pending</span>
                <span className="text-[#fb923c] font-medium">{pendingCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Completed</span>
                <span className="text-[#34d399] font-medium">{completedCount}</span>
              </div>
            </div>
          </div>

          {/* Blueprint Link */}
          <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <span className="text-xs text-white/30 tracking-widest uppercase">
                Blueprint
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Score</span>
                <span className="text-white/80 font-medium">
                  {blueprint?.exists ? blueprint.overallScore : '\u2014'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Archetype</span>
                <span className="text-white/80">
                  {blueprint?.exists ? blueprint.archetype : '\u2014'}
                </span>
              </div>
              {blueprint?.exists && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <Link
                    href="/dashboard/client/blueprint"
                    className="text-xs text-[#c8ff00] hover:opacity-80 transition-all"
                  >
                    View Full Blueprint \u2192
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <span className="text-xs text-white/30 tracking-widest uppercase">
                Quick Actions
              </span>
            </div>
            <div className="p-5 space-y-2">
              {!blueprint?.exists ? (
                <Link
                  href="/dashboard/client/blueprint/assess"
                  className="block w-full px-4 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all text-center"
                >
                  Run Assessment
                </Link>
              ) : (
                <Link
                  href="/dashboard/client/blueprint/assess"
                  className="block w-full px-4 py-2 border border-white/10 text-white/50 text-xs font-bold rounded-sm hover:bg-white/[0.04] hover:text-white/70 transition-all text-center"
                >
                  Re-run Assessment
                </Link>
              )}
              <Link
                href="/dashboard/client/zuri"
                className="block w-full px-4 py-2 border border-white/10 text-white/50 text-xs font-bold rounded-sm hover:bg-white/[0.04] hover:text-white/70 transition-all text-center"
              >
                View Agents
              </Link>
              <Link
                href="/dashboard/client/zuri"
                className="block w-full px-4 py-2 border border-white/10 text-white/50 text-xs font-bold rounded-sm hover:bg-white/[0.04] hover:text-white/70 transition-all text-center"
              >
                Book Consultation
              </Link>
            </div>
          </div>

          {/* Daily Question */}
          <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <span className="text-xs text-white/30 tracking-widest uppercase">
                Daily Intelligence Question
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3">
                <span className="text-sm shrink-0 mt-0.5">\uD83D\uDCAD</span>
                <p className="text-sm text-white/50 italic leading-relaxed">
                  &ldquo;{dailyQuestion || "What's one decision you made today that your future self would thank you for?"}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ Execute Modal ══════════ */}
      {executingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !deployLoading && setExecutingItem(null)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm border border-white/[0.08] bg-[#080810] shadow-2xl animate-fade-in">
            {/* Close */}
            <button
              onClick={() => !deployLoading && setExecutingItem(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/70 hover:border-white/30 transition-all z-10"
              disabled={deployLoading}
            >
              \u2715
            </button>

            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-sm p-1">
                <button
                  onClick={() => setModalTab('review')}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded-sm transition-all ${
                    modalTab === 'review'
                      ? 'bg-[#c8ff00] text-black'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  \uD83D\uDCDD Review Details
                </button>
                <button
                  onClick={() => setModalTab('deploy')}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded-sm transition-all ${
                    modalTab === 'deploy'
                      ? 'bg-[#c8ff00] text-black'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  \u2699\uFE0F Deploy to Agent
                </button>
              </div>

              {modalTab === 'review' ? (
                /* ═══ REVIEW TAB ═══ */
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-lg font-bold text-white mb-1">
                      Suggestion Detail
                    </h2>
                    <p className="text-xs text-white/40">
                      Review this intelligence suggestion in full
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {renderTypeBadge(executingItem.type)}
                    {executingItem.priority && (
                      <span className="text-[10px] text-white/30">
                        Priority: <span style={{ color: PRIORITY_COLORS[executingItem.priority] }}>{executingItem.priority}</span>
                      </span>
                    )}
                    {'_source' in executingItem && (executingItem as any)._source === 'daily' && (
                      <span className="text-[10px] text-white/20">
                        Today&apos;s Suggestion
                      </span>
                    )}
                  </div>

                  {/* Full content */}
                  <div className="p-4 rounded-sm bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-sm text-white/70 leading-relaxed">{executingItem.content}</p>
                  </div>

                  {/* Context / next steps */}
                  <div className="p-4 rounded-sm bg-[#c8ff00]/[0.04] border border-[#c8ff00]/[0.1]">
                    <p className="text-xs text-white/50 leading-relaxed">
                      This suggestion is based on your current intelligence profile. You can deploy it to an agent for execution, or dismiss it if it doesn&apos;t apply right now. Suggestions refresh daily as your context evolves.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setModalTab('deploy')}
                      className="flex-1 px-5 py-2.5 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
                    >
                      Deploy to Agent \u2192
                    </button>
                    <button
                      onClick={() => setExecutingItem(null)}
                      className="px-4 py-2.5 border border-white/10 text-white/30 text-xs font-bold rounded-sm hover:text-white/50 hover:border-white/30 transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                /* ═══ DEPLOY TAB ═══ */
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-lg font-bold text-white mb-1">
                      Execute as Agent
                    </h2>
                    <p className="text-xs text-white/40">
                      Deploy this essence suggestion to an agent
                    </p>
                  </div>

                  {/* Essence Preview */}
                  <div className="p-3 rounded-sm bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-1">
                      {renderTypeBadge(executingItem.type)}
                    </div>
                    <p className="text-sm text-white/60">{executingItem.content}</p>
                  </div>

                  {/* No blueprint warning */}
                  {!blueprint?.exists && (
                    <div className="p-3 rounded-sm bg-[#fb923c]/[0.08] border border-[#fb923c]/[0.15]">
                      <p className="text-[10px] text-[#fb923c] font-medium mb-1">
                        No Blueprint Found
                      </p>
                      <p className="text-[11px] text-white/50">
                        For best results, run your Blueprint Assessment first. Agent execution will still work without it.
                      </p>
                    </div>
                  )}

                  {/* Agent Selector */}
                  <div>
                    <label className="block text-xs text-white/30 tracking-widest uppercase mb-2">
                      Agent Type
                    </label>
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40 transition-all appearance-none"
                    >
                      <option value="" disabled>
                        {agents.length > 0 ? 'Select an agent...' : 'Loading agents...'}
                      </option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.agent_id}>
                          {agent.name}{agent.tagline ? ` \u2014 ${agent.tagline}` : ''}
                        </option>
                      ))}
                    </select>
                    {agents.length === 0 && (
                      <p className="text-[10px] text-white/20 mt-1">
                        No agents registered yet. Your execution will be queued.
                      </p>
                    )}
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="block text-xs text-white/30 tracking-widest uppercase mb-2">
                      Prompt
                    </label>
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40 transition-all resize-none"
                      placeholder="Customize the prompt for the agent..."
                    />
                  </div>

                  {/* Intelligence Upload */}
                  <div>
                    <label className="block text-xs text-white/30 tracking-widest uppercase mb-2">
                      Intelligence Upload
                      <span className="text-white/20 ml-1">(optional)</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-4 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-sm text-center cursor-pointer hover:border-white/20 transition-all"
                    >
                      {intelFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-[#c8ff00]">{intelFile.name}</span>
                          <span className="text-[10px] text-white/30">
                            ({(intelFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm text-white/20 block mb-1">{'\uD83D\uDCC4'}</span>
                          <span className="text-xs text-white/30">
                            Drop a knowledge document or click to browse
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.md,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setIntelFile(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  {/* Deploy Button */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleDeploy}
                      disabled={deployLoading || !selectedAgent}
                      className="flex-1 px-5 py-2.5 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deployLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          Deploying...
                        </span>
                      ) : (
                        'Deploy to Agent'
                      )}
                    </button>
                    <button
                      onClick={() => setModalTab('review')}
                      disabled={deployLoading}
                      className="px-4 py-2.5 border border-white/10 text-white/30 text-xs font-bold rounded-sm hover:text-white/50 hover:border-white/30 transition-all disabled:opacity-40"
                    >
                      \u2190 Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WrappedEssencePage() {
  return (
    <ErrorBoundary>
      <EssenceIntelligencePage />
    </ErrorBoundary>
  )
}
