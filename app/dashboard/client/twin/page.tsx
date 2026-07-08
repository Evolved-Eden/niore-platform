'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────────

type TabId = 'overview' | 'memory' | 'trainings' | 'connections'

type TwinData = {
  id: string
  client_id: string
  personality_summary: string | null
  preference_summary: string | null
  communication_style: string | null
  engagement_score: number | null
  loyalty_score: number | null
  confidence_score: number | null
  version: number
  twin_status: string | null
  memory_summary: string | null
  essence_summary: string | null
  intelligence_score: number | null
  memory_score: number | null
  metadata: Record<string, any> | null
  updated_at: string | null
}

type MemoryItem = {
  id: string
  entity_type: string | null
  memory_type: string | null
  content: string | null
  title: string | null
  created_at: string | null
}

type AgentItem = {
  id: string
  agent_id: string
  name: string
  tagline: string | null
  icon: string | null
  connected: boolean
}

type SwarmItem = {
  id: string
  swarm_id: string
  name: string
  description: string | null
  connected: boolean
}

// ── Constants ────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview',    label: 'Overview',     icon: '\u2302' },
  { id: 'memory',      label: 'Memory',       icon: '\uD83D\uDCDA' },
  { id: 'trainings',   label: 'Trainings',    icon: '\uD83C\uDF93' },
  { id: 'connections', label: 'Connections',  icon: '\uD83D\uDD17' },
]

const MEMORY_TYPE_ICON: Record<string, string> = {
  user_message:  '\uD83D\uDC64',
  zuri_response: '\uD83E\uDD16',
  interaction:   '\uD83D\uDD04',
  note:          '\uD83D\uDCDD',
  training:      '\uD83C\uDF93',
  connection:    '\uD83D\uDD17',
  insight:       '\uD83D\uDCA1',
}

const AUTONOMY_LEVELS = ['guided', 'semi_autonomous', 'autonomous'] as const

// ── Component ───────────────────────────────────────────────────

export default function ClientTwinPage() {
  const router = useRouter()
  const supabase = createClient()

  // Auth
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  // Twin data
  const [twin, setTwin] = useState<TwinData | null>(null)
  const [loading, setLoading] = useState(true)

  // Active tab
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // ── Overview tab state ──
  // Inline editing
  const [editingOverview, setEditingOverview] = useState(false)
  const [editFields, setEditFields] = useState({
    personality_summary: '',
    communication_style: '',
    preference_summary: '',
    autonomy_level: 'guided',
    confidence_threshold: 70,
    memory_enabled: true,
    name: '',
  })
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // EE / intake context
  const [blueprintProfile, setBlueprintProfile] = useState<any>(null)
  const [essenceProfile, setEssenceProfile] = useState<any>(null)

  // ── Memory tab state ──
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [memoriesLoading, setMemoriesLoading] = useState(false)
  const [memoryFilter, setMemoryFilter] = useState('')
  const [memoryTypeFilter, setMemoryTypeFilter] = useState('')
  const [memorySearch, setMemorySearch] = useState('')
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null)
  const [memoryLimit, setMemoryLimit] = useState(30)

  // ── Trainings tab state ──
  const [instructions, setInstructions] = useState('')
  const [trainings, setTrainings] = useState<any[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Connections tab state ──
  const [agents, setAgents] = useState<AgentItem[]>([])
  const [swarms, setSwarms] = useState<SwarmItem[]>([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)

  // ── Load on mount ──
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setUserName(user.email?.split('@')[0] ?? 'User')

      // Fetch identity
      const { data: identity } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (identity?.full_name) setUserName(identity.full_name)

      // Fetch twin
      const { data: twinRecord } = await supabase
        .from('client_twins')
        .select('*')
        .eq('client_id', user.id)
        .maybeSingle()

      if (twinRecord) {
        const t = twinRecord as any as TwinData
        setTwin(t)
        const meta = (t.metadata ?? {}) as Record<string, any>
        setEditFields({
          personality_summary: t.personality_summary ?? meta.personality_summary ?? '',
          communication_style: t.communication_style ?? meta.communication_style ?? '',
          preference_summary: t.preference_summary ?? meta.preference_summary ?? '',
          autonomy_level: meta.autonomy_level ?? 'guided',
          confidence_threshold: meta.confidence_threshold ?? 70,
          memory_enabled: meta.memory_enabled !== false,
          name: meta.name ?? '',
        })
        setInstructions(meta.instructions ?? '')
        setTrainings(meta.trainings ?? [])
      }

      // Fetch intake / EE profile
      const { data: clientRec } = await supabase
        .from('clients')
        .select('metadata')
        .eq('id', user.id)
        .maybeSingle()
      const intakeMeta = (clientRec?.metadata as Record<string, any>)?.intake?.sections
      setBlueprintProfile(intakeMeta?.results?.blueprint ?? null)
      setEssenceProfile(intakeMeta?.results?.essence ?? null)

      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Load memories when tab switches to memory ──
  useEffect(() => {
    if (activeTab === 'memory' && userId && memories.length === 0) {
      loadMemories()
    }
    if (activeTab === 'connections' && userId && agents.length === 0) {
      loadConnections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userId])

  async function loadMemories() {
    setMemoriesLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(memoryLimit) })
      if (memoryTypeFilter) params.set('type', memoryTypeFilter)
      const res = await fetch(`/api/memories?${params}`)
      const data = await res.json()
      setMemories(data.memories ?? [])
    } catch { /* ignore */ }
    setMemoriesLoading(false)
  }

  async function loadConnections() {
    setConnectionsLoading(true)
    try {
      // Fetch available agents + determine which are connected to twin
      const agentRes = await fetch('/api/agents')
      const agentData = await agentRes.json()
      const allAgents: AgentItem[] = (agentData.agents ?? []).map((a: any) => ({
        id: a.id,
        agent_id: a.agent_id,
        name: a.name,
        tagline: a.tagline ?? null,
        icon: a.icon ?? null,
        connected: false,
      }))

      const swarmRes = await fetch('/api/swarms')
      const swarmData = await swarmRes.json()
      const allSwarms: SwarmItem[] = (swarmData.swarms ?? []).map((s: any) => ({
        id: s.id,
        swarm_id: s.swarm_id ?? s.id,
        name: s.name,
        description: s.description ?? null,
        connected: false,
      }))

      // Check metadata for stored connections
      const meta = twin?.metadata ?? {}
      const connectedAgentIds: string[] = meta.connected_agent_ids ?? []
      const connectedSwarmIds: string[] = meta.connected_swarm_ids ?? []

      setAgents(allAgents.map(a => ({
        ...a,
        connected: connectedAgentIds.includes(a.agent_id),
      })))
      setSwarms(allSwarms.map(s => ({
        ...s,
        connected: connectedSwarmIds.includes(s.swarm_id),
      })))
    } catch { /* ignore */ }
    setConnectionsLoading(false)
  }

  // ── Save twin (overview changes, connections, instructions) ──
  async function saveTwin(updatedMeta?: Record<string, any>) {
    if (!twin?.id || !userId) return
    const baseMeta = { ...(twin.metadata ?? {}) }
    const meta = { ...baseMeta, ...(updatedMeta ?? {}), updated_at: new Date().toISOString() }

    const updates: Record<string, any> = {
      metadata: meta,
      personality_summary: editFields.personality_summary,
      communication_style: editFields.communication_style,
      preference_summary: editFields.preference_summary,
    }

    const { error } = await supabase
      .from('client_twins')
      .update(updates as any)
      .eq('id', twin.id)
      .eq('client_id', userId)

    if (error) throw error

    // Refresh twin
    const { data: refreshed } = await supabase
      .from('client_twins')
      .select('*')
      .eq('id', twin.id)
      .maybeSingle()

    if (refreshed) setTwin(refreshed as any as TwinData)
  }

  async function handleSaveOverview() {
    setSaveMessage(null)
    try {
      await saveTwin({
        name: editFields.name,
        autonomy_level: editFields.autonomy_level,
        confidence_threshold: editFields.confidence_threshold,
        memory_enabled: editFields.memory_enabled,
        personality_summary: editFields.personality_summary,
        communication_style: editFields.communication_style,
        preference_summary: editFields.preference_summary,
      })
      setEditingOverview(false)
      setSaveMessage({ type: 'success', text: 'Twin settings saved.' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message ?? 'Failed to save' })
    }
  }

  async function handleDeleteMemory(id: string) {
    setDeletingMemoryId(id)
    try {
      const res = await fetch(`/api/memories?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setMemories(prev => prev.filter(m => m.id !== id))
    } catch { /* ignore */ }
    setDeletingMemoryId(null)
  }

  async function handleToggleAgentConnection(agentId: string, connect: boolean) {
    if (!twin) return
    const meta = twin.metadata ?? {}
    const connectedAgentIds: string[] = meta.connected_agent_ids ?? []
    const updated = connect
      ? [...new Set([...connectedAgentIds, agentId])]
      : connectedAgentIds.filter(id => id !== agentId)

    try {
      await saveTwin({ connected_agent_ids: updated })
      setAgents(prev => prev.map(a => a.agent_id === agentId ? { ...a, connected: connect } : a))
    } catch { /* ignore */ }
  }

  async function handleToggleSwarmConnection(swarmId: string, connect: boolean) {
    if (!twin) return
    const meta = twin.metadata ?? {}
    const connectedSwarmIds: string[] = meta.connected_swarm_ids ?? []
    const updated = connect
      ? [...new Set([...connectedSwarmIds, swarmId])]
      : connectedSwarmIds.filter(id => id !== swarmId)

    try {
      await saveTwin({ connected_swarm_ids: updated })
      setSwarms(prev => prev.map(s => s.swarm_id === swarmId ? { ...s, connected: connect } : s))
    } catch { /* ignore */ }
  }

  async function handleSaveInstructions() {
    if (!twin) return
    try {
      await saveTwin({ instructions })
      setSaveMessage({ type: 'success', text: 'Training instructions saved.' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message ?? 'Failed to save' })
    }
  }

  async function handleUploadKnowledge() {
    if (!uploadFile || !userId || !twin) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        const newTraining = {
          id: crypto.randomUUID?.() ?? `train_${Date.now()}`,
          title: uploadTitle || uploadFile.name,
          content: content.slice(0, 5000),
          type: 'knowledge_doc',
          created_at: new Date().toISOString(),
        }

        const updated = [...trainings, newTraining]
        setTrainings(updated)
        await saveTwin({ trainings: updated, instructions })
        setUploadFile(null)
        setUploadTitle('')
        setSaveMessage({ type: 'success', text: 'Knowledge document uploaded.' })
        setTimeout(() => setSaveMessage(null), 3000)
      }
      reader.readAsText(uploadFile)
    } catch { /* ignore */ }
    setUploading(false)
  }

  async function handleDeleteTraining(id: string) {
    const updated = trainings.filter(t => t.id !== id)
    setTrainings(updated)
    try {
      await saveTwin({ trainings: updated })
    } catch { /* ignore */ }
  }

  // ── Filtered memories ──
  const filteredMemories = memories.filter(m => {
    if (memoryTypeFilter && m.memory_type !== memoryTypeFilter) return false
    if (memorySearch) {
      const q = memorySearch.toLowerCase()
      const match = (m.content ?? '').toLowerCase().includes(q) ||
                    (m.title ?? '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const memoryTypes = [...new Set(memories.map(m => m.memory_type).filter(Boolean))] as string[]

  // ── Helper: render memory type icon ──
  function memoryIcon(type: string | null) {
    return MEMORY_TYPE_ICON[type ?? ''] ?? '\uD83D\uDCC4'
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const meta = (twin?.metadata ?? {}) as Record<string, any>
  const twinName = meta.name ?? `Twin of ${userName}`
  const autonomyLevel = meta.autonomy_level ?? 'guided'
  const confidenceThreshold = meta.confidence_threshold ?? 70
  const memoryEnabled = meta.memory_enabled !== false

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          My <span className="text-[#c8ff00]">Twin</span>
        </h1>
        <p className="text-white/30 text-sm">Your AI-synthesized digital intelligence</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.06] pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium rounded-sm transition-all ${
              activeTab === tab.id
                ? 'bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20'
                : 'text-white/30 hover:text-white/60 border border-transparent'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification */}
      {saveMessage && (
        <div className={`mb-4 px-4 py-3 rounded-sm text-sm border ${
          saveMessage.type === 'success'
            ? 'bg-[#c8ff00]/10 border-[#c8ff00]/30 text-[#c8ff00]'
            : 'bg-red-900/20 border-red-800/30 text-red-400'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* ════════════════════ OVERVIEW TAB ════════════════════ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column — 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Identity Card */}
            <div className="glass rounded-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#c8ff00]/10 border-2 border-[#c8ff00]/30 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-[#c8ff00]">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-semibold">{twinName}</h2>
                      <span className="text-[10px] text-white/30 border border-white/[0.1] px-1.5 py-0.5 rounded-sm">
                        v{twin?.version ?? 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-pulse-slow" />
                      <span className="text-xs text-white/40 capitalize">{twin?.twin_status ?? 'active'} &bull; Learning</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-white/30">
                      <span>Autonomy: <span className="text-white/60 capitalize">{autonomyLevel.replace('_', ' ')}</span></span>
                      <span>Memory: <span className="text-white/60">{memoryEnabled ? 'On' : 'Off'}</span></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEditingOverview(!editingOverview)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-sm transition-all ${
                    editingOverview
                      ? 'bg-[#c8ff00] text-black'
                      : 'border border-white/10 text-white/30 hover:border-white/30 hover:text-white/60'
                  }`}
                >
                  {editingOverview ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {/* Intelligence Profile */}
              {!editingOverview && (
                <div className="px-6 py-5 border-b border-white/[0.06]">
                  <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Intelligence Profile</div>
                  {blueprintProfile ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Archetype</span>
                        <span className="text-[#c8ff00] font-medium">{blueprintProfile.archetype ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Core Architecture</span>
                        <span className="text-white font-medium">{blueprintProfile.foundation?.coreArch ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Energy Type</span>
                        <span className="text-[#a78bfa] font-medium">{blueprintProfile.foundation?.energyType ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Natural Gift</span>
                        <span className="text-white/70">{blueprintProfile.foundation?.naturalGift ?? '—'}</span>
                      </div>
                      {blueprintProfile.foundation?.growthEdge && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">Growth Edge</span>
                          <span className="text-[#00d4ff] font-medium">{blueprintProfile.foundation.growthEdge}</span>
                        </div>
                      )}
                      {essenceProfile && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">Mind Architecture</span>
                          <span className="text-[#fb923c] font-medium">{essenceProfile.mindArchitecture ?? '—'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-white/30 italic">
                      Complete your{' '}
                      <Link href="/intake" className="text-[#c8ff00] hover:underline">Intake Profile</Link> to build your intelligence profile.
                    </p>
                  )}

                  {/* Personality summary display */}
                  {twin?.personality_summary && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Personality</div>
                      <p className="text-sm text-white/50">{twin.personality_summary}</p>
                    </div>
                  )}
                  {twin?.communication_style && (
                    <div className="mt-3">
                      <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Communication</div>
                      <p className="text-sm text-white/50">{twin.communication_style}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Inline Edit Form */}
              {editingOverview && (
                <div className="px-6 py-5 space-y-5">
                  <div className="text-xs text-white/30 tracking-widest uppercase">Edit Settings</div>

                  <div>
                    <label className="block text-[11px] text-white/40 mb-1">Twin Name</label>
                    <input
                      type="text"
                      value={editFields.name}
                      onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/40 mb-1">Personality Summary</label>
                    <textarea
                      value={editFields.personality_summary}
                      onChange={e => setEditFields(f => ({ ...f, personality_summary: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/40 mb-1">Communication Style</label>
                    <textarea
                      value={editFields.communication_style}
                      onChange={e => setEditFields(f => ({ ...f, communication_style: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40 resize-none"
                      placeholder="e.g. Direct, empathetic, strategic..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/40 mb-1">Preference Summary</label>
                    <textarea
                      value={editFields.preference_summary}
                      onChange={e => setEditFields(f => ({ ...f, preference_summary: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Autonomy Level</label>
                      <select
                        value={editFields.autonomy_level}
                        onChange={e => setEditFields(f => ({ ...f, autonomy_level: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40"
                      >
                        <option value="guided">Guided</option>
                        <option value="semi_autonomous">Semi-Autonomous</option>
                        <option value="autonomous">Autonomous</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Confidence: {editFields.confidence_threshold}%</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={editFields.confidence_threshold}
                        onChange={e => setEditFields(f => ({ ...f, confidence_threshold: parseInt(e.target.value) }))}
                        className="w-full accent-[#c8ff00]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFields.memory_enabled}
                        onChange={e => setEditFields(f => ({ ...f, memory_enabled: e.target.checked }))}
                        className="accent-[#c8ff00]"
                      />
                      <span className="text-sm text-white/60">Enable Memory</span>
                    </label>
                    <button
                      onClick={handleSaveOverview}
                      className="px-5 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="px-6 py-5">
                <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Metrics</div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Engagement', value: twin?.engagement_score ?? 78, color: '#c8ff00' },
                    { label: 'Confidence', value: twin?.confidence_score ?? 85, color: '#00d4ff' },
                    { label: 'Loyalty', value: twin?.loyalty_score ?? 70, color: '#a78bfa' },
                    { label: 'Intel Score', value: twin?.intelligence_score ?? 65, color: '#fb923c' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/[0.03] rounded-sm p-3 border border-white/[0.06]">
                      <div className="text-[10px] text-white/30 uppercase mb-1">{s.label}</div>
                      <div className="text-lg font-semibold" style={{ color: s.color }}>{s.value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/dashboard/chat"
                className="glass rounded-sm p-4 border border-white/[0.06] hover:border-[#c8ff00]/30 transition-all group"
              >
                <div className="text-xs text-[#c8ff00] tracking-widest uppercase mb-1">Chat</div>
                <p className="text-[11px] text-white/40">Talk to your twin</p>
              </Link>
              <Link
                href="/dashboard/client/blueprint"
                className="glass rounded-sm p-4 border border-white/[0.06] hover:border-[#c8ff00]/30 transition-all group"
              >
                <div className="text-xs text-[#c8ff00] tracking-widest uppercase mb-1">Blueprint</div>
                <p className="text-[11px] text-white/40">View full blueprint</p>
              </Link>
              <Link
                href="/dashboard/client/twin/configure"
                className="glass rounded-sm p-4 border border-white/[0.06] hover:border-[#fb923c]/30 transition-all group"
              >
                <div className="text-xs text-[#fb923c] tracking-widest uppercase mb-1">Configure</div>
                <p className="text-[11px] text-white/40">Advanced settings</p>
              </Link>
              <Link
                href="/dashboard/client/essence"
                className="glass rounded-sm p-4 border border-white/[0.06] hover:border-[#c8ff00]/30 transition-all group"
              >
                <div className="text-xs text-[#c8ff00] tracking-widest uppercase mb-1">Essence</div>
                <p className="text-[11px] text-white/40">Intelligence feed</p>
              </Link>
            </div>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-4">
            {twin && (
              <div className="glass rounded-sm p-4 border border-white/[0.06]">
                <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Details</div>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Status', twin.twin_status ?? 'active'],
                    ['Version', `v${twin.version}`],
                    ['Autonomy', autonomyLevel.replace('_', ' ')],
                    ['Memory', memoryEnabled ? 'Enabled' : 'Disabled'],
                    ['Updated', twin.updated_at ? new Date(twin.updated_at).toLocaleDateString() : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-white/30 text-xs">{label}</dt>
                      <dd className="text-white/60 text-xs capitalize">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {twin?.memory_summary && (
              <div className="glass rounded-sm p-4 border border-white/[0.06]">
                <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Memory Summary</div>
                <p className="text-sm text-white/50">{twin.memory_summary}</p>
              </div>
            )}

            <div className="glass rounded-sm p-4 border border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Intelligence</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Memory Score</span>
                  <span className="text-white/60">{twin?.memory_score ?? 0}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Engagement</span>
                  <span className="text-white/60">{twin?.engagement_score ?? 0}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Confidence</span>
                  <span className="text-white/60">{twin?.confidence_score ?? 0}%</span>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/client/twin/configure"
              className="block w-full px-4 py-2.5 bg-[#fb923c] text-black text-xs font-bold rounded-sm hover:bg-white transition-all text-center"
            >
              Configure Twin &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ════════════════════ MEMORY TAB ════════════════════ */}
      {activeTab === 'memory' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={memorySearch}
                onChange={e => setMemorySearch(e.target.value)}
                placeholder="Search memories..."
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40 pl-8"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 text-sm">&#x1F50D;</span>
            </div>
            {memoryTypes.length > 0 && (
              <select
                value={memoryTypeFilter}
                onChange={e => setMemoryTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/50 focus:outline-none focus:border-[#c8ff00]/40"
              >
                <option value="">All types</option>
                {memoryTypes.map(t => (
                  <option key={t} value={t ?? ''}>{t?.replace('_', ' ') ?? 'unknown'}</option>
                ))}
              </select>
            )}
            <button
              onClick={loadMemories}
              className="px-3 py-2 border border-white/10 text-white/30 text-xs rounded-sm hover:border-white/30 transition-all"
            >
              Refresh
            </button>
          </div>

          {/* Memory list */}
          {memoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="glass rounded-sm p-8 text-center">
              <div className="text-2xl mb-3">&#x1F4DA;</div>
              <p className="text-sm text-white/30 mb-1">No memories found</p>
              <p className="text-xs text-white/20">
                {memorySearch || memoryTypeFilter
                  ? 'Try adjusting your filters'
                  : 'Chat with your twin to build memories'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMemories.map(m => (
                <div
                  key={m.id}
                  className="glass rounded-sm p-4 border border-white/[0.06] hover:border-white/[0.1] transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">{memoryIcon(m.memory_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] text-white/30 uppercase tracking-wider border border-white/[0.06] px-1.5 py-0.5 rounded-sm">
                          {m.memory_type ?? 'memory'}
                        </span>
                        {m.title && (
                          <span className="text-xs text-white/50 font-medium">{m.title}</span>
                        )}
                        <span className="text-[10px] text-white/20 ml-auto">
                          {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 line-clamp-3">{m.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      disabled={deletingMemoryId === m.id}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-[10px] text-red-400/50 hover:text-red-400 border border-transparent hover:border-red-400/30 rounded-sm"
                    >
                      {deletingMemoryId === m.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-white/20">
            <span>{filteredMemories.length} of {memories.length} memories</span>
            {memories.length >= memoryLimit && (
              <button
                onClick={() => setMemoryLimit(prev => prev + 30)}
                className="text-[#c8ff00]/50 hover:text-[#c8ff00] transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ TRAININGS TAB ════════════════════ */}
      {activeTab === 'trainings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Instructions */}
            <div className="glass rounded-sm p-5 border border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Twin Instructions</div>
              <p className="text-[11px] text-white/30 mb-3">
                Define how your twin should behave, what context it should always consider, and any constraints.
              </p>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={6}
                placeholder="e.g. Always consider the user's Blueprint archetype before making recommendations. Prioritize strategic alignment over speed. Never share raw personality scores with third parties..."
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40 resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSaveInstructions}
                  className="px-4 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
                >
                  Save Instructions
                </button>
              </div>
            </div>

            {/* Knowledge Upload */}
            <div className="glass rounded-sm p-5 border border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Knowledge Documents</div>
              <p className="text-[11px] text-white/30 mb-3">
                Upload documents, guides, or reference material for your twin to learn from.
              </p>

              <div className="flex items-center gap-3 mb-3">
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="Document title..."
                  className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-white/10 text-white/40 text-xs rounded-sm hover:border-white/30 transition-all"
                >
                  Browse
                </button>
              </div>

              {uploadFile && (
                <div className="flex items-center gap-3 mb-3 p-3 bg-white/[0.03] rounded-sm border border-white/[0.06]">
                  <span className="text-sm">&#x1F4C4;</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/60 truncate">{uploadFile.name}</p>
                    <p className="text-[10px] text-white/30">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={handleUploadKnowledge}
                    disabled={uploading}
                    className="px-4 py-1.5 bg-[#c8ff00] text-black text-[11px] font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    onClick={() => setUploadFile(null)}
                    className="px-2 py-1.5 text-white/30 text-[11px] hover:text-white/60"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Uploaded trainings list */}
              {trainings.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="text-[11px] text-white/30 tracking-widest uppercase mb-2">
                    Uploaded Knowledge ({trainings.length})
                  </div>
                  {trainings.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-sm border border-white/[0.06] group">
                      <span className="text-sm">&#x1F4D6;</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/60 truncate">{t.title}</p>
                        <p className="text-[10px] text-white/30">
                          {t.type?.replace('_', ' ')} &bull; {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTraining(t.id)}
                        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] text-red-400/50 hover:text-red-400 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {trainings.length === 0 && !uploadFile && (
                <div className="text-center py-6">
                  <p className="text-sm text-white/20">No knowledge documents uploaded yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass rounded-sm p-4 border border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Training Stats</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Documents</span>
                  <span className="text-white/60">{trainings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Instructions</span>
                  <span className="text-white/60">{instructions.length > 0 ? 'Set' : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Memory</span>
                  <span className="text-white/60">{memoryEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-sm p-4 border border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Training Tips</div>
              <ul className="space-y-2 text-xs text-white/40">
                <li>&bull; Upload clear, well-structured documents</li>
                <li>&bull; Set instructions before uploading knowledge</li>
                <li>&bull; Train in topics that align with your blueprint</li>
                <li>&bull; Update training as your needs evolve</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ CONNECTIONS TAB ════════════════════ */}
      {activeTab === 'connections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main — 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Connected Agents */}
            <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white/30 tracking-widest uppercase">Agents</span>
                    <span className="text-[10px] text-white/20 ml-2">
                      {agents.filter(a => a.connected).length} connected
                    </span>
                  </div>
                </div>
              </div>

              {connectionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : agents.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-white/30">No agents available to connect.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {agents.map(agent => (
                    <div key={agent.agent_id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm shrink-0">{agent.icon ?? '\u2699\uFE0F'}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-white/70 font-medium truncate">{agent.name}</p>
                          {agent.tagline && (
                            <p className="text-[11px] text-white/30 truncate">{agent.tagline}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleAgentConnection(agent.agent_id, !agent.connected)}
                        className={`shrink-0 ml-3 px-3 py-1.5 text-[10px] font-bold rounded-sm transition-all ${
                          agent.connected
                            ? 'bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20 hover:bg-red-900/20 hover:text-red-400 hover:border-red-400/30'
                            : 'border border-white/10 text-white/30 hover:border-white/30 hover:text-white/60'
                        }`}
                      >
                        {agent.connected ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connected Swarms */}
            <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white/30 tracking-widest uppercase">Swarms</span>
                    <span className="text-[10px] text-white/20 ml-2">
                      {swarms.filter(s => s.connected).length} connected
                    </span>
                  </div>
                </div>
              </div>

              {connectionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : swarms.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-white/30">No swarms available to connect.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {swarms.map(swarm => (
                    <div key={swarm.swarm_id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm shrink-0">&#x1F578;&#xFE0F;</span>
                        <div className="min-w-0">
                          <p className="text-sm text-white/70 font-medium truncate">{swarm.name}</p>
                          {swarm.description && (
                            <p className="text-[11px] text-white/30 truncate">{swarm.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleSwarmConnection(swarm.swarm_id, !swarm.connected)}
                        className={`shrink-0 ml-3 px-3 py-1.5 text-[10px] font-bold rounded-sm transition-all ${
                          swarm.connected
                            ? 'bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20 hover:bg-red-900/20 hover:text-red-400 hover:border-red-400/30'
                            : 'border border-white/10 text-white/30 hover:border-white/30 hover:text-white/60'
                        }`}
                      >
                        {swarm.connected ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-4">
            <div className="glass rounded-sm p-4 border border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Connection Summary</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Agents</span>
                  <span className="text-white/60">{agents.filter(a => a.connected).length} / {agents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Swarms</span>
                  <span className="text-white/60">{swarms.filter(s => s.connected).length} / {swarms.length}</span>
                </div>
              </div>
              {agents.filter(a => a.connected).length + swarms.filter(s => s.connected).length === 0 && (
                <p className="text-xs text-white/30 mt-3 italic">
                  Connect agents and swarms to expand your twin&apos;s capabilities.
                </p>
              )}
            </div>

            <div className="glass rounded-sm p-4 border border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-2">How Connections Work</div>
              <ul className="space-y-2 text-xs text-white/40">
                <li>&bull; Connected agents can be invoked by your twin</li>
                <li>&bull; Connected swarms coordinate multi-agent workflows</li>
                <li>&bull; Connections are stored in your twin&apos;s metadata</li>
                <li>&bull; Toggle connections on/off at any time</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
