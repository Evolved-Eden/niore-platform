'use client'

import { useState, useEffect } from 'react'
import { useClientView } from '@/lib/client-view'

interface TierEntitlements {
  max_agents?: number | null
  max_custom_agents?: number | null
  max_specialty_agents?: number | null
  max_swarms?: number | null
  max_swarm_capacity?: number | null
  max_workflows?: number | null
  max_workflow_runs_monthly?: number | null
  max_storage_gb?: number | null
  max_api_calls_monthly?: number | null
  max_dms_per_month?: number | null
  max_emails_per_month?: number | null
  can_use_legal_addon?: boolean
  can_use_wealth_addon?: boolean
  can_use_luxury_hospitality_addon?: boolean
  can_use_creator_commerce_addon?: boolean
  can_use_custom_branding?: boolean
  can_use_analytics?: boolean
  can_use_api_access?: boolean
  can_use_white_label?: boolean
  can_use_priority_support?: boolean
  can_use_dedicated_infrastructure?: boolean
  can_use_sla?: boolean
  plan_key?: string
}

interface UsageStats {
  agents_total: number
  agents_active: number
  agents_custom: number
  agents_specialty: number
  swarms_total: number
  swarms_active: number
  swarm_members: number
}

export default function ClientEntitlementsPage() {
  const { targetClientId } = useClientView()
  const clientIdParam = targetClientId ? `?clientId=${encodeURIComponent(targetClientId)}` : ''

  const [entitlements, setEntitlements] = useState<TierEntitlements | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [planKey, setPlanKey] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/client/entitlements${clientIdParam}`).then(r => r.json()),
      fetch(`/api/client/agents/deploy${clientIdParam}`).then(r => r.json()),
      fetch(`/api/client/swarms/deploy${clientIdParam}`).then(r => r.json()),
    ])
      .then(([entRes, agentsRes, swarmsRes]) => {
        setEntitlements(entRes.entitlements)
        setPlanKey(entRes.entitlements?.plan_key ?? null)
        
        const agents = agentsRes.agents || []
        const swarms = swarmsRes.swarms || []
        
        setUsage({
          agents_total: agents.length,
          agents_active: agents.filter((a: any) => a.status === 'active').length,
          agents_custom: agents.filter((a: any) => a.role_type === 'CUSTOM').length,
          agents_specialty: agents.filter((a: any) => a.role_type === 'VERTICAL' || a.role_type === 'SPECIALTY').length,
          swarms_total: swarms.length,
          swarms_active: swarms.filter((s: any) => s.status === 'active').length,
          swarm_members: swarms.reduce((sum: number, s: any) => sum + (Array.isArray(s.member_agent_ids) ? s.member_agent_ids.length : 0), 0),
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [clientIdParam])

  const ENTITLEMENT_CONFIG = [
    { key: 'max_agents', label: 'Total Agents', usageKey: 'agents_total', icon: '🤖' },
    { key: 'max_custom_agents', label: 'Custom Agents', usageKey: 'agents_custom', icon: '✨' },
    { key: 'max_specialty_agents', label: 'Specialty Agents', usageKey: 'agents_specialty', icon: '🎯' },
    { key: 'max_swarms', label: 'Teams (Swarms)', usageKey: 'swarms_total', icon: '🧠' },
    { key: 'max_swarm_capacity', label: 'Team Member Capacity', usageKey: 'swarm_members', icon: '👥' },
    { key: 'max_workflows', label: 'Workflows', usageKey: null, icon: '⚙️' },
    { key: 'max_storage_gb', label: 'Storage (GB)', usageKey: null, icon: '💾' },
    { key: 'max_api_calls_monthly', label: 'API Calls/Month', usageKey: null, icon: '🔌' },
    { key: 'max_dms_per_month', label: 'DMs/Month', usageKey: null, icon: '💬' },
    { key: 'max_emails_per_month', label: 'Emails/Month', usageKey: null, icon: '📧' },
  ] as const

  const FEATURE_FLAGS = [
    { key: 'can_use_legal_addon', label: 'Legal Add-on' },
    { key: 'can_use_wealth_addon', label: 'Wealth Add-on' },
    { key: 'can_use_luxury_hospitality_addon', label: 'Luxury Hospitality Add-on' },
    { key: 'can_use_creator_commerce_addon', label: 'Creator Commerce Add-on' },
    { key: 'can_use_custom_branding', label: 'Custom Branding' },
    { key: 'can_use_analytics', label: 'Analytics' },
    { key: 'can_use_api_access', label: 'API Access' },
    { key: 'can_use_white_label', label: 'White Label' },
    { key: 'can_use_priority_support', label: 'Priority Support' },
    { key: 'can_use_dedicated_infrastructure', label: 'Dedicated Infrastructure' },
    { key: 'can_use_sla', label: 'SLA Guarantee' },
  ] as const

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center py-16 text-white/30 text-sm">Loading entitlements...</div>
      </div>
    )
  }

  if (!entitlements) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="glass rounded-sm p-10 text-center border border-white/[0.06]">
          <div className="text-4xl mb-4 opacity-30">📋</div>
          <h2 className="font-display text-xl font-bold text-white mb-2">No Active Plan</h2>
          <p className="text-white/40 text-sm mb-6">
            Your account doesn&apos;t have an active plan tier. Contact your administrator or upgrade to access entitlements.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ── Hero ── */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Plan Entitlements & Usage</h1>
        <p className="text-white/40 text-sm mt-1">
          View your current plan limits and usage across agents, teams, and features
        </p>
        {planKey && (
          <p className="text-white/30 text-xs mt-2 font-mono">Plan: {planKey}</p>
        )}
      </div>

      {/* ── Usage Progress Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENTITLEMENT_CONFIG.map(({ key, label, usageKey, icon }) => {
          const limit = entitlements[key as keyof TierEntitlements] as number | null | undefined
          const used = usageKey ? usage?.[usageKey as keyof UsageStats] ?? 0 : null
          const pct = limit && used !== null && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
          const atLimit = limit !== null && limit !== undefined && used !== null && used >= limit

          if (limit === null || limit === undefined) return null

          return (
            <div key={key} className="glass rounded-sm p-5 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white/80">{label}</h3>
                  <p className="text-[10px] text-white/30 tracking-widest uppercase">
                    {used !== null ? `${used} / ${limit}` : 'Unlimited'}
                  </p>
                </div>
                {atLimit && (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-medium">
                    LIMIT
                  </span>
                )}
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${atLimit ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-[#C6A664]'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Feature Flags ── */}
      <div className="glass rounded-sm p-5 border border-white/[0.06]">
        <h3 className="font-display text-lg font-bold text-white mb-4">Included Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURE_FLAGS.map(({ key, label }) => {
            const enabled = entitlements[key as keyof TierEntitlements] as boolean | undefined
            return (
              <div
                key={key}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-sm border transition-all ${
                  enabled
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white/30'
                }`}
              >
                <span className={enabled ? 'text-emerald-400' : 'text-white/20'}>
                  {enabled ? '✓' : '✕'}
                </span>
                <span className="text-sm">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Current Usage Summary ── */}
      {usage && (
        <div className="glass rounded-sm p-5 border border-white/[0.06]">
          <h3 className="font-display text-lg font-bold text-white mb-4">Current Usage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-sm p-4 text-center">
              <div className="text-2xl font-light text-white">{usage.agents_total}</div>
              <div className="text-[10px] text-white/30 tracking-widest uppercase">Total Agents</div>
            </div>
            <div className="bg-white/5 rounded-sm p-4 text-center">
              <div className="text-2xl font-light text-[#C6A664]">{usage.agents_active}</div>
              <div className="text-[10px] text-white/30 tracking-widest uppercase">Active</div>
            </div>
            <div className="bg-white/5 rounded-sm p-4 text-center">
              <div className="text-2xl font-light text-white">{usage.swarms_total}</div>
              <div className="text-[10px] text-white/30 tracking-widest uppercase">Teams</div>
            </div>
            <div className="bg-white/5 rounded-sm p-4 text-center">
              <div className="text-2xl font-light text-[#5E8B84]">{usage.swarm_members}</div>
              <div className="text-[10px] text-white/30 tracking-widest uppercase">Team Members</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}