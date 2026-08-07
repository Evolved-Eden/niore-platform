'use client'

import { useState, useCallback } from 'react'

export default function SpecialtiesManager({ initialSpecialties }: { initialSpecialties: any[] }) {
  const [specialties, setSpecialties] = useState(initialSpecialties)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [edit, setEdit] = useState<any | null>(null)

  const filtered = search
    ? specialties.filter((v: any) =>
        (v.name && v.name.toLowerCase().includes(search.toLowerCase())) ||
        (v.key && v.key.toLowerCase().includes(search.toLowerCase()))
      )
    : specialties

  const api = useCallback(async (body: any) => {
    setMsg(null)
    const res = await fetch('/api/admin/specialties', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setMsg({ type: 'err', text: data.error }); return false }
    return true
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(fd.entries()) as any
    data.is_active = !!data.is_active
    // Map form keys onto the specialties table schema
    data.category = data.category || null
    data.parent_specialty_id = data.parent_specialty_id || null
    const ok = await api({ action: 'upsert', ...data })
    if (ok) {
      setMsg({ type: 'ok', text: 'Specialty saved' })
      setEdit(null)
      const res = await fetch('/api/admin/specialties').then(r => r.json())
      setSpecialties(res.specialties || [])
      setTimeout(() => setMsg(null), 2000)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this specialty?')) return
    const ok = await api({ action: 'delete', id })
    if (ok) {
      setSpecialties(prev => prev.filter((v: any) => v.id !== id))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Specialties</h1>
          <p className="text-white/40 text-sm mt-1">{specialties.length} specialties</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span className={`text-xs px-3 py-1 rounded-sm ${msg.type === 'ok' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {msg.text}
            </span>
          )}
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-48 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none" />
          <button onClick={() => setEdit({})} className="px-4 py-2 text-xs rounded-sm bg-[#C6A664]/20 text-[#C6A664] hover:bg-[#C6A664]/30">+ New Specialty</button>
        </div>
      </div>

      <div className="glass rounded-sm overflow-hidden border border-white/[0.06]">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Name</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Key</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Icon</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Category</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Active</th>
              <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30 text-sm">No specialties found</td></tr>
            ) : (
              filtered.map((v: any) => (
                <tr key={v.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="text-sm text-white/80">{v.name}</div>
                    {v.description && <div className="text-xs text-white/40 truncate max-w-xs">{v.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/50 font-mono">{v.key || '—'}</td>
                  <td className="px-4 py-3 text-lg">{v.icon || '—'}</td>
                  <td className="px-4 py-3 text-sm text-white/50">{v.category || '—'}</td>
                  <td className="px-4 py-3">{v.is_active !== false ? '✅' : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEdit(v)} className="px-2 py-1 text-xs rounded-sm bg-white/5 text-white/50 hover:text-white/80">Edit</button>
                      <button onClick={() => deleteItem(v.id)} className="px-2 py-1 text-xs rounded-sm bg-red-900/30 text-red-400 hover:bg-red-900/60">Del</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {edit !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-lg w-full">
            <h3 className="text-lg font-semibold text-white/80 mb-4">{edit.id ? 'Edit Specialty' : 'New Specialty'}</h3>
            <form onSubmit={save} className="space-y-3">
              <input type="hidden" name="id" value={edit.id || ''} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Name</label>
                  <input name="name" defaultValue={edit.name || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Key</label>
                  <input name="key" defaultValue={edit.key || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Slug</label>
                  <input name="slug" defaultValue={edit.slug || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Icon</label>
                  <input name="icon" defaultValue={edit.icon || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Category</label>
                  <input name="category" defaultValue={edit.category || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Parent Specialty ID</label>
                  <input name="parent_specialty_id" defaultValue={edit.parent_specialty_id || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Description</label>
                <textarea name="description" defaultValue={edit.description || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" rows={2} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_active" defaultChecked={edit.is_active !== false} className="accent-[#C6A664]" />
                <span className="text-xs text-white/40">Active</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEdit(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-[#C6A664]/20 text-[#C6A664] hover:bg-[#C6A664]/30 rounded-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
