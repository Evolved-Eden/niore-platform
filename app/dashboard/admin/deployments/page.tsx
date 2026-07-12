'use client'

import { useEffect, useState, useCallback } from 'react'

type CatalogAgent = { agent_id: string; name: string; tagline?: string; vertical?: string; icon?: string }
type CatalogSwarm = { swarm_key: string; name: string; description?: string; vertical_slug?: string; active_agents?: number }

export default function AdminDeploymentsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [entitlements, setEntitlements] = useState<Record<string, any>>({})

  // Agent picker state (keyed by client id)
  const [agentSearch, setAgentSearch] = useState<Record<string, string>>({})
  const [agentResults, setAgentResults] = useState<Record<string, CatalogAgent[]>>({})
  const [agentPicked, setAgentPicked] = useState<Record<string, CatalogAgent | null>>({})

  // Swarm picker state (keyed by client id)
  const [swarmSearch, setSwarmSearch] = useState<Record<string, string>>({})
  const [swarmResults, setSwarmResults] = useState<Record<string, CatalogSwarm[]>>({})
  const [swarmPicked, setSwarmPicked] = useState<Record<string, CatalogSwarm | null>>({})

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [clientsRes, agentsRes, swarmsRes] = await Promise.all([
        fetch('/api/admin/clients?limit=200'),
        fetch('/api/admin/deployments'),
        fetch('/api/admin/client-swarms'),
      ])
      const clientsData = await clientsRes.json()
      const agentsData = await agentsRes.json()
      const swarmsData = await swarmsRes.json()
      if (!clientsRes.ok) throw new Error(clientsData.error)

      const agentsByClient = new Map<string, any[]>()
      for (const c of agentsData.clients || []) agentsByClient.set(c.client.id, c.agents)
      const swarmsByClient = new Map<string, any[]>()
      for (const c of swarmsData.clients || []) swarmsByClient.set(c.client.id, c.swarms)

      // Every client shows up, even with zero deployments yet -- the old
      // version only listed clients that already had a deployment, which
      // meant there was no way to deploy a *first* agent/swarm to a new
      // client from this page at all.
      const merged = (clientsData.clients || []).map((c: any) => ({
        client: { id: c.id, full_name: c.full_name, email: c.email, plan_tier_key: c.plan_tier_key, status: c.status },
        agents: agentsByClient.get(c.id) || [],
        swarms: swarmsByClient.get(c.id) || [],
      }))
      setClients(merged)

      // Resolve each distinct plan tier's entitlement row once
      const tierKeys = [...new Set(merged.map((c: any) => c.client.plan_tier_key).filter(Boolean))]
      if (tierKeys.length > 0) {
        const entRes = await fetch(`/api/admin/entitlement-tiers?keys=${tierKeys.join(',')}`)
        if (entRes.ok) {
          const entData = await entRes.json()
          const map: Record<string, any> = {}
          for (const row of entData.tiers || []) map[row.plan_key] = row
          setEntitlements(map)
        }
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Agent search (debounced) ──
  useEffect(() => {
    const timers: any[] = []
    for (const [clientId, q] of Object.entries(agentSearch)) {
      if (!q || q.length < 2) continue
      const t = setTimeout(async () => {
        const res = await fetch(`/api/admin/agent-catalog-list?search=${encodeURIComponent(q)}&limit=8`)
        if (res.ok) {
          const d = await res.json()
          setAgentResults((prev) => ({ ...prev, [clientId]: d.agents || [] }))
        }
      }, 250)
      timers.push(t)
    }
    return () => timers.forEach(clearTimeout)
  }, [agentSearch])

  // ── Swarm search (debounced) ──
  useEffect(() => {
    const timers: any[] = []
    for (const [clientId, q] of Object.entries(swarmSearch)) {
      if (!q || q.length < 2) continue
      const t = setTimeout(async () => {
        const res = await fetch(`/api/admin/swarm-catalog-list?search=${encodeURIComponent(q)}&limit=8`)
        if (res.ok) {
          const d = await res.json()
          setSwarmResults((prev) => ({ ...prev, [clientId]: d.swarms || [] }))
        }
      }, 250)
      timers.push(t)
    }
    return () => timers.forEach(clearTimeout)
  }, [swarmSearch])

  const handleDeployAgent = async (clientId: string) => {
    const picked = agentPicked[clientId]
    if (!picked) return
    try {
      const res = await fetch('/api/admin/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_agent',
          client_id: clientId,
          agent_id: picked.agent_id,
          agent_name: picked.name,
          role_type: 'VERTICAL',
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setAgentPicked((p) => ({ ...p, [clientId]: null }))
      setAgentSearch((p) => ({ ...p, [clientId]: '' }))
      fetchAll()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleRemoveAgent = async (clientId: string, agentId: string) => {
    if (!confirm('Remove this agent from the client?')) return
    try {
      const res = await fetch('/api/admin/deployments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, agent_id: agentId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      fetchAll()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDeploySwarm = async (clientId: string) => {
    const picked = swarmPicked[clientId]
    if (!picked) return
    try {
      const res = await fetch('/api/admin/client-swarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_swarm',
          client_id: clientId,
          swarm_id: picked.swarm_key,
          swarm_name: picked.name,
          vertical: picked.vertical_slug,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setSwarmPicked((p) => ({ ...p, [clientId]: null }))
      setSwarmSearch((p) => ({ ...p, [clientId]: '' }))
      fetchAll()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleRemoveSwarm = async (clientId: string, swarmId: string) => {
    if (!confirm('Remove this swarm from the client?')) return
    try {
      const res = await fetch('/api/admin/client-swarms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, swarm_id: swarmId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      fetchAll()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Client Deployments</h1>
          <p className="text-white/40 text-sm mt-1">Manage agents and swarms deployed to client dashboards</p>
        </div>
        <button onClick={fetchAll} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-sm text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c8ff00] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {clients.length === 0 && (
            <div className="text-white/40 text-sm py-8 text-center">No clients found.</div>
          )}
          {clients.map((c: any) => {
            const cid = c.client.id
            const tier = entitlements[c.client.plan_tier_key]
            return (
              <div key={cid} className="glass rounded-sm border border-white/[0.06] overflow-hidden">
                <button
                  onClick={() => setExpandedClient(expandedClient === cid ? null : cid)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div>
                    <p className="text-white font-medium">{c.client.full_name || c.client.email}</p>
                    <p className="text-xs text-white/40">{c.client.email} · {c.client.plan_tier_key || 'no plan'} · {c.client.status}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-white/5 rounded-full px-2 py-1 text-white/40">{c.agents.length} agent{c.agents.length !== 1 ? 's' : ''}</span>
                    <span className="text-xs bg-white/5 rounded-full px-2 py-1 text-white/40">{c.swarms.length} swarm{c.swarms.length !== 1 ? 's' : ''}</span>
                    <span className="text-white/20">{expandedClient === cid ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expandedClient === cid && (
                  <div className="border-t border-white/[0.06] p-4 space-y-6">
                    {/* Entitlements summary (read-only) */}
                    <div className="bg-white/[0.02] rounded-sm px-3 py-2 text-xs text-white/50">
                      {c.client.plan_tier_key ? (
                        tier ? (
                          <span>
                            Entitlements for <span className="text-white/70">{c.client.plan_tier_key}</span>: {' '}
                            {tier.max_vertical_agents ?? 0} vertical agents, {tier.max_custom_agents ?? 0} custom agents,{' '}
                            {tier.max_swarms ?? tier.max_swarm_capacity ?? 0} swarms, {tier.max_workflows ?? 0} workflows.
                          </span>
                        ) : (
                          <span className="text-amber-400/80">
                            No entitlement tier configured for &quot;{c.client.plan_tier_key}&quot; — this plan key has no matching row
                            in tier_entitlements, so limits may not be enforced correctly.
                          </span>
                        )
                      ) : (
                        <span>No plan assigned yet.</span>
                      )}
                    </div>

                    {/* ── Agents ── */}
                    <div>
                      <p className="text-xs font-medium text-white/50 mb-2">Deployed Agents</p>
                      <div className="space-y-2">
                        {c.agents.length === 0 && <p className="text-xs text-white/30">No agents deployed yet.</p>}
                        {c.agents.map((a: any) => (
                          <div key={a.agent_id} className="flex items-center justify-between bg-white/[0.02] rounded-sm px-3 py-2">
                            <div>
                              <p className="text-sm text-white">{a.agent_name}</p>
                              <p className="text-xs text-white/40">{a.role_type} · {a.status}</p>
                            </div>
                            <button onClick={() => handleRemoveAgent(cid, a.agent_id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-white/[0.06] pt-3 mt-3 relative">
                        <p className="text-xs font-medium text-white/50 mb-2">Deploy an Agent</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            placeholder="Search the 415-agent catalog by name or vertical..."
                            value={agentSearch[cid] ?? ''}
                            onChange={(e) => { setAgentSearch((p) => ({ ...p, [cid]: e.target.value })); setAgentPicked((p) => ({ ...p, [cid]: null })) }}
                            className="flex-1 min-w-[220px] bg-white/5 border border-white/10 rounded-sm px-2 py-1.5 text-xs text-white/70 placeholder-white/30"
                          />
                          <button
                            onClick={() => handleDeployAgent(cid)}
                            disabled={!agentPicked[cid]}
                            className="px-3 py-1.5 text-xs font-medium bg-[#c8ff00] text-black rounded-sm hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Deploy {agentPicked[cid] ? `"${agentPicked[cid]!.name}"` : ''}
                          </button>
                        </div>
                        {!agentPicked[cid] && (agentResults[cid]?.length ?? 0) > 0 && (agentSearch[cid]?.length ?? 0) >= 2 && (
                          <div className="mt-1 bg-black/90 border border-white/10 rounded-sm max-h-48 overflow-y-auto">
                            {agentResults[cid].map((a) => (
                              <button
                                key={a.agent_id}
                                onClick={() => { setAgentPicked((p) => ({ ...p, [cid]: a })); setAgentSearch((p) => ({ ...p, [cid]: a.name })) }}
                                className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 flex items-center gap-2"
                              >
                                <span>{a.icon || '🔧'}</span>
                                <span>{a.name}</span>
                                <span className="text-white/30">· {a.vertical}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Swarms ── */}
                    <div>
                      <p className="text-xs font-medium text-white/50 mb-2">Deployed Swarms</p>
                      <div className="space-y-2">
                        {c.swarms.length === 0 && <p className="text-xs text-white/30">No swarms deployed yet.</p>}
                        {c.swarms.map((s: any) => (
                          <div key={s.swarm_id} className="flex items-center justify-between bg-white/[0.02] rounded-sm px-3 py-2">
                            <div>
                              <p className="text-sm text-white">{s.swarm_name}</p>
                              <p className="text-xs text-white/40">{s.vertical} · {s.status}</p>
                            </div>
                            <button onClick={() => handleRemoveSwarm(cid, s.swarm_id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-white/[0.06] pt-3 mt-3 relative">
                        <p className="text-xs font-medium text-white/50 mb-2">Deploy a Swarm</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            placeholder="Search the 38-swarm catalog by name or vertical..."
                            value={swarmSearch[cid] ?? ''}
                            onChange={(e) => { setSwarmSearch((p) => ({ ...p, [cid]: e.target.value })); setSwarmPicked((p) => ({ ...p, [cid]: null })) }}
                            className="flex-1 min-w-[220px] bg-white/5 border border-white/10 rounded-sm px-2 py-1.5 text-xs text-white/70 placeholder-white/30"
                          />
                          <button
                            onClick={() => handleDeploySwarm(cid)}
                            disabled={!swarmPicked[cid]}
                            className="px-3 py-1.5 text-xs font-medium bg-[#c8ff00] text-black rounded-sm hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Deploy {swarmPicked[cid] ? `"${swarmPicked[cid]!.name}"` : ''}
                          </button>
                        </div>
                        {!swarmPicked[cid] && (swarmResults[cid]?.length ?? 0) > 0 && (swarmSearch[cid]?.length ?? 0) >= 2 && (
                          <div className="mt-1 bg-black/90 border border-white/10 rounded-sm max-h-48 overflow-y-auto">
                            {swarmResults[cid].map((s) => (
                              <button
                                key={s.swarm_key}
                                onClick={() => { setSwarmPicked((p) => ({ ...p, [cid]: s })); setSwarmSearch((p) => ({ ...p, [cid]: s.name })) }}
                                className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 flex items-center gap-2"
                              >
                                <span>{s.name}</span>
                                <span className="text-white/30">· {s.vertical_slug} · {s.active_agents ?? 0} agents</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
