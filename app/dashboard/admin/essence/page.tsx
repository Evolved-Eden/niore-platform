'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type EssenceRow = {
  id?: string
  type?: string | null
  content?: string | null
  status?: string | null
  created_at?: string | null
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  focus:        { label: 'Focus Priority',  icon: '🎯', color: '#ff6b6b' },
  optimization: { label: 'Optimization',    icon: '⚡', color: '#00d4ff' },
  timing:       { label: 'Timing',          icon: '🕐', color: '#a78bfa' },
  opportunity:  { label: 'Opportunity',     icon: '💡', color: '#34d399' },
  growth:       { label: 'Growth',          icon: '📈', color: '#fb923c' },
  brand:        { label: 'Brand',           icon: '✨', color: '#f472b6' },
  habit:        { label: 'Habit',           icon: '🔄', color: '#22d3ee' },
  action:       { label: 'Action',          icon: '✓', color: '#e879f9' },
}

export default function AdminEssencePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [items, setItems] = useState<EssenceRow[]>([])
  const [newItem, setNewItem] = useState<{ type: string; content: string }>({ type: 'focus', content: '' })
  const [generating, setGenerating] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: identity } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setName(identity?.full_name ?? user.email?.split('@')[0] ?? 'Admin')

      const { data: essenceRows } = await supabase
        .from('essence_intelligence')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      if (essenceRows) setItems(essenceRows as EssenceRow[])

      setLoading(false)
    }
    load()
  }, [router])

  async function addItem() {
    if (!newItem.content.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('essence_intelligence')
      .insert({
        client_id: user.id,
        type: newItem.type,
        content: newItem.content.trim(),
        status: 'active',
      })
      .select()
      .single()

    if (!error && data) {
      setItems(prev => [(data as any) as EssenceRow, ...prev])
      setNewItem({ type: 'focus', content: '' })
    }
  }

  async function generateDaily() {
    setGenerating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const res = await fetch('/api/zuri/essence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: user.id }),
      })
      if (res.ok) {
        const { data: fresh } = await supabase
          .from('essence_intelligence')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
        if (fresh) setItems(fresh as EssenceRow[])
      }
    } catch {}
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/20 text-sm">Loading essence board...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
            Essence <span className="text-[#ff6b6b]">Intel</span>
          </h1>
          <p className="text-white/30 text-sm">Daily intelligence signals and priorities for {name}</p>
        </div>
        <button
          onClick={generateDaily}
          disabled={generating}
          className="px-4 py-2 rounded-sm text-sm bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 text-[#ff6b6b] hover:bg-[#ff6b6b]/20 transition-colors disabled:opacity-40"
        >
          {generating ? 'Generating...' : 'Generate Daily ✦'}
        </button>
      </div>

      {/* Add new item */}
      <div className="glass rounded-sm p-4 mb-6 border border-white/[0.06]">
        <div className="flex items-start gap-3">
          <select
            value={newItem.type}
            onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))}
            className="shrink-0 bg-white/[0.04] border border-white/[0.1] rounded-sm px-2 py-2 text-xs text-white/60"
          >
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
            ))}
          </select>
          <textarea
            ref={inputRef}
            value={newItem.content}
            onChange={e => setNewItem(p => ({ ...p, content: e.target.value }))}
            placeholder="Add an essence signal..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white/80 placeholder-white/20 resize-none"
            rows={1}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addItem() } }}
          />
          <button
            onClick={addItem}
            className="shrink-0 px-4 py-2 rounded-sm text-sm bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Essence items */}
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-16">
            <div className="text-3xl mb-3 opacity-30">⊙</div>
            <p className="text-white/30 text-sm">No essence signals yet</p>
            <p className="text-white/20 text-xs mt-1">Add one above or generate daily intelligence</p>
          </div>
        )}

        {items.map(item => {
          const cfg = TYPE_CONFIG[item.type ?? ''] ?? { label: item.type ?? '', icon: '◈', color: '#fff' }
          return (
            <div key={item.id} className="glass rounded-sm p-4 border border-white/[0.06] flex items-start gap-4 group">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
                style={{ background: `${cfg.color}15` }}
              >
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{item.content}</p>
                {item.created_at && (
                  <p className="text-[10px] text-white/20 mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
