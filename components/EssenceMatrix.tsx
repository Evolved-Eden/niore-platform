'use client'

import { useEffect, useState } from 'react'

// ── Types matching API response ──────────────────────────

type BlueprintInfo = {
  key: string
  name: string
  description: string | null | undefined
  system_count: number
}

type SystemInfo = {
  slug: string
  name: string
  tagline: string | null
  description: string | null
  domain_key: string
  domain_name: string | null
  lens_key: string
  system_number: number | null
}

type SystemMatrixEntry = {
  system: SystemInfo
  blueprints: string[]
  overlap_count: number
}

type DomainGroup = {
  domain_key: string
  domain_name: string | null
  system_count: number
  systems: SystemMatrixEntry[]
}

type MatrixResponse = {
  blueprints: BlueprintInfo[]
  domains: DomainGroup[]
  summary: {
    total_unique_systems: number
    total_system_mappings: number
    total_blueprints: number
    average_overlap: number
    most_shared_system: { slug: string; name: string; overlap_count: number } | null
  }
}

// ── Color palette for blueprints ─────────────────────────

const BP_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  blueprint_core:            { bg: 'bg-indigo-500/20',  text: 'text-indigo-300',  dot: 'bg-indigo-400' },
  essence_profile:           { bg: 'bg-violet-500/20',  text: 'text-violet-300',  dot: 'bg-violet-400' },
  rhythm_state:              { bg: 'bg-cyan-500/20',    text: 'text-cyan-300',    dot: 'bg-cyan-400' },
  alignment_purpose:         { bg: 'bg-amber-500/20',   text: 'text-amber-300',   dot: 'bg-amber-400' },
  momentum_execution:        { bg: 'bg-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  connections_relationships: { bg: 'bg-rose-500/20',    text: 'text-rose-300',    dot: 'bg-rose-400' },
  evolution_intelligence:    { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', dot: 'bg-fuchsia-400' },
}

// ── Helpers ─────────────────────────────────────────────

const BP_ORDER = [
  'blueprint_core',
  'essence_profile',
  'rhythm_state',
  'alignment_purpose',
  'momentum_execution',
  'connections_relationships',
  'evolution_intelligence',
]

const BP_LABELS: Record<string, string> = {
  blueprint_core: 'Core',
  essence_profile: 'Essence',
  rhythm_state: 'Rhythm',
  alignment_purpose: 'Purpose',
  momentum_execution: 'Momentum',
  connections_relationships: 'Relationships',
  evolution_intelligence: 'Evolution',
}

export default function EssenceMatrix({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<MatrixResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/essence/matrix')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load'))
      .then((d: MatrixResponse) => {
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        setError(String(e))
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400/80 text-sm">Failed to load Essence Matrix: {error}</p>
        <button onClick={onClose} className="mt-4 text-[#C6A664] text-sm hover:underline">Back to Essence Board</button>
      </div>
    )
  }

  const { blueprints, domains, summary } = data

  const toggleDomain = (key: string) => {
    setExpandedDomain(expandedDomain === key ? null : key)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Essence Matrix</h2>
          <p className="text-white/30 text-xs mt-0.5">
            Cross-blueprint system aggregation — {summary.total_unique_systems} unique systems across {summary.total_blueprints} blueprints
          </p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 text-sm px-3 py-1.5 border border-white/10 rounded-sm transition-colors">
          Back to Board
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm p-4">
          <div className="text-2xl font-bold text-white">{summary.total_unique_systems}</div>
          <div className="text-xs text-white/30 mt-1">Unique Systems</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm p-4">
          <div className="text-2xl font-bold text-white">{summary.total_system_mappings}</div>
          <div className="text-xs text-white/30 mt-1">System × Blueprint Mappings</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm p-4">
          <div className="text-2xl font-bold text-white">{summary.average_overlap}x</div>
          <div className="text-xs text-white/30 mt-1">Average Overlap</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm p-4">
          <div className="text-2xl font-bold text-white">{summary.total_blueprints}</div>
          <div className="text-xs text-white/30 mt-1">Blueprints</div>
        </div>
      </div>

      {/* Most shared system highlight */}
      {summary.most_shared_system && summary.most_shared_system.overlap_count > 1 && (
        <div className="bg-white/[0.03] border border-[#C6A664]/20 rounded-sm px-4 py-3 text-sm text-white/60">
          <span className="text-[#C6A664] font-medium">Most shared system: </span>
          {summary.most_shared_system.name} — appears in <strong>{summary.most_shared_system.overlap_count}</strong> blueprints
        </div>
      )}

      {/* Blueprint Legend */}
      <div className="flex flex-wrap gap-2">
        {BP_ORDER.filter(k => blueprints.some(b => b.key === k)).map(key => {
          const bp = blueprints.find(b => b.key === key)
          const c = BP_COLORS[key]
          return (
            <div key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs ${c.bg} ${c.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              {BP_LABELS[key] || key}
              <span className="opacity-50">({bp?.system_count})</span>
            </div>
          )
        })}
      </div>

      {/* Systems by Domain */}
      <div className="space-y-2">
        {domains.map(domain => {
          const isExpanded = expandedDomain === domain.domain_key
          const sharedCount = domain.systems.filter(s => s.overlap_count > 1).length

          return (
            <div key={domain.domain_key} className="border border-white/[0.06] rounded-sm overflow-hidden">
              {/* Domain header */}
              <button
                onClick={() => toggleDomain(domain.domain_key)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white capitalize">
                    {domain.domain_name || domain.domain_key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-white/30">{domain.system_count} systems</span>
                  {sharedCount > 0 && (
                    <span className="text-xs text-[#C6A664]/60">{sharedCount} shared</span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* System grid (visible when expanded) */}
              {isExpanded && (
                <div className="divide-y divide-white/[0.04]">
                  {domain.systems.map(entry => {
                    const sys = entry.system
                    return (
                      <div key={sys.slug} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white/80 font-medium">{sys.name}</span>
                              {entry.overlap_count > 1 && (
                                <span className="text-[10px] text-[#C6A664]/60 bg-[#C6A664]/10 px-1.5 py-0.5 rounded-sm">
                                  {entry.overlap_count}x
                                </span>
                              )}
                            </div>
                            {sys.tagline && (
                              <p className="text-xs text-white/40 mt-0.5 truncate">{sys.tagline}</p>
                            )}
                          </div>
                          {/* Blueprint dots */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {BP_ORDER.map(bpKey => {
                              const present = entry.blueprints.includes(bpKey)
                              const c = BP_COLORS[bpKey]
                              return (
                                <div
                                  key={bpKey}
                                  className={`w-3 h-3 rounded-sm ${present ? c.dot : 'bg-white/5'}`}
                                  title={present ? `${BP_LABELS[bpKey] || bpKey}` : ''}
                                />
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-white/20 pb-4">
        Blueprint columns: Core | Essence | Rhythm | Purpose | Momentum | Relationships | Evolution
      </div>
    </div>
  )
}
