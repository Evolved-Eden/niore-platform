'use client'

import { useState, useEffect, useCallback } from 'react'
import { useClientView } from '@/lib/client-view'

interface Department {
  id: string
  client_id: string
  name: string
  description: string | null
  department_type: string | null
  status: string
  created_at: string
  updated_at: string
  team_count: number
}

interface DeployedSwarm {
  id: string
  client_id: string
  swarm_id: string
  swarm_name: string
  specialty: string | null
  member_agent_ids: string[]
  configuration: Record<string, unknown> | null
  department_id: string | null
  status: string
  created_at: string
  updated_at: string
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#C6A664]/10 text-[#C6A664] border-[#C6A664]/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  archived: 'bg-white/5 text-white/30 border-white/10',
}

const DEPARTMENT_TYPES = [
  'operations', 'sales', 'marketing', 'engineering', 'support', 'finance', 'hr', 'custom',
]

export default function ClientDepartmentsPage() {
  const { targetClientId } = useClientView()
  const clientIdParam = targetClientId ? `?clientId=${encodeURIComponent(targetClientId)}` : ''

  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [swarms, setSwarms] = useState<DeployedSwarm[]>([])
  const [swarmsLoading, setSwarmsLoading] = useState(true)

  const [modal, setModal] = useState<{ type: 'create' | 'edit'; department: Department | null } | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    departmentType: '',
  })

  const fetchDepartments = useCallback(() => {
    setDepartmentsLoading(true)
    fetch(`/api/client/departments${clientIdParam}`)
      .then(r => r.json())
      .then(data => {
        setDepartments(data.departments || [])
        setDepartmentsLoading(false)
      })
      .catch(() => setDepartmentsLoading(false))
  }, [clientIdParam])

  const fetchSwarms = useCallback(() => {
    setSwarmsLoading(true)
    fetch(`/api/client/swarms/deploy${clientIdParam}`)
      .then(r => r.json())
      .then(data => {
        setSwarms(data.swarms || [])
        setSwarmsLoading(false)
      })
      .catch(() => setSwarmsLoading(false))
  }, [clientIdParam])

  useEffect(() => {
    fetchDepartments()
    fetchSwarms()
  }, [fetchDepartments, fetchSwarms])

  const openCreateModal = () => {
    setForm({ name: '', description: '', departmentType: '' })
    setModal({ type: 'create', department: null })
  }

  const openEditModal = (dept: Department) => {
    setForm({
      name: dept.name,
      description: dept.description || '',
      departmentType: dept.department_type || '',
    })
    setModal({ type: 'edit', department: dept })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return

    const isCreate = modal?.type === 'create'
    const url = isCreate ? '/api/client/departments' : `/api/client/departments`
    const method = isCreate ? 'POST' : 'PATCH'

    try {
      const body = isCreate
        ? { name: form.name.trim(), description: form.description.trim(), departmentType: form.departmentType || null }
        : { id: modal!.department!.id, name: form.name.trim(), description: form.description.trim(), departmentType: form.departmentType || null }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: targetClientId || undefined, ...body }),
      })

      if (!res.ok) throw new Error((await res.json()).error || 'Failed')

      setModal(null)
      fetchDepartments()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleArchive = async (id: string) => {
    if (!window.confirm('Archive this department? Its teams will be unassigned.')) return

    try {
      await fetch('/api/client/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: targetClientId || undefined, id, status: 'archived' }),
      })
      fetchDepartments()
    } catch { }
  }

  const getSwarmsForDept = (deptId: string) => swarms.filter(s => s.department_id === deptId)

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Hero ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Departments</h1>
          <p className="text-white/40 text-sm mt-1">
            Organize your teams into departments (a department = a group of teams)
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
        >
          New Department
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-sm p-4 border border-white/[0.06]">
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Departments</div>
          <div className="text-2xl font-light text-white">{departments.length}</div>
        </div>
        <div className="glass rounded-sm p-4 border border-white/[0.06]">
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Active</div>
          <div className="text-2xl font-light text-[#C6A664]">{departments.filter(d => d.status === 'active').length}</div>
        </div>
        <div className="glass rounded-sm p-4 border border-white/[0.06]">
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Total Teams</div>
          <div className="text-2xl font-light text-[#5E8B84]">{departments.reduce((sum, d) => sum + d.team_count, 0)}</div>
        </div>
        <div className="glass rounded-sm p-4 border border-white/[0.06]">
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Unassigned Teams</div>
          <div className="text-2xl font-light text-white/50">{swarms.filter(s => !s.department_id).length}</div>
        </div>
      </div>

      {/* ── Departments Grid ── */}
      {departmentsLoading ? (
        <div className="text-center py-16 text-white/30 text-sm">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="glass rounded-sm p-10 text-center border border-white/[0.06]">
          <div className="text-4xl mb-4 opacity-30">🏢</div>
          <p className="text-white/50 text-sm">No departments yet.</p>
          <p className="text-white/30 text-xs mt-1">
            Create departments to organize your teams by function, region, or project.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-5 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
          >
            Create Your First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const deptSwarms = getSwarmsForDept(dept.id)
            return (
              <div
                key={dept.id}
                className="glass rounded-sm border border-white/[0.06] p-5 hover:border-white/15 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white/80 truncate">{dept.name}</h3>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">{dept.id.slice(0, 8)}...</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${STATUS_STYLES[dept.status] || 'bg-white/5 text-white/40 border-white/10'}`}>
                    {dept.status}
                  </span>
                </div>

                {/* Details */}
                {dept.description && (
                  <p className="text-xs text-white/40 leading-relaxed mb-2 line-clamp-2">{dept.description}</p>
                )}
                <div className="space-y-1 text-[10px] mb-3">
                  {dept.department_type && (
                    <div className="flex justify-between">
                      <span className="text-white/30">Type</span>
                      <span className="text-white/60 capitalize">{dept.department_type}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/30">Teams</span>
                    <span className="text-white/60">{dept.team_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Created</span>
                    <span className="text-white/60">{new Date(dept.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Teams in this department */}
                {deptSwarms.length > 0 && (
                  <div className="mb-3 p-3 bg-white/[0.02] rounded-sm">
                    <div className="text-[10px] text-white/30 mb-2">Teams ({deptSwarms.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {deptSwarms.slice(0, 4).map((swarm) => (
                        <span key={swarm.id} className="px-1.5 py-0.5 bg-white/5 text-white/60 border border-white/10 rounded text-[10px] font-mono">
                          {swarm.swarm_name}
                        </span>
                      ))}
                      {deptSwarms.length > 4 && (
                        <span className="px-1.5 py-0.5 text-white/30 text-[10px]">+{deptSwarms.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="px-2.5 py-1 text-[10px] bg-white/5 border border-white/10 rounded-sm text-white/50 hover:text-white"
                  >
                    Edit
                  </button>
                  {dept.status !== 'archived' && (
                    <button
                      onClick={() => handleArchive(dept.id)}
                      className="px-2.5 py-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-sm hover:bg-amber-500/20 ml-auto"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Unassigned Teams ── */}
      {swarms.filter(s => !s.department_id).length > 0 && (
        <div className="glass rounded-sm p-5 border border-white/[0.06] bg-amber-500/5 border-amber-500/10">
          <h3 className="font-display text-lg font-bold text-amber-400 mb-3">⚠ Unassigned Teams</h3>
          <p className="text-white/50 text-sm mb-3">
            {swarms.filter(s => !s.department_id).length} team(s) are not assigned to any department.
            Edit a department to assign them, or create a new department.
          </p>
          <div className="flex flex-wrap gap-2">
            {swarms.filter(s => !s.department_id).map((swarm) => (
              <span key={swarm.id} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-white/60">
                {swarm.swarm_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-sm border border-white/[0.06] p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  {modal.type === 'create' ? 'Create Department' : 'Edit Department'}
                </h2>
                <p className="text-xs text-white/40 mt-1">
                  {modal.type === 'create'
                    ? 'Organize your teams into a department'
                    : `Editing ${modal.department?.name}`}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-white/30 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Operations, Sales, Engineering..."
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description of this department's purpose"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Department Type</label>
                <select
                  value={form.departmentType}
                  onChange={e => setForm({ ...form, departmentType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
                >
                  <option value="">Select Type (optional)</option>
                  {DEPARTMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!form.name.trim()}
                  className="flex-1 px-5 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                >
                  {modal.type === 'create' ? 'Create' : 'Save'}
                </button>
                <button
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/60 text-xs rounded-sm hover:bg-white/10 hover:text-white/80"
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