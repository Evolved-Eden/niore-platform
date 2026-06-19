'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type VaultEntry = {
  id: string
  title: string | null
  content: string | null
  source_type: string | null
  created_at: string | null
  metadata: Record<string, unknown> | null
}

export default function ClientVault() {
  const supabase = createClient()
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewNote, setShowNewNote] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('id, title, content, source_type, created_at, metadata')
      .eq('organization_id' as any, user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to load vault:', error)
      toast.error('Failed to load vault entries')
    } else {
      setEntries((data ?? []) as VaultEntry[])
    }
    setLoading(false)
  }

  async function createNote() {
    if (!noteTitle.trim()) {
      toast.error('Please enter a title')
      return
    }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Not authenticated')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('knowledge_base').insert({
      organization_id: user.id,
      title: noteTitle.trim(),
      content: noteContent.trim() || null,
      source_type: 'vault_note',
      metadata: { created_by: user.id, kind: 'note' },
    } as any)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Note saved')
      setShowNewNote(false)
      setNoteTitle('')
      setNoteContent('')
      loadEntries()
    }
    setSaving(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); return }

    setUploading(true)
    let uploaded = 0

    for (const file of Array.from(files)) {
      const path = `vault/${user.id}/${Date.now()}_${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('onboarding') // reuse existing bucket
        .upload(path, file)

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`)
        continue
      }

      // Log to knowledge_base
      const { error: dbError } = await supabase.from('knowledge_base').insert({
        organization_id: user.id,
        title: file.name,
        content: `Uploaded file: ${file.name}`,
        source_type: 'vault_upload',
        metadata: {
          storage_path: path,
          file_size: file.size,
          file_type: file.type,
          bucket: 'onboarding',
        },
      } as any)

      if (!dbError) uploaded++
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`)
      loadEntries()
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function deleteEntry(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); return }

    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id)
      .eq('organization_id' as any, user.id)

    if (error) {
      toast.error('Failed to delete')
    } else {
      toast.success('Entry removed')
      setEntries(prev => prev.filter(e => e.id !== id))
    }
  }

  const filtered = search
    ? entries.filter(e =>
        (e.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (e.content ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : entries

  const formatDate = (d: string | null) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  const getTypeBadge = (type: string | null) => {
    if (type === 'vault_note') return { label: 'Note', color: '#c8ff00' }
    if (type === 'vault_upload' || type === 'onboarding_upload') return { label: 'File', color: '#00d4ff' }
    return { label: type ?? 'Unknown', color: '#a78bfa' }
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
            Intelligence <span className="text-[#c8ff00]">Vault</span>
          </h1>
          <p className="text-white/30 text-sm">Secure knowledge and document storage</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 border border-white/10 text-white/60 text-xs rounded-sm hover:border-white/30 hover:text-white transition-all disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={() => setShowNewNote(true)}
            className="px-4 py-2 bg-[#c8ff00] text-black text-xs font-semibold rounded-sm hover:bg-white transition-all"
          >
            + New Note
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv,.md"
          onChange={handleFileUpload}
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vault..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-sm pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 transition-all"
          />
        </div>
      </div>

      {/* Vault entries */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/30 text-sm">Loading vault...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-white/40 text-sm mb-1">Your vault is empty</p>
          <p className="text-white/20 text-xs">Upload files or create notes to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry) => {
            const badge = getTypeBadge(entry.source_type)
            return (
              <div
                key={entry.id}
                className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all group"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-sm"
                    style={{
                      backgroundColor: `${badge.color}15`,
                      color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs"
                  >
                    Delete
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-medium text-sm text-white/80 mb-2 truncate">
                  {entry.title ?? 'Untitled'}
                </h3>

                {/* Preview */}
                {entry.content && (
                  <p className="text-xs text-white/40 line-clamp-3 mb-3">
                    {entry.content}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-white/20">
                    {formatDate(entry.created_at)}
                  </span>
                  {entry.source_type === 'vault_upload' && entry.metadata?.file_type ? (
                    <span className="text-[10px] text-white/20 uppercase">
                      {String(entry.metadata.file_type).split('/').pop()}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Note Modal */}
      {showNewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d0d1a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h2 className="font-display text-lg font-bold mb-4">New Note</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Content</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note..."
                  rows={6}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowNewNote(false); setNoteTitle(''); setNoteContent('') }}
                className="px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNote}
                disabled={saving || !noteTitle.trim()}
                className="px-5 py-2 bg-[#c8ff00] text-black text-sm font-semibold rounded-sm hover:bg-white transition-all disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
