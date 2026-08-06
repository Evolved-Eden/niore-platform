'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useVerticals } from '@/lib/verticals'
import { useClientView } from '@/lib/client-view'

// ── Types ─────────────────────────────────────────────────
interface RegistryAgent {
  id: string
  agent_id: string
  name: string
  tagline: string | null
  description: string | null
  icon: string | null
  capabilities: string[] | null
  agent_type: string | null
  category: string | null
  is_active: boolean
  deployed: boolean
}

interface DeployedAgent {
  id: string
  client_id: string
  agent_id: string
  agent_name: string
  role_type: string | null
  vertical: string | null
  prompt: string | null
  intelligence_docs: Record<string, unknown>[] | null
  profile_image: string | null
  status: string
  created_at: string
  updated_at: string
}

interface UploadedFile {
  name: string
  size: number
  type: string
}

// VERTICALS replaced with dynamic useVerticals() hook below

const ROLE_TYPES = [
  'CORE', 'VERTICAL', 'BRIDGE', 'CROSS_SYSTEM', 'UTILITY', 'CRISIS',
]

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#C6A664]/10 text-[#C6A664] border-[#C6A664]/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function ClientAgentsPage() {
  const { targetClientId } = useClientView()
  const clientIdParam = targetClientId ? `?clientId=${encodeURIComponent(targetClientId)}` : ''

  // ── Registry ──
  const [registryAgents, setRegistryAgents] = useState<RegistryAgent[]>([])
  const [registryLoading, setRegistryLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVertical, setFilterVertical] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const { verticals, loading: verticalsLoading } = useVerticals()

  // ── Deployed ──
  const [deployedAgents, setDeployedAgents] = useState<DeployedAgent[]>([])
  const [deployedLoading, setDeployedLoading] = useState(true)

  // ── UI ──
  const [tab, setTab] = useState<'available' | 'deployed'>('available')
  const [deployModal, setDeployModal] = useState<RegistryAgent | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Deploy form ──
  const [deployForm, setDeployForm] = useState({
    agentName: '',
    roleType: '',
    vertical: '',
    prompt: '',
    profileImage: '',
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Fetch registry agents ──
  useEffect(() => {
    fetch(`/api/client/agents/catalog${clientIdParam}`)
      .then(r => r.json())
      .then(data => {
        setRegistryAgents(data.agents || [])
        setRegistryLoading(false)
      })
      .catch(() => setRegistryLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fetch deployed agents ──
  const fetchDeployed = useCallback(() => {
    setDeployedLoading(true)
    fetch(`/api/client/agents/deploy${clientIdParam}`)
      .then(r => r.json())
      .then(data => {
        setDeployedAgents(data.agents || [])
        setDeployedLoading(false)
      })
      .catch(() => setDeployedLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (tab === 'deployed') fetchDeployed()
  }, [tab, fetchDeployed])

  // ── Open deploy modal ──
  const openDeployModal = (agent: RegistryAgent) => {
    setDeployModal(agent)
    setDeployForm({
      agentName: agent.name,
      roleType: agent.agent_type || '',
      vertical: agent.category || '',
      prompt: '',
      profileImage: '',
    })
    setUploadedFiles([])
    setDeployError('')
  }

  // ── Handle deploy ──
  const handleDeploy = async () => {
    if (!deployModal) return
    if (!deployForm.agentName.trim()) {
      setDeployError('Agent name is required')
      return
    }
    setDeploying(true)
    setDeployError('')

    try {
      const res = await fetch('/api/client/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: targetClientId || undefined,
          agentId: deployModal.agent_id,
          agentName: deployForm.agentName.trim(),
          roleType: deployForm.roleType,
          vertical: deployForm.vertical,
          prompt: deployForm.prompt,
          intelligenceDocs: uploadedFiles,
          profileImage: deployForm.profileImage || undefined,
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

  // ── File upload handlers ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const allowed = ['.pdf', '.txt', '.doc', '.docx', '.md']
    const valid = files.filter(f =>
      allowed.some(ext => f.name.toLowerCase().endsWith(ext))
    )
    setUploadedFiles(prev => {
      const combined = [...prev, ...valid.map(f => ({ name: f.name, size: f.size, type: f.type }))]
      return combined.slice(0, 5)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (name: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== name))
  }

  // ── Handle drag-drop ──
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const allowed = ['.pdf', '.txt', '.doc', '.docx', '.md']
    const valid = files.filter(f =>
      allowed.some(ext => f.name.toLowerCase().endsWith(ext))
    )
    setUploadedFiles(prev => {
      const combined = [...prev, ...valid.map(f => ({ name: f.name, size: f.size, type: f.type }))]
      return combined.slice(0, 5)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // ── Agent actions (Pause / Edit Prompt / Undeploy) ──
  const updateAgentStatus = async (id: string, status: string) => {
    setActionLoading(id)
    try {
      await fetch(`/api/client/agents/deploy`, {
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
  const totalDeployed = deployedAgents.length
  const activeCount = deployedAgents.filter(a => a.status === 'active').length

  // ── Filter registry ──
  const filteredRegistry = registryAgents.filter(a => {
    if (search && !a.name?.toLowerCase().includes(search.toLowerCase()) && !a.agent_id?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterVertical !== 'all' && a.category !== filterVertical) return false
    if (filterRole !== 'all' && a.agent_type !== filterRole) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Hero ── */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">My Intelligence Agents</h1>
        <p className="text-white/40 text-sm mt-1">
          Deploy and customize AI agents for your brand, company, and workflow
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
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Available Recommendations</div>
          <div className="text-2xl font-light text-[#5E8B84]">{registryAgents.length}</div>
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
          Available Agents
        </button>
        <button
          onClick={() => setTab('deployed')}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
            tab === 'deployed'
              ? 'bg-[#C6A664] text-black'
              : 'text-white/40 border border-white/[0.06] hover:text-white'
          }`}
        >
          My Deployed Agents
          {totalDeployed > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-white/10 text-white text-[10px] rounded-full">
              {totalDeployed}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
         TAB 1: AVAILABLE AGENTS
         ══════════════════════════════════════════════════════ */}
      {tab === 'available' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30 w-60"
            />
            <select
              value={filterVertical}
              onChange={(e) => setFilterVertical(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
            >
              <option value="all">All Verticals</option>
              {verticalsLoading ? (
                <option value="" disabled>Loading...</option>
              ) : verticals.map(v => (
                <option key={v.key} value={v.key}>{v.name || v.key}</option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
            >
              <option value="all">All Roles</option>
              {ROLE_TYPES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Grid */}
          {registryLoading ? (
            <div className="text-center py-16 text-white/30 text-sm">Loading agent catalog...</div>
          ) : filteredRegistry.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm">
              {search || filterVertical !== 'all' || filterRole !== 'all'
                ? 'No agents match your filters'
                : 'No agents available in the registry'
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRegistry.map((agent) => (
                <div
                  key={agent.id}
                  className="glass rounded-sm border border-white/[0.06] p-5 hover:border-white/15 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl shrink-0">{agent.icon || '🤖'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white/80 truncate">{agent.name}</h3>
                        {agent.agent_type && (
                          <span className="px-1.5 py-0.5 bg-white/5 text-white/40 border border-white/10 rounded text-[10px] shrink-0">
                            {agent.agent_type}
                          </span>
                        )}
                      </div>
                      {agent.tagline && (
                        <p className="text-xs text-white/40 mt-1 line-clamp-1">{agent.tagline}</p>
                      )}
                    </div>
                    {agent.deployed ? (
                      <span className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-medium rounded-sm shrink-0">
                        Deployed ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => openDeployModal(agent)}
                        className="px-3 py-1.5 bg-[#C6A664] text-black text-[10px] font-bold rounded-sm hover:bg-white transition-all shrink-0"
                      >
                        Deploy
                      </button>
                    )}
                  </div>

                  {/* Capabilities */}
                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {agent.capabilities.slice(0, 4).map((cap) => (
                        <span
                          key={cap}
                          className="px-1.5 py-0.5 bg-white/5 text-white/50 border border-white/10 rounded text-[10px]"
                        >
                          {cap}
                        </span>
                      ))}
                      {agent.capabilities.length > 4 && (
                        <span className="px-1.5 py-0.5 text-white/30 text-[10px]">+{agent.capabilities.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {agent.description && (
                    <p className="text-xs text-white/40 leading-relaxed mt-2 line-clamp-2">{agent.description}</p>
                  )}

                  {/* Category badge */}
                  {agent.category && (
                    <div className="mt-3">
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px]">
                        {agent.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         TAB 2: MY DEPLOYED AGENTS
         ══════════════════════════════════════════════════════ */}
      {tab === 'deployed' && (
        <div className="space-y-4">
          {deployedLoading ? (
            <div className="text-center py-16 text-white/30 text-sm">Loading deployed agents...</div>
          ) : deployedAgents.length === 0 ? (
            <div className="glass rounded-sm p-10 text-center border border-white/[0.06]">
              <div className="text-4xl mb-4 opacity-30">🤖</div>
              <p className="text-white/50 text-sm">No agents deployed yet.</p>
              <p className="text-white/30 text-xs mt-1">
                Browse the registry to deploy your first agent.
              </p>
              <button
                onClick={() => setTab('available')}
                className="mt-4 px-5 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
              >
                Browse Registry →
              </button>

              {/* Recommendation */}
              {registryAgents.length > 0 && (
                <div className="mt-6 p-4 bg-[#C6A664]/5 border border-[#C6A664]/10 rounded-sm inline-block">
                  <p className="text-xs text-[#C6A664]/70">
                    💡 Based on your blueprint, we recommend deploying{' '}
                    <button
                      onClick={() => {
                        const rec = registryAgents[0]
                        openDeployModal(rec)
                      }}
                      className="underline hover:text-[#C6A664]"
                    >
                      {registryAgents[0].name}
                    </button>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deployedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="glass rounded-sm border border-white/[0.06] p-5 hover:border-white/15 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white/80 truncate">{agent.agent_name}</h3>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">{agent.agent_id}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${STATUS_STYLES[agent.status] || 'bg-white/5 text-white/40 border-white/10'}`}>
                      {agent.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-[10px]">
                    {agent.role_type && (
                      <div className="flex justify-between">
                        <span className="text-white/30">Role</span>
                        <span className="text-white/60">{agent.role_type}</span>
                      </div>
                    )}
                    {agent.vertical && (
                      <div className="flex justify-between">
                        <span className="text-white/30">Vertical</span>
                        <span className="text-white/60">{agent.vertical}</span>
                      </div>
                    )}
                    {agent.prompt && (
                      <div className="flex justify-between">
                        <span className="text-white/30">Prompt</span>
                        <span className="text-white/60 truncate max-w-[140px]">{agent.prompt.slice(0, 40)}{agent.prompt.length > 40 ? '...' : ''}</span>
                      </div>
                    )}
                    {agent.intelligence_docs && agent.intelligence_docs.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-white/30">Intelligence</span>
                        <span className="text-white/60">{agent.intelligence_docs.length} file(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                    {agent.status === 'active' ? (
                      <button
                        onClick={() => updateAgentStatus(agent.id, 'paused')}
                        disabled={actionLoading === agent.id}
                        className="px-2.5 py-1 text-[10px] bg-white/5 border border-white/10 rounded-sm text-white/50 hover:text-white disabled:opacity-40"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => updateAgentStatus(agent.id, 'active')}
                        disabled={actionLoading === agent.id}
                        className="px-2.5 py-1 text-[10px] bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20 rounded-sm hover:bg-[#C6A664]/20 disabled:opacity-40"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setDeployModal(null) // repurpose for edit
                        setDeployForm({
                          agentName: agent.agent_name,
                          roleType: agent.role_type || '',
                          vertical: agent.vertical || '',
                          prompt: agent.prompt || '',
                          profileImage: agent.profile_image || '',
                        })
                        // Simple prompt edit via browser prompt for now
                        const newPrompt = window.prompt('Edit agent prompt:', agent.prompt || '')
                        if (newPrompt !== null) {
                          fetch('/api/client/agents/deploy', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ clientId: targetClientId || undefined, id: agent.id, prompt: newPrompt }),
                          }).then(() => fetchDeployed())
                        }
                      }}
                      className="px-2.5 py-1 text-[10px] bg-white/5 border border-white/10 rounded-sm text-white/50 hover:text-white"
                    >
                      Edit Prompt
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Undeploy this agent? It will be removed permanently.')) {
                          updateAgentStatus(agent.id, 'undeployed')
                        }
                      }}
                      disabled={actionLoading === agent.id}
                      className="px-2.5 py-1 text-[10px] bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 hover:bg-red-500/20 disabled:opacity-40 ml-auto"
                    >
                      Undeploy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         DEPLOY MODAL
         ══════════════════════════════════════════════════════ */}
      {deployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-sm border border-white/[0.06] p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Deploy Agent</h2>
                <p className="text-xs text-white/40 mt-1">
                  Customize and deploy <span className="text-[#C6A664]">{deployModal.name}</span>
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
              {/* Agent Name */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Agent Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={deployForm.agentName}
                  onChange={(e) => setDeployForm({ ...deployForm, agentName: e.target.value })}
                  placeholder="My Custom Agent"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
                />
              </div>

              {/* Role Type + Vertical */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Role Type</label>
                  <select
                    value={deployForm.roleType}
                    onChange={(e) => setDeployForm({ ...deployForm, roleType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
                  >
                    <option value="">Select Role</option>
                    {ROLE_TYPES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Vertical</label>
                  <select
                    value={deployForm.vertical}
                    onChange={(e) => setDeployForm({ ...deployForm, vertical: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
                  >
                    <option value="">Select Vertical</option>
                    {verticalsLoading ? (
                      <option value="" disabled>Loading...</option>
                    ) : verticals.map(v => (
                      <option key={v.key} value={v.key}>{v.name || v.key}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Custom Prompt / Instructions
                </label>
                <textarea
                  value={deployForm.prompt}
                  onChange={(e) => setDeployForm({ ...deployForm, prompt: e.target.value })}
                  placeholder="Add your custom prompt/instructions for this agent..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30 resize-none"
                />
              </div>

              {/* Intelligence Upload */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Upload Intelligence Documents
                </label>
                <p className="text-[10px] text-white/30 mb-2">
                  Upload intelligence documents to train your agent
                </p>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/[0.08] rounded-sm p-6 text-center hover:border-[#C6A664]/30 transition-all cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-white/30">Drop intelligence documents here</p>
                  <p className="text-[10px] text-white/20 mt-1">PDF, TXT, DOC, MD — max 5 files</p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.map((file) => (
                      <div key={file.name} className="flex items-center justify-between bg-white/[0.03] px-3 py-1.5 rounded-sm">
                        <span className="text-xs text-white/50 truncate">{file.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(file.name) }}
                          className="text-white/20 hover:text-red-400 text-[10px] ml-2 shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile Image */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Profile Image URL <span className="text-white/30 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={deployForm.profileImage}
                  onChange={(e) => setDeployForm({ ...deployForm, profileImage: e.target.value })}
                  placeholder="https://example.com/avatar.png"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
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
                  disabled={deploying || !deployForm.agentName.trim()}
                  className="flex-1 px-5 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {deploying ? (
                    <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Deploying...</>
                  ) : 'Deploy Agent'}
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
