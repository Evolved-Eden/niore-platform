'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'memory' | 'trainings' | 'connections'

type UserInfo = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
}

type ClientTwin = {
  id: string
  client_id: string | null
  personality_summary: string | null
  preference_summary: string | null
  communication_style: string | null
  engagement_score: number | null
  loyalty_score: number | null
  confidence_score: number | null
  intelligence_score: number | null
  memory_score: number | null
  version: number
  twin_status: string | null
  memory_summary: string | null
  essence_summary: string | null
  metadata: Record<string, any> | null
  updated_at: string | null
  // enriched
  user_email?: string | null
  user_name?: string | null
  user_role?: string | null
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
}

type SwarmItem = {
  id: string
  swarm_id: string
  name: string
  description: string | null
}

// ── Constants ────────────────────────────────────────────────────

const TABS: { id: AdminTab; label: string; icon: string }[] = [
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

const STATUS_OPTIONS = ['active', 'suspended', 'archived', 'inactive']

// ── Component ───────────────────────────────────────────────────

export default function AdminTwinPage() {
  const router = useRouter()
  const supabase = createClient()

  // Auth
  const [isAdmin, setIsAdmin] = useState(false)

  // Users / twin data
  const [users, setUsers] = useState<UserInfo[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [twins, setTwins] = useState<ClientTwin[]>([])
  const [twinMap, setTwinMap] = useState<Map<string, ClientTwin>>(new Map())
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingTwin, setLoadingTwin] = useState(false)

  // Active tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // Notifications
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function notify(type: 'success' | 'error', text: string) {
    setNotif({ type, text })
    setTimeout(() => setNotif(null), 3000)
  }

  // ── Edit state ──
  const [editFields, setEditFields] = useState({
    personality_summary: '',
    communication_style: '',
    preference_summary: '',
    autonomy_level: 'guided',
    confidence_threshold: 70,
    memory_enabled: true,
    twin_status: 'active',
    name: '',
  })

  // ── Memory tab ──
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [memoriesLoading, setMemoriesLoading] = useState(false)
  const [memorySearch, setMemorySearch] = useState('')
  const [memoryTypeFilter, setMemoryTypeFilter] = useState('')
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null)

  // ── Trainings tab ──
  const [instructions, setInstructions] = useState('')
  const [trainings, setTrainings] = useState<any[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Connections tab ──
  const [agents, setAgents] = useState<AgentItem[]>([])
  const [swarms, setSwarms] = useState<SwarmItem[]>([])
  const [connectedAgentIds, setConnectedAgentIds] = useState<string[]>([])
  const [connectedSwarmIds, setConnectedSwarmIds] = useState<string[]>([])
  const [deployLoading, setDeployLoading] = useState(false)

  // ── Load users on mount ──
  useEffect(() => {
    async function init() {
      const { data: { user: _user } } = await supabase.auth.getUser()
      // Guaranteed non-null by root middleware
      const user = _user!

      // Check admin role
      const { data: identity } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (identity?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      setIsAdmin(true)

      // Fetch all users (for the dropdown)
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      const allUsers: UserInfo[] = (data.users || []).filter((u: UserInfo) =>
        ['client', 'creator', 'personal', 'affiliate'].includes(u.role || '')
      )
      setUsers(allUsers)
      if (allUsers.length > 0) {
        setSelectedUserId(allUsers[0].id)
      }
      setLoadingUsers(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Load twin data when user selected ──
  useEffect(() => {
    if (!selectedUserId) return
    loadTwinData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId])

  async function loadTwinData() {
    setLoadingTwin(true)
    try {
      // Fetch twins list (admin API)
      const res = await fetch('/api/admin/twins')
      const data = await res.json()
      const allTwins: ClientTwin[] = data.twins || []
      setTwins(allTwins)

      const map = new Map<string, ClientTwin>()
      allTwins.forEach(t => { if (t.client_id) map.set(t.client_id, t) })
      setTwinMap(map)

      // Find the selected user's twin
      const twin = map.get(selectedUserId)
      if (twin) {
        const meta = twin.metadata ?? {}
        setEditFields({
          personality_summary: twin.personality_summary ?? meta.personality_summary ?? '',
          communication_style: twin.communication_style ?? meta.communication_style ?? '',
          preference_summary: twin.preference_summary ?? meta.preference_summary ?? '',
          autonomy_level: meta.autonomy_level ?? 'guided',
          confidence_threshold: meta.confidence_threshold ?? 70,
          memory_enabled: meta.memory_enabled !== false,
          twin_status: twin.twin_status ?? 'active',
          name: meta.name ?? '',
        })
        setInstructions(meta.instructions ?? '')
        setTrainings(meta.trainings ?? [])
        setConnectedAgentIds(meta.connected_agent_ids ?? [])
        setConnectedSwarmIds(meta.connected_swarm_ids ?? [])
      } else {
        // Reset for new user
        setEditFields({
          personality_summary: '',
          communication_style: '',
          preference_summary: '',
          autonomy_level: 'guided',
          confidence_threshold: 70,
          memory_enabled: true,
          twin_status: 'active',
          name: '',
        })
        setInstructions('')
        setTrainings([])
        setConnectedAgentIds([])
        setConnectedSwarmIds([])
        setMemories([])
      }

      // Load memories
      const memRes = await fetch(`/api/admin/twins?client_id=${selectedUserId}`)
      if (memRes.ok) {
        const memData = await fetch(`/api/memories?limit=100`)
        if (memData.ok) {
          const memJson = await memData.json()
          // Filter to this user's memories (the API returns all for the authed user,
          // but since admins call it, they may get their own. Use admin API instead)
        }
      }

      // Fetch this user's memories from admin perspective
      try {
        const { supabaseAdmin } = await import('@/lib/supabase/admin')
        const { data: userMemories } = await supabaseAdmin
          .from('ai_memories')
          .select('id, entity_type, memory_type, content, title, created_at')
          .eq('entity_id', selectedUserId)
          .order('created_at', { ascending: false })
          .limit(100)

        setMemories((userMemories as MemoryItem[]) ?? [])
      } catch { /* ignore */ }

      // Fetch agents + swarms catalog
      try {
        const agentRes = await fetch('/api/agents')
        const agentData = await agentRes.json()
        setAgents((agentData.agents || []).map((a: any) => ({
          id: a.id, agent_id: a.agent_id, name: a.name, tagline: a.tagline,
        })))

        const swarmRes = await fetch('/api/swarms')
        const swarmData = await swarmRes.json()
        setSwarms((swarmData.swarms || []).map((s: any) => ({
          id: s.id, swarm_id: s.swarm_id ?? s.id, name: s.name, description: s.description,
        })))
      } catch { /* ignore */ }
    } catch (err: any) {
      notify('error', 'Failed to load twin data')
    }
    setLoadingTwin(false)
  }

  // ── Save twin via admin API ──
  async function saveTwin(extraUpdates?: Record<string, any>) {
    if (!selectedUserId) return
    const meta = {
      name: editFields.name,
      autonomy_level: editFields.autonomy_level,
      confidence_threshold: editFields.confidence_threshold,
      memory_enabled: editFields.memory_enabled,
      instructions,
      trainings,
      connected_agent_ids: connectedAgentIds,
      connected_swarm_ids: connectedSwarmIds,
      ...(extraUpdates ?? {}),
    }

    const res = await fetch('/api/admin/twins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: selectedUserId,
        action: 'save_twin',
        updates: {
          personality_summary: editFields.personality_summary,
          communication_style: editFields.communication_style,
          preference_summary: editFields.preference_summary,
          twin_status: editFields.twin_status,
          metadata: meta,
        },
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Save failed')
    notify('success', 'Twin saved')
    await loadTwinData()
    return data
  }

  async function handleSaveOverview() {
    try {
      await saveTwin()
    } catch (err: any) {
      notify('error', err.message)
    }
  }

  async function handleToggleStatus(status: string) {
    if (!selectedUserId) return
    try {
      const res = await fetch('/api/admin/twins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedUserId, action: 'toggle_twin_status', status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEditFields(f => ({ ...f, twin_status: status }))
      notify('success', `Status set to ${status}`)
      loadTwinData()
    } catch (err: any) {
      notify('error', err.message)
    }
  }

  // ── Memory handlers ──
  async function handleDeleteMemory(id: string) {
    setDeletingMemoryId(id)
    try {
      const res = await fetch('/api/admin/twins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedUserId, action: 'delete_memory', memoryId: id }),
      })
      if (res.ok) setMemories(prev => prev.filter(m => m.id !== id))
    } catch { /* ignore */ }
    setDeletingMemoryId(null)
  }

  // ── Training handlers ──
  async function handleSaveInstructions() {
    try {
      await saveTwin()
      notify('success', 'Instructions saved')
    } catch (err: any) {
      notify('error', err.message)
    }
  }

  async function handleUploadKnowledge() {
    if (!uploadFile || !selectedUserId) return
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
        setTrainings(prev => [...prev, newTraining])
        await saveTwin()
        setUploadFile(null)
        setUploadTitle('')
        notify('success', 'Knowledge document uploaded')
      }
      reader.readAsText(uploadFile)
    } catch { /* ignore */ }
    setUploading(false)
  }

  async function handleDeleteTraining(id: string) {
    setTrainings(prev => prev.filter(t => t.id !== id))
    try {
      await saveTwin()
    } catch { /* ignore */ }
  }

  // ── Connection handlers ──
  async function handleToggleAgent(agentId: string) {
    const updated = connectedAgentIds.includes(agentId)
      ? connectedAgentIds.filter(id => id !== agentId)
      : [...connectedAgentIds, agentId]
    setConnectedAgentIds(updated)
    try {
      await saveTwin({ connected_agent_ids: updated })
    } catch { /* ignore */ }
  }

  async function handleToggleSwarm(swarmId: string) {
    const updated = connectedSwarmIds.includes(swarmId)
      ? connectedSwarmIds.filter(id => id !== swarmId)
      : [...connectedSwarmIds, swarmId]
    setConnectedSwarmIds(updated)
    try {
      await saveTwin({ connected_swarm_ids: updated })
    } catch { /* ignore */ }
  }

  async function handleDeployAgent(agentId: string, agentName: string) {
    setDeployLoading(true)
    try {
      const res = await fetch('/api/admin/twins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedUserId,
          action: 'deploy_agent',
          agentId,
          agentName,
          prompt: `Deployed by admin for ${selectedUserId}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      notify('success', `Agent "${agentName}" deployed`)
    } catch (err: any) {
      notify('error', err.message)
    }
    setDeployLoading(false)
  }

  async function handleDeploySwarm(swarmId: string, swarmName: string) {
    setDeployLoading(true)
    try {
      const res = await fetch('/api/admin/twins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedUserId,
          action: 'deploy_swarm',
          swarmId,
          swarmName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      notify('success', `Swarm "${swarmName}" deployed`)
    } catch (err: any) {
      notify('error', err.message)
    }
    setDeployLoading(false)
  }

  // ── Filtered memories ──
  const filteredMemories = memories.filter(m => {
    if (memoryTypeFilter && m.memory_type !== memoryTypeFilter) return false
    if (memorySearch) {
      const q = memorySearch.toLowerCase()
      return (m.content ?? '').toLowerCase().includes(q) ||
             (m.title ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const memoryTypes = [...new Set(memories.map(m => m.memory_type).filter(Boolean))] as string[]

  // ── Loading ──
  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#ff6b6b] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const selectedUser = users.find(u => u.id === selectedUserId)
  const twin = twinMap.get(selectedUserId)
  const meta = (twin?.metadata ?? {}) as Record<string, any>

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
            Twin <span className="text-[#ff6b6b]">Management</span>
          </h1>
          <p className="text-white/30 text-sm">Administer twins across all users</p>
        </div>
        <div className="flex items-center gap-3">
          {notif && (
            <span className={`px-3 py-1 text-xs rounded-sm ${
              notif.type === 'success'
                ? 'bg-green-900/40 text-green-400'
                : 'bg-red-900/40 text-red-400'
            }`}>
              {notif.text}
            </span>
          )}
        </div>
      </div>

      {/* User selector */}
      <div className="flex items-center gap-3 mb-6 p-4 glass rounded-sm border border-white/[0.06]">
        <span className="text-xs text-white/30 tracking-widest uppercase">User:</span>
        <select
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#ff6b6b]/40"
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.full_name || u.email || u.id} ({u.role || '—'})
            </option>
          ))}
        </select>
        <span className="text-xs text-white/30">
          {twin ? `Twin v${twin.version}` : 'No twin yet'}
        </span>
        {twin && (
          <span className="text-xs capitalize px-2 py-0.5 rounded-sm"
            style={{
              backgroundColor: twin.twin_status === 'active' ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)',
              color: twin.twin_status === 'active' ? '#34d399' : '#fb923c',
            }}
          >
            {twin.twin_status}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.06] pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium rounded-sm transition-all ${
              activeTab === tab.id
                ? 'bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20'
                : 'text-white/30 hover:text-white/60 border border-transparent'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel wrapper */}
      {loadingTwin ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-[#ff6b6b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ════════════════════ OVERVIEW ════════════════════ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Main — 2/3 */}
              <div className="lg:col-span-2 space-y-6">

                {/* Identity + inline edit */}
                <div className="glass rounded-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-full bg-[#ff6b6b]/10 border-2 border-[#ff6b6b]/30 flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-[#ff6b6b]">
                          {selectedUser?.full_name?.charAt(0) ?? selectedUser?.email?.charAt(0) ?? '?'}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-semibold">
                          {editFields.name || `Twin of ${selectedUser?.full_name || selectedUser?.email || 'User'}`}
                        </h2>
                        <p className="text-xs text-white/40">
                          {selectedUser?.email} &bull; {selectedUser?.role || '—'}
                        </p>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          v{twin?.version ?? 1} &bull; {twin?.engagement_score ?? '—'}% engagement &bull; {twin?.confidence_score ?? '—'}% confidence
                        </p>
                      </div>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] text-white/40 mb-1">Twin Name</label>
                          <input
                            type="text"
                            value={editFields.name}
                            onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-white/40 mb-1">Twin Status</label>
                          <select
                            value={editFields.twin_status}
                            onChange={e => handleToggleStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-white/40 mb-1">Personality Summary</label>
                        <textarea
                          value={editFields.personality_summary}
                          onChange={e => setEditFields(f => ({ ...f, personality_summary: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] text-white/40 mb-1">Communication Style</label>
                          <textarea
                            value={editFields.communication_style}
                            onChange={e => setEditFields(f => ({ ...f, communication_style: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-white/40 mb-1">Preference Summary</label>
                          <textarea
                            value={editFields.preference_summary}
                            onChange={e => setEditFields(f => ({ ...f, preference_summary: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 resize-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] text-white/40 mb-1">Autonomy</label>
                          <select
                            value={editFields.autonomy_level}
                            onChange={e => setEditFields(f => ({ ...f, autonomy_level: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70"
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
                            className="w-full accent-[#ff6b6b]"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editFields.memory_enabled}
                              onChange={e => setEditFields(f => ({ ...f, memory_enabled: e.target.checked }))}
                              className="accent-[#ff6b6b]"
                            />
                            <span className="text-sm text-white/60">Memory On</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={handleSaveOverview}
                          className="px-5 py-2 bg-[#ff6b6b] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={loadTwinData}
                          className="px-4 py-2 border border-white/10 text-white/30 text-xs rounded-sm hover:border-white/30 transition-all"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="px-6 py-5">
                    <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Metrics</div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Engagement', value: twin?.engagement_score ?? 0, color: '#ff6b6b' },
                        { label: 'Confidence', value: twin?.confidence_score ?? 0, color: '#00d4ff' },
                        { label: 'Loyalty', value: twin?.loyalty_score ?? 0, color: '#a78bfa' },
                        { label: 'Intel', value: twin?.intelligence_score ?? 0, color: '#fb923c' },
                      ].map(s => (
                        <div key={s.label} className="bg-white/[0.03] rounded-sm p-3 border border-white/[0.06]">
                          <div className="text-[10px] text-white/30 uppercase mb-1">{s.label}</div>
                          <div className="text-lg font-semibold" style={{ color: s.color }}>{s.value}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar — 1/3 */}
              <div className="space-y-4">
                <div className="glass rounded-sm p-4 border border-white/[0.06]">
                  <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Twin Details</div>
                  <dl className="space-y-2 text-sm">
                    {[
                      ['Status', editFields.twin_status],
                      ['Version', `v${twin?.version ?? 1}`],
                      ['Autonomy', editFields.autonomy_level.replace('_', ' ')],
                      ['Memory', editFields.memory_enabled ? 'Enabled' : 'Disabled'],
                      ['Memory Score', `${twin?.memory_score ?? 0}%`],
                      ['Updated', twin?.updated_at ? new Date(twin.updated_at).toLocaleDateString() : '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <dt className="text-white/30 text-xs">{label}</dt>
                        <dd className="text-white/60 text-xs capitalize">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="glass rounded-sm p-4 border border-white/[0.06]">
                  <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Quick Actions</div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('memory')}
                      className="block w-full px-3 py-2 text-xs text-white/50 border border-white/10 rounded-sm hover:border-white/30 hover:text-white/70 transition-all text-left"
                    >
                      View Memories &rarr;
                    </button>
                    <button
                      onClick={() => setActiveTab('trainings')}
                      className="block w-full px-3 py-2 text-xs text-white/50 border border-white/10 rounded-sm hover:border-white/30 hover:text-white/70 transition-all text-left"
                    >
                      Manage Training &rarr;
                    </button>
                    <button
                      onClick={() => setActiveTab('connections')}
                      className="block w-full px-3 py-2 text-xs text-white/50 border border-white/10 rounded-sm hover:border-white/30 hover:text-white/70 transition-all text-left"
                    >
                      Connections &amp; Deploy &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ MEMORY ════════════════════ */}
          {activeTab === 'memory' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="text"
                    value={memorySearch}
                    onChange={e => setMemorySearch(e.target.value)}
                    placeholder="Search memories..."
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 pl-8 focus:outline-none focus:border-[#ff6b6b]/40"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20">&#x1F50D;</span>
                </div>
                {memoryTypes.length > 0 && (
                  <select
                    value={memoryTypeFilter}
                    onChange={e => setMemoryTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/50 focus:outline-none focus:border-[#ff6b6b]/40"
                  >
                    <option value="">All types</option>
                    {memoryTypes.map(t => (
                      <option key={t} value={t ?? ''}>{t?.replace('_', ' ') ?? 'unknown'}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={loadTwinData}
                  className="px-3 py-2 border border-white/10 text-white/30 text-xs rounded-sm hover:border-white/30 transition-all"
                >
                  Refresh
                </button>
                <span className="text-xs text-white/20">{memories.length} memories</span>
              </div>

              {memoriesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-5 h-5 border-2 border-[#ff6b6b] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredMemories.length === 0 ? (
                <div className="glass rounded-sm p-8 text-center">
                  <div className="text-2xl mb-3">&#x1F4DA;</div>
                  <p className="text-sm text-white/30">No memories for this user</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMemories.map(m => (
                    <div key={m.id}
                      className="glass rounded-sm p-4 border border-white/[0.06] hover:border-white/[0.1] transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg shrink-0 mt-0.5">
                          {MEMORY_TYPE_ICON[m.memory_type ?? ''] ?? '\uD83D\uDCC4'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] text-white/30 uppercase tracking-wider border border-white/[0.06] px-1.5 py-0.5 rounded-sm">
                              {m.memory_type ?? 'memory'}
                            </span>
                            {m.title && <span className="text-xs text-white/50 font-medium">{m.title}</span>}
                            <span className="text-[10px] text-white/20 ml-auto">
                              {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                            </span>
                          </div>
                          <p className="text-sm text-white/60 line-clamp-3">{m.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          disabled={deletingMemoryId === m.id}
                          className="shrink-0 opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] text-red-400/50 hover:text-red-400 border border-transparent hover:border-red-400/30 rounded-sm transition-all"
                        >
                          {deletingMemoryId === m.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════ TRAININGS ════════════════════ */}
          {activeTab === 'trainings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">

                {/* Instructions */}
                <div className="glass rounded-sm p-5 border border-white/[0.06]">
                  <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Twin Instructions</div>
                  <p className="text-[11px] text-white/30 mb-3">
                    Define behavioral instructions for this user&apos;s twin.
                  </p>
                  <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={6}
                    placeholder="e.g. Always consider the user's Blueprint archetype when tailoring responses..."
                    className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#ff6b6b]/40 resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleSaveInstructions}
                      className="px-4 py-2 bg-[#ff6b6b] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
                    >
                      Save Instructions
                    </button>
                  </div>
                </div>

                {/* Knowledge Upload */}
                <div className="glass rounded-sm p-5 border border-white/[0.06]">
                  <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Knowledge Documents</div>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                      placeholder="Document title..."
                      className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#ff6b6b]/40"
                    />
                    <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} className="hidden" />
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
                        className="px-4 py-1.5 bg-[#ff6b6b] text-black text-[11px] font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                      <button onClick={() => setUploadFile(null)} className="px-2 py-1.5 text-white/30 text-[11px] hover:text-white/60">Cancel</button>
                    </div>
                  )}
                  {trainings.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <div className="text-[11px] text-white/30 tracking-widest uppercase mb-2">Uploaded ({trainings.length})</div>
                      {trainings.map((t: any) => (
                        <div key={t.id} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-sm border border-white/[0.06] group">
                          <span className="text-sm">&#x1F4D6;</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/60 truncate">{t.title}</p>
                            <p className="text-[10px] text-white/30">{t.type} &bull; {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</p>
                          </div>
                          <button onClick={() => handleDeleteTraining(t.id)}
                            className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] text-red-400/50 hover:text-red-400 transition-all">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {trainings.length === 0 && !uploadFile && (
                    <div className="text-center py-6"><p className="text-sm text-white/20">No knowledge documents for this user.</p></div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="glass rounded-sm p-4 border border-white/[0.06]">
                  <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Training Stats</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-white/40">Documents</span><span className="text-white/60">{trainings.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Instructions</span><span className="text-white/60">{instructions.length > 0 ? 'Set' : 'Not set'}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Memory</span><span className="text-white/60">{editFields.memory_enabled ? 'On' : 'Off'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ CONNECTIONS ════════════════════ */}
          {activeTab === 'connections' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">

                {/* Agents */}
                <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06]">
                    <span className="text-xs text-white/30 tracking-widest uppercase">Agents</span>
                    <span className="text-[10px] text-white/20 ml-2">{connectedAgentIds.length} connected</span>
                  </div>
                  {agents.length === 0 ? (
                    <div className="px-5 py-8 text-center"><p className="text-sm text-white/30">No agents available.</p></div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {agents.map(agent => {
                        const connected = connectedAgentIds.includes(agent.agent_id)
                        return (
                          <div key={agent.agent_id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-sm shrink-0">&#x2699;&#xFE0F;</span>
                              <div className="min-w-0">
                                <p className="text-sm text-white/70 font-medium truncate">{agent.name}</p>
                                {agent.tagline && <p className="text-[11px] text-white/30 truncate">{agent.tagline}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <button
                                onClick={() => handleToggleAgent(agent.agent_id)}
                                className={`px-3 py-1.5 text-[10px] font-bold rounded-sm transition-all ${
                                  connected
                                    ? 'bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20 hover:bg-red-900/20'
                                    : 'border border-white/10 text-white/30 hover:border-white/30 hover:text-white/60'
                                }`}
                              >
                                {connected ? 'Disconnect' : 'Connect'}
                              </button>
                              <button
                                onClick={() => handleDeployAgent(agent.agent_id, agent.name)}
                                disabled={deployLoading}
                                className="px-2 py-1.5 text-[10px] border border-white/10 text-white/20 rounded-sm hover:text-white/40 hover:border-white/30 transition-all disabled:opacity-40"
                                title="Deploy to this user"
                              >
                                Deploy
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Swarms */}
                <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06]">
                    <span className="text-xs text-white/30 tracking-widest uppercase">Swarms</span>
                    <span className="text-[10px] text-white/20 ml-2">{connectedSwarmIds.length} connected</span>
                  </div>
                  {swarms.length === 0 ? (
                    <div className="px-5 py-8 text-center"><p className="text-sm text-white/30">No swarms available.</p></div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {swarms.map(swarm => {
                        const connected = connectedSwarmIds.includes(swarm.swarm_id)
                        return (
                          <div key={swarm.swarm_id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-sm shrink-0">&#x1F578;&#xFE0F;</span>
                              <div className="min-w-0">
                                <p className="text-sm text-white/70 font-medium truncate">{swarm.name}</p>
                                {swarm.description && <p className="text-[11px] text-white/30 truncate">{swarm.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <button
                                onClick={() => handleToggleSwarm(swarm.swarm_id)}
                                className={`px-3 py-1.5 text-[10px] font-bold rounded-sm transition-all ${
                                  connected
                                    ? 'bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20 hover:bg-red-900/20'
                                    : 'border border-white/10 text-white/30 hover:border-white/30 hover:text-white/60'
                                }`}
                              >
                                {connected ? 'Disconnect' : 'Connect'}
                              </button>
                              <button
                                onClick={() => handleDeploySwarm(swarm.swarm_id, swarm.name)}
                                disabled={deployLoading}
                                className="px-2 py-1.5 text-[10px] border border-white/10 text-white/20 rounded-sm hover:text-white/40 hover:border-white/30 transition-all disabled:opacity-40"
                                title="Deploy to this user"
                              >
                                Deploy
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="glass rounded-sm p-4 border border-white/[0.06]">
                  <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Connection Summary</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-white/40">Agents</span><span className="text-white/60">{connectedAgentIds.length} / {agents.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Swarms</span><span className="text-white/60">{connectedSwarmIds.length} / {swarms.length}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
