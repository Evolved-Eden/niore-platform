'use client'

import { useState, useCallback } from 'react'

export default function AvatarsManager({ initialAvatars }: { initialAvatars: any[] }) {
  const [avatars, setAvatars] = useState(initialAvatars)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [edit, setEdit] = useState<any | null>(null)

  const api = useCallback(async (body: any) => {
    setMsg(null)
    const res = await fetch('/api/admin/avatars', {
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
    data.tone_tags = data.tone_tags ? data.tone_tags.split(',').map((s: string) => s.trim()).filter(Boolean) : []
    data.keywords = data.keywords ? data.keywords.split(',').map((s: string) => s.trim()).filter(Boolean) : []
    data.sort_order = parseInt(data.sort_order || '0')
    const ok = await api({ action: 'upsert', ...data })
    if (ok) {
      setMsg({ type: 'ok', text: 'Avatar saved' })
      setEdit(null)
      const res = await fetch('/api/admin/avatars').then(r => r.json())
      setAvatars(res.avatars || [])
      setTimeout(() => setMsg(null), 2000)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this avatar?')) return
    const ok = await api({ action: 'delete', id })
    if (ok) setAvatars(prev => prev.filter((v: any) => v.id !== id))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Avatars</h1>
          <p className="text-white/40 text-sm mt-1">{avatars.length} avatars</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span className={`text-xs px-3 py-1 rounded-sm ${msg.type === 'ok' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {msg.text}
            </span>
          )}
          <button onClick={() => setEdit({})} className="px-4 py-2 text-xs rounded-sm bg-[#C6A664]/20 text-[#C6A664] hover:bg-[#C6A664]/30">+ New Avatar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {avatars.length === 0 ? (
          <div className="col-span-full text-center text-white/30 text-sm py-12">No avatars found</div>
        ) : (
          avatars.map((a: any) => (
            <div key={a.id} className="glass rounded-sm p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-white/80 font-medium">{a.name}</div>
                  <div className="text-xs text-white/40 font-mono">{a.avatar_id || a.key}</div>
                </div>
                {a.is_active !== false && <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-sm">active</span>}
              </div>
              {a.archetype && <div className="text-xs text-white/40 mb-1">Archetype: {a.archetype}</div>}
              {a.bio && <div className="text-xs text-white/50 line-clamp-2 mb-2">{a.bio}</div>}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                <span className="text-xs text-white/30">Order: {a.sort_order}</span>
                <div className="flex gap-1">
                  <button onClick={() => setEdit(a)} className="px-2 py-1 text-xs rounded-sm bg-white/5 text-white/50 hover:text-white/80">Edit</button>
                  <button onClick={() => deleteItem(a.id)} className="px-2 py-1 text-xs rounded-sm bg-red-900/30 text-red-400 hover:bg-red-900/60">Del</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {edit !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white/80 mb-4">{edit.id ? 'Edit Avatar' : 'New Avatar'}</h3>
            <form onSubmit={save} className="space-y-3">
              <input type="hidden" name="id" value={edit.id || ''} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Avatar ID</label>
                  <input name="avatar_id" defaultValue={edit.avatar_id || edit.key || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Name</label>
                  <input name="name" defaultValue={edit.name || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Archetype</label>
                <input name="archetype" defaultValue={edit.archetype || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Bio</label>
                <textarea name="bio" defaultValue={edit.bio || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Tone Tags (comma-sep)</label>
                  <input name="tone_tags" defaultValue={(edit.tone_tags || []).join(', ')} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Keywords (comma-sep)</label>
                  <input name="keywords" defaultValue={(edit.keywords || []).join(', ')} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Sort Order</label>
                  <input name="sort_order" type="number" defaultValue={edit.sort_order ?? 0} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Avatar Key</label>
                  <input name="avatar_key" defaultValue={edit.avatar_key || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" />
                </div>
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
