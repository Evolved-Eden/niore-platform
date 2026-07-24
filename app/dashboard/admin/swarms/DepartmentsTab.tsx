'use client'

import { useState, useEffect, useCallback } from 'react'

type Department = {
  id: string
  name: string
  description: string | null
  status: string
  client_id: string
  clients: { full_name: string | null; email: string | null } | null
  created_at: string
}

export default function AdminDepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/departments')
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

  async function handleStatusToggle(dept: Department) {
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dept.id, status: dept.status === 'active' ? 'archived' : 'active' }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await fetchDepartments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
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
      <div>
        <h2 className="font-display text-lg font-semibold text-white">Departments</h2>
        <p className="text-xs text-white/40 mt-1">
          Every client's Departments across the platform. Clients create their own via their Workforce dashboard --
          this is a cross-client view for oversight, not primary creation.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {departments.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No departments created by any client yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Name</th>
                <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Client</th>
                <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Status</th>
                <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 text-sm text-white/80">{dept.name}</td>
                  <td className="px-4 py-4 text-sm text-white/50">{dept.clients?.full_name ?? dept.clients?.email ?? '—'}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      dept.status === 'active'
                        ? 'bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20'
                        : 'bg-white/5 text-white/30 border border-white/10'
                    }`}>
                      {dept.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleStatusToggle(dept)}
                        className="px-2.5 py-1 text-[10px] rounded-sm border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
                      >
                        {dept.status === 'active' ? 'Archive' : 'Reactivate'}
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="px-2.5 py-1 text-[10px] rounded-sm border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
