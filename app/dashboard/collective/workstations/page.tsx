'use client'

import { useState, useEffect, useCallback } from 'react'

type Workstation = {
  id: string
  name: string
  description: string | null
  status: string
  team_count: number
  created_at: string
}

/**
 * Collective "Workstations" -- breakout groups (Board, a Committee, a
 * Family sub-unit). Reuses the same departments table/API as
 * Workforce > Depts (a Business's "Department" and a Collective's
 * "Workstation" are the same underlying concept -- a named group that
 * Teams get assigned to) -- just framed differently here, with the
 * tier's max_workstations entitlement enforced as a real cap, not just a
 * displayed number.
 */
export default function CollectiveWorkstationsPage() {
  const [workstations, setWorkstations] = useState<Workstation[]>([])
  const [limit, setLimit] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [wsRes, entRes] = await Promise.all([
        fetch('/api/client/departments'),
        fetch('/api/client/entitlements'),
      ])
      if (wsRes.ok) {
        const data = await wsRes.json()
        setWorkstations(data.departments ?? [])
      }
      if (entRes.ok) {
        const data = await entRes.json()
        setLimit(data.entitlements?.max_workstations ?? null)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const atLimit = limit !== null && workstations.length >= limit

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/client/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create workstation')
      setName('')
      setDescription('')
      setShowForm(false)
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto py-16 text-center text-white/30 text-sm">Loading Workstations...</div>
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Workstations</h1>
          <p className="text-white/40 text-sm mt-1">
            Breakout groups within your Collective -- Board, Committees, sub-teams.
            {limit !== null && (
              <span className="text-white/30"> {workstations.length} of {limit} used.</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          disabled={atLimit && !showForm}
          className="px-4 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {showForm ? 'Cancel' : atLimit ? 'Limit Reached' : '+ New Workstation'}
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {atLimit && !showForm && (
        <div className="mb-6 px-4 py-3 rounded-sm bg-[#C9974A]/10 border border-[#C9974A]/20 text-[#C9974A] text-sm">
          You've reached your tier's Workstation limit ({limit}). Upgrade to Collective Growth or Scale for more.
        </div>
      )}

      {showForm && (
        <div className="glass rounded-sm border border-white/[0.06] p-5 space-y-4 mb-6">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Workstation Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Board of Directors"
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this group handles"
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="px-5 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
          >
            {creating ? 'Creating...' : 'Create Workstation'}
          </button>
        </div>
      )}

      {workstations.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No Workstations yet. Create one to organize your Collective.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workstations.map((ws) => (
            <div key={ws.id} className="glass rounded-sm border border-white/[0.06] p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display font-semibold text-white">{ws.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ws.status === 'active'
                    ? 'bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20'
                    : 'bg-white/5 text-white/30 border border-white/10'
                }`}>
                  {ws.status}
                </span>
              </div>
              {ws.description && <p className="text-xs text-white/40 mb-3">{ws.description}</p>}
              <p className="text-xs text-white/30">{ws.team_count} Team{ws.team_count !== 1 ? 's' : ''} assigned</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
