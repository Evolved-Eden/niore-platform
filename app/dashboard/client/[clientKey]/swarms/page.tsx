'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSpecialties } from '@/lib/specialties'
import { useClientView } from '@/lib/client-view'

// ── Types ─────────────────────────────────────────────────
interface SwarmTemplate {
  key: string
  swarm_key: string | null
  name: string | null
  swarm_name: string | null
  description: string | null
  agent_specialty_key: string | null
  member_agents: string[]
  is_active: boolean
  metadata: Record<string, unknown> | null
}

interface DeployedSwarm {
  id: string
  client_id: string
  swarm_id: string
  swarm_name: string
  specialty: string | null
  member_agent_ids: string[]
  configuration: Record<string, unknown> | null
  status: string
  created_at: string
  updated_at: string
}

interface DeployedAgent {
  id: string
  agent_name: string
  agent_id: string
  status: string
}

// SPECIALTIES replaced with dynamic useSpecialties() hook below

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#C6A664]/10 text-[#C6A664] border-[#C6A664]/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function ClientSwarmsPage() {
  const { targetClientId } = useClientView()
  const clientIdParam = targetClientId ? `?clientId=${encodeURIComponent(targetClientId)}` : ''

  // ── Registry ──
  const [templates, setTemplates] = useState<SwarmTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('all')

  // ── Deployed ──
  const [deployedSwarms, setDeployedSwarms] = useState<DeployedSwarm[]>([])
  const [deployedLoading, setDeployedLoading] = useState(true)

  // ── Deployed agents (for member selection) ──
  const [deployedAgents, setDeployedAgents] = useState<DeployedAgent[]>([])

  // ── UI ──
  const { specialties, loading: specialtiesLoading } = useSpecialties()
  const [tab, setTab] = useState<'available' | 'deployed'>('available')
  const [deployModal, setDeployModal] = useState<SwarmTemplate | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Deploy form ──
  const [deployForm, setDeployForm] = useState({
    swarmName: '',
    specialty: '',
    configuration: '',
    selectedAgents: [] as string[],
  })

  // ── Fetch swarm templates ──
  useEffect(() => {
    fetch('/api/admin/swarms')
      .then(r => r.json())
      .then(data => {
        setTemplates(data.swarms || [])
        setTemplatesLoading(false)
      })
      .catch(() => setTemplatesLoading(false))
  }, [])

  // ── Fetch deployed agents (for member selection) ──
  useEffect(() => {
    fetch(`/api/client/agents/deploy${clientIdParam}`)
      .then(r => r.json())
      .then(data => {
        const agents = (data.agents || []).filter((a: DeployedAgent) => a.status === 'active')
        setDeployedAgents(agents)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fetch deployed swarms ──
  const fetchDeployed = useCallback(() => {
    setDeployedLoading(true)
    fetch(`/api/client/swarms/deploy${clientIdParam}`)
      .then(r => r.json())
      .then(data => {
        setDeployedSwarms(data.swarms || [])
        setDeployedLoading(false)
      })
      .catch(() => setDeployedLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (tab === 'deployed') fetchDeployed()
  }, [tab, fetchDeployed])

  // ── Open deploy modal ──
  const openDeployModal = (swarm: SwarmTemplate) => {
    setDeployModal(swarm)
    setDeployForm({
      swarmName: swarm.swarm_name || swarm.name || swarm.key,
      specialty: swarm.agent_specialty_key || '',
      configuration: '',
      selectedAgents: [],
    })
    setDeployError('')
  }

  // ── Handle deploy ──
  const handleDeploy = async () => {
    if (!deployModal) return
    if (!deployForm.swarmName.trim()) {
      setDeployError('Team name is required')
      return
    }
    setDeploying(true)
    setDeployError('')

    let config = null
    if (deployForm.configuration.trim()) {
      try {
        config = JSON.parse(deployForm.configuration)
      } catch {
        setDeployError('Invalid JSON in configuration')
        setDeploying(false)
        return
      }
    }

    try {
      const res = await fetch('/api/client/swarms/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: targetClientId || undefined,
          swarmId: deployModal.swarm_key || deployModal.key,
          swarmName: deployForm.swarmName.trim(),
          specialty: deployForm.specialty,
          memberAgentIds: deployForm.selectedAgents,
          configuration: config,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Deployment failed')

      setDeployModal(null)
      setTab('deployed')
      fetchDeployed()
    } catch (err: any) {
      setDeployError(err.message)
    } finally {
      setDeploying(false)
    }
  }

  // ── Toggle agent selection ──
  const toggleAgent = (agentId: string) => {
    setDeployForm(prev => ({
      ...prev,
      selectedAgents: prev.selectedAgents.includes(agentId)
        ? prev.selectedAgents.filter(id => id !== agentId)
        : [...prev.selectedAgents, agentId],
    }))
  }

  // ── Swarm actions ──
  const updateSwarmStatus = async (id: string, status: string) => {
    setActionLoading(id)
    try {
      await fetch('/api/client/swarms/deploy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: targetClientId || undefined, id, status }),
      })
      fetchDeployed()
    } catch { } finally {
      setActionLoading(null)
    }
  }

  // ── Stats ──
  const totalDeployed = deployedSwarms.length
  const activeCount = deployedSwarms.filter(s => s.status === 'active').length

  // ── Filter templates ──
  const filteredTemplates = templates.filter(t => {
    const name = t.swarm_name || t.name || t.key || ''
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterSpecialty !== 'all' && t.agent_specialty_key !== filterSpecialty) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Hero ── */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Team Intelligence</h1>
        <p className="text-white/40 text-sm mt-1">
          Deploy multi-agent Teams that collaborate across your ecosystem
        </p>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-sm p-4 border border-white/[0.06]">
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Total Deployed</div>
          <div className="text-2xl font-light text-white">{totalDeployed}</div>
        </div>
        <div className="glass rounded-sm p-4 border border-white/[0.06]">
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Active</div>
          <div className="text-2xl font-light text-[#C6A664]">{activeCount}</div>
        </div>
        <div className="glass rounded-sm p-4 border border-white/[0.06]">
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Available Teams</div>
          <div className="text-2xl font-light text-[#5E8B84]">{templates.length}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('available')}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
            tab === 'available'
              ? 'bg-[#C6A664] text-black'
              : 'text-white/40 border border-white/[0.06] hover:text-white'
          }`}
        >
          Available Teams
        </button>
        <button
          onClick={() => setTab('deployed')}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
            tab === 'deployed'
              ? 'bg-[#C6A664] text-black'
              : 'text-white/40 border border-white/[0.06] hover:text-white'
          }`}
        >
          My Deployed Teams
          {totalDeployed > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-white/10 text-white text-[10px] rounded-full">
              {totalDeployed}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
         TAB 1: AVAILABLE TEAMS
         ══════════════════════════════════════════════════════ */}
      {tab === 'available' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search swarms..."
              className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30 w-60"
            />
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
            >
              <option value="all">All Specialties</option>
              {specialtiesLoading ? (
                <option value="" disabled>Loading...</option>
              ) : specialties.map(v => (
                <option key={v.key} value={v.key}>{v.name || v.key}</option>
              ))}
            </select>
          </div>

          {/* Grid */}
          {templatesLoading ? (
            <div className="text-center py-16 text-white/30 text-sm">Loading Team catalog...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm">
              {search || filterSpecialty !== 'all'
                ? 'No Teams match your filters'
                : 'No Teams available yet'
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((swarm) => {
                const name = swarm.swarm_name || swarm.name || swarm.key
                const members = Array.isArray(swarm.member_agents) ? swarm.member_agents : []
                return (
                  <div
                    key={swarm.key}
                    className="glass rounded-sm border border-white/[0.06] p-5 hover:border-white/15 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl shrink-0">🧠</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white/80 truncate">{name}</h3>
                        {swarm.agent_specialty_key && (
                          <span className="text-[10px] text-white/40">{swarm.agent_specialty_key}</span>
                        )}
                      </div>
                      <button
                        onClick={() => openDeployModal(swarm)}
                        className="px-3 py-1.5 bg-[#C6A664] text-black text-[10px] font-bold rounded-sm hover:bg-white transition-all shrink-0"
                      >
                        Deploy
                      </button>
                    </div>

                    {/* Description */}
                    {swarm.description && (
                      <p className="text-xs text-white/40 leading-relaxed mt-2 line-clamp-2">{swarm.description}</p>
                    )}

                    {/* Member agents */}
                    {members.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[10px] text-white/30 mb-1">Members ({members.length})</div>
                        <div className="flex flex-wrap gap-1">
                          {members.slice(0, 5).map((agent) => (
                            <span key={agent} className="px-1.5 py-0.5 bg-white/5 text-white/50 border border-white/10 rounded text-[10px] font-mono">
                              {agent}
                            </span>
                          ))}
                          {members.length > 5 && (
                            <span className="px-1.5 py-0.5 text-white/30 text-[10px]">+{members.length - 5}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Specialty badge */}
                    {swarm.agent_specialty_key && (
                      <div className="mt-3">
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px]">
                          {swarm.agent_specialty_key}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         TAB 2: MY DEPLOYED TEAMS
         ══════════════════════════════════════════════════════ */}
      {tab === 'deployed' && (
        <div className="space-y-4">
          {deployedLoading ? (
            <div className="text-center py-16 text-white/30 text-sm">Loading deployed Teams...</div>
          ) : deployedSwarms.length === 0 ? (
            <div className="glass rounded-sm p-10 text-center border border-white/[0.06]">
              <div className="text-4xl mb-4 opacity-30">🧠</div>
              <p className="text-white/50 text-sm">No Teams deployed yet.</p>
              <p className="text-white/30 text-xs mt-1">
                Browse available Teams to deploy your first multi-agent system.
              </p>
              <button
                onClick={() => setTab('available')}
                className="mt-4 px-5 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
              >
                Browse Teams →
              </button>

              {/* Recommendation */}
              {templates.length > 0 && (
                <div className="mt-6 p-4 bg-[#C6A664]/5 border border-[#C6A664]/10 rounded-sm inline-block">
                  <p className="text-xs text-[#C6A664]/70">
                    💡 Based on your blueprint, we recommend deploying{' '}
                    <button
                      onClick={() => {
                        const rec = templates[0]
                        openDeployModal(rec)
                      }}
                      className="underline hover:text-[#C6A664]"
                    >
                      {templates[0].swarm_name || templates[0].name || templates[0].key}
                    </button>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deployedSwarms.map((swarm) => {
                const memberIds = Array.isArray(swarm.member_agent_ids) ? swarm.member_agent_ids : []
                return (
                  <div
                    key={swarm.id}
                    className="glass rounded-sm border border-white/[0.06] p-5 hover:border-white/15 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white/80 truncate">{swarm.swarm_name}</h3>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">{swarm.swarm_id}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${STATUS_STYLES[swarm.status] || 'bg-white/5 text-white/40 border-white/10'}`}>
                        {swarm.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1 text-[10px]">
                      {swarm.specialty && (
                        <div className="flex justify-between">
                          <span className="text-white/30">Specialty</span>
                          <span className="text-white/60">{swarm.specialty}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-white/30">Members</span>
                        <span className="text-white/60">{memberIds.length} agent(s)</span>
                      </div>
                      {swarm.configuration && (
                        <div className="flex justify-between">
                          <span className="text-white/30">Config</span>
                          <span className="text-white/60">✓ Set</span>
                        </div>
                      )}
                    </div>

                    {/* Members */}
                    {memberIds.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {memberIds.slice(0, 4).map((id) => (
                            <span key={id} className="px-1.5 py-0.5 bg-white/5 text-white/50 border border-white/10 rounded text-[10px] font-mono">
                              {id}
                            </span>
                          ))}
                          {memberIds.length > 4 && (
                            <span className="px-1.5 py-0.5 text-white/30 text-[10px]">+{memberIds.length - 4}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                      {swarm.status === 'active' ? (
                        <button
                          onClick={() => updateSwarmStatus(swarm.id, 'paused')}
                          disabled={actionLoading === swarm.id}
                          className="px-2.5 py-1 text-[10px] bg-white/5 border border-white/10 rounded-sm text-white/50 hover:text-white disabled:opacity-40"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => updateSwarmStatus(swarm.id, 'active')}
                          disabled={actionLoading === swarm.id}
                          className="px-2.5 py-1 text-[10px] bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20 rounded-sm hover:bg-[#C6A664]/20 disabled:opacity-40"
                        >
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const newConfig = window.prompt('Edit swarm configuration (JSON):', 
                            swarm.configuration ? JSON.stringify(swarm.configuration, null, 2) : '{}')
                          if (newConfig !== null) {
                            fetch('/api/client/swarms/deploy', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                clientId: targetClientId || undefined,
                                id: swarm.id, 
                                configuration: newConfig 
                              }),
                            }).then(() => fetchDeployed())
                          }
                        }}
                        className="px-2.5 py-1 text-[10px] bg-white/5 border border-white/10 rounded-sm text-white/50 hover:text-white"
                      >
                        Edit Config
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Undeploy this swarm? It will be removed permanently.')) {
                            updateSwarmStatus(swarm.id, 'undeployed')
                          }
                        }}
                        disabled={actionLoading === swarm.id}
                        className="px-2.5 py-1 text-[10px] bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 hover:bg-red-500/20 disabled:opacity-40 ml-auto"
                      >
                        Undeploy
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         DEPLOY TEAM MODAL
         ══════════════════════════════════════════════════════ */}
      {deployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-sm border border-white/[0.06] p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Deploy Team</h2>
                <p className="text-xs text-white/40 mt-1">
                  Configure and deploy{' '}
                  <span className="text-[#C6A664]">
                    {deployModal.swarm_name || deployModal.name || deployModal.key}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setDeployModal(null)}
                className="text-white/30 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {/* Swarm Name */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={deployForm.swarmName}
                  onChange={(e) => setDeployForm({ ...deployForm, swarmName: e.target.value })}
                  placeholder="My Custom Team"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Specialty</label>
                <select
                  value={deployForm.specialty}
                  onChange={(e) => setDeployForm({ ...deployForm, specialty: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
                >
                  <option value="">Select Specialty</option>
                  {specialtiesLoading ? (
                    <option value="" disabled>Loading...</option>
                  ) : specialties.map(v => (
                    <option key={v.key} value={v.key}>{v.name || v.key}</option>
                  ))}
                </select>
              </div>

              {/* Member Agent Selection */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Member Agents <span className="text-white/30 font-normal">(from your deployed agents)</span>
                </label>
                {deployedAgents.length === 0 ? (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm p-4 text-center">
                    <p className="text-xs text-white/30">
                      No active agents deployed yet.{' '}
                      <button
                        onClick={() => setTab('available')}
                        className="text-[#C6A664] underline"
                      >
                        Deploy agents first
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {deployedAgents.map((agent) => (
                      <label
                        key={agent.id}
                        className="flex items-center gap-3 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-sm cursor-pointer hover:bg-white/[0.05] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={deployForm.selectedAgents.includes(agent.id)}
                          onChange={() => toggleAgent(agent.id)}
                          className="accent-[#C6A664]"
                        />
                        <span className="text-xs text-white/70">{agent.agent_name}</span>
                        <span className="text-[10px] text-white/30 font-mono ml-auto">{agent.agent_id}</span>
                      </label>
                    ))}
                  </div>
                )}
                {deployForm.selectedAgents.length > 0 && (
                  <p className="text-[10px] text-[#C6A664]/70 mt-1">
                    {deployForm.selectedAgents.length} agent(s) selected
                  </p>
                )}
              </div>

              {/* Configuration JSON */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Configuration <span className="text-white/30 font-normal">(optional JSON)</span>
                </label>
                <textarea
                  value={deployForm.configuration}
                  onChange={(e) => setDeployForm({ ...deployForm, configuration: e.target.value })}
                  placeholder='{"orchestration": "sequential", "max_iterations": 5}'
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30 resize-none font-mono text-xs"
                />
              </div>

              {/* Error */}
              {deployError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-3">
                  <p className="text-xs text-red-400">{deployError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDeploy}
                  disabled={deploying || !deployForm.swarmName.trim()}
                  className="flex-1 px-5 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {deploying ? (
                    <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Deploying...</>
                  ) : 'Deploy Team'}
                </button>
                <button
                  onClick={() => setDeployModal(null)}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/60 text-xs rounded-sm hover:bg-white/10 hover:text-white/80 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
