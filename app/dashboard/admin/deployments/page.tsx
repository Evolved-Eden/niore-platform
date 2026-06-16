'use client'

import { useEffect, useState } from 'react'

export default function AdminDeploymentsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [addForm, setAddForm] = useState({ client_id: '', agent_id: '', agent_name: '', role_type: 'VERTICAL' })

  const fetchDeployments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/deployments')
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setClients(d.clients || [])
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { fetchDeployments() }, [])

  const handleAddAgent = async () => {
    if (!addForm.client_id || !addForm.agent_name) return
    try {
      const res = await fetch('/api/admin/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, action: 'add_agent' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setAddForm({ client_id: '', agent_id: '', agent_name: '', role_type: 'VERTICAL' })
      fetchDeployments()
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
      fetchDeployments()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Client Deployments</h1>
          <p className="text-white/40 text-sm mt-1">Manage agents deployed to client dashboards</p>
        </div>
        <button onClick={fetchDeployments} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">
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
            <div className="text-white/40 text-sm py-8 text-center">No client deployments found.</div>
          )}
          {clients.map((c: any) => (
            <div key={c.client.id} className="glass rounded-sm border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setExpandedClient(expandedClient === c.client.id ? null : c.client.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div>
                  <p className="text-white font-medium">{c.client.full_name || c.client.email}</p>
                  <p className="text-xs text-white/40">{c.client.email} · {c.client.plan_tier_key || 'no plan'} · {c.client.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-white/5 rounded-full px-2 py-1 text-white/40">{c.agents.length} agent{c.agents.length !== 1 ? 's' : ''}</span>
                  <span className="text-white/20">{expandedClient === c.client.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedClient === c.client.id && (
                <div className="border-t border-white/[0.06] p-4 space-y-4">
                  {/* Existing agents */}
                  {c.agents.length === 0 && (
                    <p className="text-xs text-white/30">No agents deployed yet.</p>
                  )}
                  {c.agents.map((a: any) => (
                    <div key={a.agent_id} className="flex items-center justify-between bg-white/[0.02] rounded-sm px-3 py-2">
                      <div>
                        <p className="text-sm text-white">{a.agent_name}</p>
                        <p className="text-xs text-white/40">{a.role_type} · {a.status} · {a.health_status}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveAgent(c.client.id, a.agent_id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {/* Add agent form */}
                  <div className="border-t border-white/[0.06] pt-4">
                    <p className="text-xs font-medium text-white/50 mb-2">Deploy New Agent</p>
                    <div className="flex flex-wrap gap-2 items-end">
                      <input
                        placeholder="Agent ID (slug)"
                        value={addForm.client_id === c.client.id ? addForm.agent_id : ''}
                        onChange={(e) => setAddForm({ ...addForm, client_id: c.client.id, agent_id: e.target.value })}
                        className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-sm px-2 py-1.5 text-xs text-white/70 placeholder-white/30"
                      />
                      <input
                        placeholder="Agent Name"
                        value={addForm.client_id === c.client.id ? addForm.agent_name : ''}
                        onChange={(e) => setAddForm({ ...addForm, client_id: c.client.id, agent_name: e.target.value })}
                        className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-sm px-2 py-1.5 text-xs text-white/70 placeholder-white/30"
                      />
                      <select
                        value={addForm.client_id === c.client.id ? addForm.role_type : 'VERTICAL'}
                        onChange={(e) => setAddForm({ ...addForm, client_id: c.client.id, role_type: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-sm px-2 py-1.5 text-xs text-white/70"
                      >
                        <option value="VERTICAL">Vertical</option>
                        <option value="CORE">Core</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                      <button
                        onClick={handleAddAgent}
                        className="px-3 py-1.5 text-xs font-medium bg-[#c8ff00] text-black rounded-sm hover:bg-white transition-colors"
                      >
                        Deploy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
