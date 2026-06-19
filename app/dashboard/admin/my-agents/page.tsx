'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
}

interface DeployedAgent {
  id: string
  agent_id: string
  agent_name: string
  role_type: string | null
  vertical: string | null
  status: string
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function AdminMyAgentsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'deployed' | 'available'>('deployed')
  const [userId, setUserId] = useState<string | null>(null)
  const [deployed, setDeployed] = useState<DeployedAgent[]>([])
  const [available, setAvailable] = useState<RegistryAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Load deployed agents
      const { data: dep } = await supabase
        .from('client_deployed_agents')
        .select('id, agent_id, agent_name, role_type, vertical, status, created_at')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      if (dep) setDeployed(dep as DeployedAgent[])

      // Load agent registry
      const { data: reg } = await supabase
        .from('agent_catalog')
        .select('*')
        .eq('is_system_agent', false)
        .order('name')
      if (reg) setAvailable(reg)

      setLoading(false)
    }
    load()
  }, [router])

  async function deployAgent(agent: RegistryAgent) {
    if (!userId || deploying) return
    setDeploying(agent.id)
    const supabase = createClient()
    const { error } = await supabase.from('client_deployed_agents').insert({
      client_id: userId,
      agent_id: agent.agent_id || agent.id,
      agent_name: agent.name,
      role_type: agent.agent_type || null,
      vertical: agent.category || null,
      status: 'active',
    })
    if (!error) {
      setDeployed(prev => [{
        id: 'temp-' + Date.now(),
        agent_id: agent.agent_id || agent.id,
        agent_name: agent.name,
        role_type: agent.agent_type || null,
        vertical: agent.category || null,
        status: 'active',
        created_at: new Date().toISOString(),
      }, ...prev])
      setAvailable(prev => prev.filter(a => a.id !== agent.id))
    }
    setDeploying(null)
  }

  const filteredAvailable = available.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.tagline || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/20 text-sm">Loading agents...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          My <span className="text-[#ff6b6b]">Agents</span>
        </h1>
        <p className="text-white/30 text-sm">Deploy and manage agents for personal use</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.06]">
        <button
          onClick={() => setTab('deployed')}
          className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === 'deployed' ? 'border-[#ff6b6b] text-white' : 'border-transparent text-white/30 hover:text-white/50'}`}
        >
          My Deployed ({deployed.length})
        </button>
        <button
          onClick={() => setTab('available')}
          className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === 'available' ? 'border-[#ff6b6b] text-white' : 'border-transparent text-white/30 hover:text-white/50'}`}
        >
          Available ({available.length})
        </button>
      </div>

      {tab === 'deployed' && (
        <div className="space-y-3">
          {deployed.length === 0 && (
            <div className="text-center py-16">
              <div className="text-3xl mb-3 opacity-30">⊕</div>
              <p className="text-white/30 text-sm mb-4">No agents deployed yet</p>
              <button
                onClick={() => setTab('available')}
                className="px-4 py-2 rounded-sm text-sm bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
              >
                Browse available agents
              </button>
            </div>
          )}
          {deployed.map(agent => (
            <div key={agent.id} className="glass rounded-sm p-4 border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff6b6b]/10 flex items-center justify-center text-sm text-[#ff6b6b]">
                  {agent.agent_name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm text-white/80 font-medium">{agent.agent_name}</div>
                  <div className="text-xs text-white/30">{agent.role_type || '—'} {agent.vertical ? `· ${agent.vertical}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-[10px] rounded-sm border uppercase tracking-wider ${STATUS_STYLES[agent.status] || ''}`}>
                  {agent.status}
                </span>
                <span className="text-[10px] text-white/20">{new Date(agent.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'available' && (
        <div>
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="w-full max-w-md bg-white/[0.04] border border-white/[0.1] rounded-sm px-3 py-2 text-sm text-white/60 placeholder-white/20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAvailable.map(agent => (
              <div key={agent.id} className="glass rounded-sm p-4 border border-white/[0.06] flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/80 font-medium mb-0.5">{agent.name}</div>
                  {agent.tagline && <div className="text-xs text-white/40 line-clamp-1">{agent.tagline}</div>}
                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.capabilities.slice(0, 3).map((cap, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-white/[0.04] text-white/30">{cap}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deployAgent(agent)}
                  disabled={deploying === agent.id}
                  className="shrink-0 px-3 py-1.5 rounded-sm text-xs bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 text-[#ff6b6b] hover:bg-[#ff6b6b]/20 transition-colors disabled:opacity-40"
                >
                  {deploying === agent.id ? '...' : 'Deploy'}
                </button>
              </div>
            ))}
          </div>
          {filteredAvailable.length === 0 && (
            <div className="text-center py-8 text-white/20 text-sm">No agents match your search</div>
          )}
        </div>
      )}
    </div>
  )
}
