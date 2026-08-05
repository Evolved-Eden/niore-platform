'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SwarmTemplate {
  swarm_key?: string | null
  name?: string | null
  // swarm_catalog view doesn't project a `swarm_name` column (only `name`) --
  // optional here so callers' `t.swarm_name || t.name` fallback still works.
  swarm_name?: string | null
  description?: string | null
  vertical_key?: string | null
  member_agents?: string[] | null
  is_active?: boolean | null
}

interface DeployedSwarm {
  id: string
  swarm_id: string
  swarm_name: string
  vertical: string | null
  member_agent_ids: string[]
  status: string
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#7A2E32]/10 text-[#7A2E32] border-[#7A2E32]/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function AdminMySwarmsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'deployed' | 'available'>('deployed')
  const [userId, setUserId] = useState<string | null>(null)
  const [deployed, setDeployed] = useState<DeployedSwarm[]>([])
  const [templates, setTemplates] = useState<SwarmTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: _user } } = await supabase.auth.getUser()
      // Guaranteed non-null by root middleware
      const user = _user!
      setUserId(user.id)

      // Load deployed swarms
      const { data: dep } = await supabase
        .from('client_deployed_swarms')
        .select('id, swarm_id, swarm_name, vertical, member_agent_ids, status, created_at')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      if (dep) setDeployed(dep as DeployedSwarm[])

      // Load swarm templates from catalog
      const { data: templates } = await supabase
        .from('swarm_catalog')
        .select('*')
        .eq('is_active', true)
      if (templates) setTemplates(templates)

      setLoading(false)
    }
    load()
  }, [router])

  async function deploySwarm(template: SwarmTemplate) {
    if (!userId || deploying) return
    const key = template.swarm_key || template.name || ''
    setDeploying(key)
    const supabase = createClient()
    const { error } = await supabase.from('client_deployed_swarms').insert({
      client_id: userId,
      swarm_id: key,
      swarm_name: template.swarm_name || template.name || key,
      vertical: template.vertical_key || null,
      member_agent_ids: template.member_agents || [],
      status: 'active',
    } as any)
    if (!error) {
      setDeployed(prev => [{
        id: 'temp-' + Date.now(),
        swarm_id: key,
        swarm_name: template.swarm_name || template.name || key,
        vertical: template.vertical_key || null,
        member_agent_ids: template.member_agents || [],
        status: 'active',
        created_at: new Date().toISOString(),
      }, ...prev])
    }
    setDeploying(null)
  }

  const filteredTemplates = templates.filter(t =>
    !search ||
    (t.swarm_name || t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/20 text-sm">Loading swarms...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          My <span className="text-[#7A2E32]">Swarms</span>
        </h1>
        <p className="text-white/30 text-sm">Deploy and manage agent swarms for personal use</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.06]">
        <button
          onClick={() => setTab('deployed')}
          className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === 'deployed' ? 'border-[#7A2E32] text-white' : 'border-transparent text-white/30 hover:text-white/50'}`}
        >
          My Deployed ({deployed.length})
        </button>
        <button
          onClick={() => setTab('available')}
          className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === 'available' ? 'border-[#7A2E32] text-white' : 'border-transparent text-white/30 hover:text-white/50'}`}
        >
          Available ({templates.length})
        </button>
      </div>

      {tab === 'deployed' && (
        <div className="space-y-3">
          {deployed.length === 0 && (
            <div className="text-center py-16">
              <div className="text-3xl mb-3 opacity-30">⊗</div>
              <p className="text-white/30 text-sm mb-4">No swarms deployed yet</p>
              <button
                onClick={() => setTab('available')}
                className="px-4 py-2 rounded-sm text-sm bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
              >
                Browse available swarms
              </button>
            </div>
          )}
          {deployed.map(swarm => (
            <div key={swarm.id} className="glass rounded-sm p-4 border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7A2E32]/10 flex items-center justify-center text-sm text-[#7A2E32]">
                  {swarm.swarm_name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm text-white/80 font-medium">{swarm.swarm_name}</div>
                  <div className="text-xs text-white/30">{swarm.member_agent_ids?.length || 0} agents {swarm.vertical ? `· ${swarm.vertical}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-[10px] rounded-sm border uppercase tracking-wider ${STATUS_STYLES[swarm.status] || ''}`}>
                  {swarm.status}
                </span>
                <span className="text-[10px] text-white/20">{new Date(swarm.created_at).toLocaleDateString()}</span>
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
              placeholder="Search swarms..."
              className="w-full max-w-md bg-white/[0.04] border border-white/[0.1] rounded-sm px-3 py-2 text-sm text-white/60 placeholder-white/20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates.map(template => {
              const key = template.swarm_key || template.name || ''
              const name = template.swarm_name || template.name || key
              return (
                <div key={key} className="glass rounded-sm p-4 border border-white/[0.06] flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 font-medium mb-0.5">{name}</div>
                    {template.description && <div className="text-xs text-white/40 line-clamp-2">{template.description}</div>}
                    {template.member_agents && template.member_agents.length > 0 && (
                      <div className="text-[10px] text-white/30 mt-2">{template.member_agents.length} member agents</div>
                    )}
                  </div>
                  <button
                    onClick={() => deploySwarm(template)}
                    disabled={deploying === key}
                    className="shrink-0 px-3 py-1.5 rounded-sm text-xs bg-[#7A2E32]/10 border border-[#7A2E32]/20 text-[#7A2E32] hover:bg-[#7A2E32]/20 transition-colors disabled:opacity-40"
                  >
                    {deploying === key ? '...' : 'Deploy'}
                  </button>
                </div>
              )}
            )}
          </div>
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-white/20 text-sm">No swarms match your search</div>
          )}
        </div>
      )}
    </div>
  )
}
