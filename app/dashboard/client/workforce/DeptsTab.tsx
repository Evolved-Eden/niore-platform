'use client'

import { useState, useEffect, useCallback } from 'react'

type Department = {
  id: string
  name: string
  description: string | null
  department_type: string | null
  status: string
  team_count: number
  created_at: string
}

export default function ClientDepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/client/departments')
      if (!res.ok) throw new Error('Failed to load departments')
      const data = await res.json()
      setDepartments(data.departments ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDepartments() }, [fetchDepartments])

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
      if (!res.ok) throw new Error(data.error || 'Failed to create department')
      setName('')
      setDescription('')
      setShowForm(false)
      await fetchDepartments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleArchive(dept: Department) {
    try {
      const res = await fetch('/api/client/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dept.id, status: dept.status === 'active' ? 'archived' : 'active' }),
      })
      if (!res.ok) throw new Error('Failed to update department')
      await fetchDepartments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/client/departments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete department')
      await fetchDepartments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-white/30 text-sm">Loading departments...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Depts</h2>
          <p className="text-xs text-white/40 mt-1">Group your Teams into departments -- Marketing, Support, Ops, etc.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
        >
          {showForm ? 'Cancel' : '+ New Department'}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="glass rounded-sm border border-white/[0.06] p-5 space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Department Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing"
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this department handles"
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="px-5 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
          >
            {creating ? 'Creating...' : 'Create Department'}
          </button>
        </div>
      )}

      {departments.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">
          No departments yet. Create one to group your Teams.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="glass rounded-sm border border-white/[0.06] p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display font-semibold text-white">{dept.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  dept.status === 'active'
                    ? 'bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20'
                    : 'bg-white/5 text-white/30 border border-white/10'
                }`}>
                  {dept.status}
                </span>
              </div>
              {dept.description && <p className="text-xs text-white/40 mb-3">{dept.description}</p>}
              <p className="text-xs text-white/30 mb-4">{dept.team_count} Team{dept.team_count !== 1 ? 's' : ''} assigned</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleArchive(dept)}
                  className="flex-1 px-3 py-2 text-xs border border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-sm transition-all"
                >
                  {dept.status === 'active' ? 'Archive' : 'Reactivate'}
                </button>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="px-3 py-2 text-xs text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
