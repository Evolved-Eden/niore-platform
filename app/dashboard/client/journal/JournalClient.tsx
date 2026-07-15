'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Entry = {
  id: string
  title: string | null
  content: string
  mood: string | null
  shared_with: string[]
  created_at: string
}

type SharedEntry = {
  id: string
  title: string | null
  content: string
  mood: string | null
  created_at: string
  users?: { full_name: string | null }
}

const GOLD = '#C6A664'
const PLUM = '#8B7AA8'

export default function JournalClient({ initialEntries, sharedWithMe, myOrgs }: { initialEntries: Entry[]; sharedWithMe: SharedEntry[]; myOrgs: { id: string; name: string }[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<'mine' | 'shared'>('mine')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [posting, setPosting] = useState(false)
  const [shareTarget, setShareTarget] = useState<string | null>(null)
  const [shareMode, setShareMode] = useState<'person' | 'org' | 'roles'>('person')
  const [shareIdentifierType, setShareIdentifierType] = useState<'email' | 'username' | 'phone'>('email')
  const [shareEmail, setShareEmail] = useState('')
  const [shareOrgId, setShareOrgId] = useState<string>(myOrgs[0]?.id || '')
  const [shareRoles, setShareRoles] = useState<string[]>(['member'])
  const [error, setError] = useState<string | null>(null)

  async function post() {
    if (!content.trim()) return
    setPosting(true)
    setError(null)
    try {
      const res = await fetch('/api/client/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || undefined, content }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setContent('')
      setTitle('')
      router.refresh()
    } finally {
      setPosting(false)
    }
  }

  async function share(entryId: string) {
    setError(null)
    const shareKey = shareIdentifierType === 'email' ? 'shareWithEmail' : shareIdentifierType === 'username' ? 'shareWithUsername' : 'shareWithPhone'
    const payload: Record<string, unknown> =
      shareMode === 'person'
        ? { [shareKey]: shareEmail.trim() }
        : shareMode === 'org'
        ? { shareWithOrg: shareOrgId }
        : { shareWithRoles: { organizationId: shareOrgId, roles: shareRoles } }

    if (shareMode === 'person' && !shareEmail.trim()) return

    const res = await fetch(`/api/client/journal/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); return }
    setShareEmail('')
    setShareTarget(null)
    router.refresh()
  }

  async function unshare(entryId: string, userId: string) {
    await fetch(`/api/client/journal/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unshareUserId: userId }),
    })
    router.refresh()
  }

  async function remove(entryId: string) {
    await fetch(`/api/client/journal/${entryId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('mine')}
          className="px-4 py-2 text-xs rounded-full"
          style={tab === 'mine' ? { backgroundColor: GOLD, color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
        >
          My Entries
        </button>
        <button
          onClick={() => setTab('shared')}
          className="px-4 py-2 text-xs rounded-full flex items-center gap-2"
          style={tab === 'shared' ? { backgroundColor: GOLD, color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
        >
          Shared With Me
          {sharedWithMe.length > 0 && <span className="px-1.5 bg-white/10 rounded-full">{sharedWithMe.length}</span>}
        </button>
      </div>

      {tab === 'mine' ? (
        <>
          <div className="glass rounded-sm p-5 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full bg-transparent text-sm text-white/80 placeholder-white/20 mb-2 focus:outline-none"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely — no one sees this unless you choose to share it."
              rows={4}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#C6A664]/40"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={post}
                disabled={posting || !content.trim()}
                className="px-5 py-2 text-xs font-bold rounded-sm disabled:opacity-40"
                style={{ backgroundColor: GOLD, color: '#0A0A0B' }}
              >
                {posting ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>

          <div className="space-y-3">
            {initialEntries.map((e) => (
              <div key={e.id} className="glass rounded-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    {e.title && <p className="text-sm text-white/80 font-medium">{e.title}</p>}
                    <p className="text-[10px] text-white/20">{new Date(e.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {e.shared_with.length > 0 && (
                      <span className="text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm" style={{ color: PLUM, backgroundColor: `${PLUM}1a`, border: `1px solid ${PLUM}33` }}>
                        Shared ({e.shared_with.length})
                      </span>
                    )}
                    <button onClick={() => remove(e.id)} className="text-[10px] text-white/20 hover:text-red-400">Delete</button>
                  </div>
                </div>
                <p className="text-sm text-white/60 whitespace-pre-wrap">{e.content}</p>

                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {shareTarget === e.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button onClick={() => setShareMode('person')} className="px-2.5 py-1 text-[10px] rounded-sm" style={shareMode === 'person' ? { backgroundColor: GOLD, color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>Person</button>
                        {myOrgs.length > 0 && (
                          <>
                            <button onClick={() => setShareMode('org')} className="px-2.5 py-1 text-[10px] rounded-sm" style={shareMode === 'org' ? { backgroundColor: GOLD, color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>Whole Org</button>
                            <button onClick={() => setShareMode('roles')} className="px-2.5 py-1 text-[10px] rounded-sm" style={shareMode === 'roles' ? { backgroundColor: GOLD, color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>Specific Roles</button>
                          </>
                        )}
                      </div>

                      {shareMode === 'person' && (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1.5">
                            {(['email', 'username', 'phone'] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => setShareIdentifierType(t)}
                                className="px-2 py-0.5 text-[9px] rounded-sm capitalize"
                                style={shareIdentifierType === t ? { backgroundColor: PLUM, color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          <input
                            value={shareEmail}
                            onChange={(ev) => setShareEmail(ev.target.value)}
                            placeholder={`their ${shareIdentifierType}`}
                            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-1.5 text-xs text-white/80 focus:outline-none"
                          />
                        </div>
                      )}

                      {shareMode === 'org' && (
                        <select
                          value={shareOrgId}
                          onChange={(ev) => setShareOrgId(ev.target.value)}
                          className="bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-1.5 text-xs text-white/80"
                        >
                          {myOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      )}

                      {shareMode === 'roles' && (
                        <div className="flex flex-col gap-2">
                          <select
                            value={shareOrgId}
                            onChange={(ev) => setShareOrgId(ev.target.value)}
                            className="bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-1.5 text-xs text-white/80"
                          >
                            {myOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                          <div className="flex gap-3">
                            {['owner', 'admin', 'member'].map((r) => (
                              <label key={r} className="flex items-center gap-1.5 text-xs text-white/50">
                                <input
                                  type="checkbox"
                                  checked={shareRoles.includes(r)}
                                  onChange={(ev) =>
                                    setShareRoles((prev) => (ev.target.checked ? [...prev, r] : prev.filter((x) => x !== r)))
                                  }
                                />
                                {r}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => share(e.id)} className="px-3 py-1.5 text-[10px] font-bold rounded-sm" style={{ backgroundColor: GOLD, color: '#0A0A0B' }}>Share</button>
                        <button onClick={() => setShareTarget(null)} className="text-[10px] text-white/20">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShareTarget(e.id)} className="text-[10px] text-white/30 hover:text-[#C6A664]">+ Share with someone</button>
                  )}
                </div>
              </div>
            ))}
            {initialEntries.length === 0 && (
              <p className="text-sm text-white/30 text-center py-8">No entries yet.</p>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {sharedWithMe.map((e) => (
            <div key={e.id} className="glass rounded-sm p-5">
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: PLUM }}>
                Shared by {e.users?.full_name || 'someone'}
              </p>
              {e.title && <p className="text-sm text-white/80 font-medium">{e.title}</p>}
              <p className="text-sm text-white/60 whitespace-pre-wrap mt-1">{e.content}</p>
              <p className="text-[10px] text-white/20 mt-2">{new Date(e.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {sharedWithMe.length === 0 && (
            <p className="text-sm text-white/30 text-center py-8">Nothing's been shared with you yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
