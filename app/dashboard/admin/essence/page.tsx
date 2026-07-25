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

type DailyEssenceItem = {
  type: string
  content: string
  priority: 'high' | 'medium' | 'low'
}

type EssenceRange = 'daily' | 'weekly' | 'monthly'

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  focus:        { label: 'Focus Priority',  icon: '🎯', color: '#7A2E32' },
  optimization: { label: 'Optimization',    icon: '⚡', color: '#5E8B84' },
  timing:       { label: 'Timing',          icon: '🕐', color: '#8B7AA8' },
  opportunity:  { label: 'Opportunity',     icon: '💡', color: '#5E8B84' },
  growth:       { label: 'Growth',          icon: '📈', color: '#B5764A' },
  brand:        { label: 'Brand',           icon: '✨', color: '#C6A664' },
  habit:        { label: 'Habit',           icon: '🔄', color: '#8B7AA8' },
  action:       { label: 'Action',          icon: '✓', color: '#C9974A' },
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#7A2E32',
  medium: '#B5764A',
  low: '#8B7AA8',
}

export default function AdminEssencePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [storedItems, setStoredItems] = useState<EssenceRow[]>([])
  const [newItem, setNewItem] = useState<{ type: string; content: string }>({ type: 'focus', content: '' })
  const [generating, setGenerating] = useState(false)
  const [range, setRange] = useState<EssenceRange>('daily')

  // ── Context switcher: Personal vs real Organization/Collective memberships ──
  // The same person can hold multiple intelligence contexts at once -- their
  // own Personal essence, their Business's, a Family Collective they belong
  // to. This is driven by their actual organization_members rows, not a
  // fixed enum -- a person could belong to 0, 1, or several organizations.
  type ContextOption = { id: string | null; label: string; type: string | null }
  const [contextOptions, setContextOptions] = useState<ContextOption[]>([{ id: null, label: 'Personal', type: null }])
  const [activeContext, setActiveContext] = useState<ContextOption>({ id: null, label: 'Personal', type: null })

  // Generated essence
  const [dailyItems, setDailyItems] = useState<DailyEssenceItem[]>([])
  const [dailyQuestion, setDailyQuestion] = useState('')
  const [provider, setProvider] = useState('')
  const [numerology, setNumerology] = useState<any>(null)
  const [color, setColor] = useState<any>(null)
  const [modality, setModality] = useState<any>(null)
  const [crystals, setCrystals] = useState<any[]>([])
  const [postingTime, setPostingTime] = useState<any>(null)
  const [businessMove, setBusinessMove] = useState<any>(null)
  const [personality, setPersonality] = useState('')
  const [blueprintTile, setBlueprintTile] = useState<any>(null)
  const [domainTiles, setDomainTiles] = useState<any[]>([])

  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: _user } } = await supabase.auth.getUser()
      const user = _user!

      const { data: identity } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setName(identity?.full_name ?? user.email?.split('@')[0] ?? 'Admin')

      const { data: essenceRows } = await supabase
        .from('essintelligence')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      if (essenceRows) setStoredItems(essenceRows as EssenceRow[])

      // Real memberships -- however many organizations/collectives this
      // person actually belongs to, not a fixed enum.
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id, organizations:organization_id(name, organization_type)')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (memberships?.length) {
        const orgOptions: ContextOption[] = memberships.map((m: any) => ({
          id: m.organization_id,
          label: m.organizations?.name ?? 'Organization',
          type: m.organizations?.organization_type ?? null,
        }))
        setContextOptions([{ id: null, label: 'Personal', type: null }, ...orgOptions])
      }

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
      .from('essintelligence')
      .insert({
        client_id: user.id,
        type: newItem.type,
        content: newItem.content.trim(),
        status: 'active',
      })
      .select()
      .single()

    if (!error && data) {
      setStoredItems(prev => [(data as any) as EssenceRow, ...prev])
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
        body: JSON.stringify({ userId: user.id, userRole: 'admin', range, organizationId: activeContext.id }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.items?.length) setDailyItems(data.items)
        if (data.dailyQuestion) setDailyQuestion(data.dailyQuestion)
        if (data.provider) setProvider(data.provider)
        setNumerology(data.numerology ?? null)
        setColor(data.color ?? null)
        setModality(data.modality ?? null)
        setCrystals(data.crystals ?? [])
        setPostingTime(data.postingTime ?? null)
        setBusinessMove(data.businessMove ?? null)
        setPersonality(data.personality ?? '')
        setBlueprintTile(data.blueprint ?? null)
        setDomainTiles(data.domainTiles ?? [])
      }
    } catch (e) {
      console.error('Essence generation failed:', e)
    }
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
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
            Essence <span className="text-[#7A2E32]">Intel</span>
          </h1>
          <p className="text-white/30 text-sm">Daily intelligence signals and priorities for {name}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Context switcher: Personal + each real organization/collective membership */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-sm p-1 border border-white/[0.06]">
            {contextOptions.map((opt) => (
              <button
                key={opt.id ?? 'personal'}
                onClick={() => setActiveContext(opt)}
                title={opt.type ? `${opt.label} (${opt.type})` : opt.label}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                  activeContext.id === opt.id ? 'bg-[#C6A664] text-black' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Range selector */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-sm p-1 border border-white/[0.06]">
            {(['daily', 'weekly', 'monthly'] as EssenceRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm capitalize transition-colors ${
                  range === r ? 'bg-[#7A2E32] text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={generateDaily}
            disabled={generating}
            className="px-4 py-2 rounded-sm text-sm bg-[#7A2E32] text-white hover:bg-[#7A2E32]/80 transition-colors disabled:opacity-40"
          >
            {generating ? 'Generating...' : `Generate ${range} ✦`}
          </button>
        </div>
      </div>

      {activeContext.id !== null && (
        <div className="mb-6 px-4 py-3 rounded-sm bg-[#C6A664]/5 border border-[#C6A664]/15 text-sm">
          <span className="text-[#C6A664] font-medium">{activeContext.label} context</span>
          <span className="text-white/40"> -- generation and memory below are scoped to this organization, separate from your Personal essence.</span>
        </div>
      )}

      {/* Generated Essence Board */}
      {dailyItems.length > 0 && (
        <div className="glass rounded-sm border border-[#7A2E32]/15 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7A2E32] animate-pulse-slow" />
              <span className="text-xs text-[#7A2E32] tracking-widest uppercase font-medium">
                Generated Essence — {range}
              </span>
              {provider && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/40 uppercase">
                  {provider}
                </span>
              )}
            </div>
          </div>

          {/* Multi-lens tiles */}
          {(numerology || color || modality || crystals.length > 0 || postingTime || businessMove) && (
            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 border-b border-white/[0.06]">
              {numerology && (
                <div className="bg-white/[0.03] rounded-sm p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Numerology</div>
                  <div className="text-lg font-bold text-[#7A2E32]">{numerology.number}</div>
                  <div className="text-[11px] text-white/40">{numerology.label}</div>
                </div>
              )}
              {color && (
                <div className="bg-white/[0.03] rounded-sm p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Your Color</div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} />
                    <span className="text-sm font-semibold">{color.name}</span>
                  </div>
                  <div className="text-[11px] text-white/40 mt-1">{color.reason}</div>
                </div>
              )}
              {modality && (
                <div className="bg-white/[0.03] rounded-sm p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Modality</div>
                  <div className="text-sm font-semibold capitalize">{modality.type}{modality.sign ? ` (${modality.sign})` : ''}</div>
                  <div className="text-[11px] text-white/40 mt-1">{modality.reason}</div>
                </div>
              )}
              {crystals.length > 0 && (
                <div className="bg-white/[0.03] rounded-sm p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Crystal{crystals.length > 1 ? 's' : ''}</div>
                  <div className="text-sm font-semibold">{crystals.map((c: any) => c.name).join(', ')}</div>
                  <div className="text-[11px] text-white/40 mt-1">{crystals[0]?.reason}</div>
                </div>
              )}
              {postingTime && (
                <div className="bg-white/[0.03] rounded-sm p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Best Time to Post</div>
                  <div className="text-sm font-semibold">{postingTime.window}</div>
                  <div className="text-[11px] text-white/40 mt-1">{postingTime.reason}</div>
                </div>
              )}
              {businessMove && (
                <div className="bg-white/[0.03] rounded-sm p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Business Move{businessMove.hdType ? ` — ${businessMove.hdType}` : ''}</div>
                  <div className="text-[11px] text-white/60">{businessMove.action}</div>
                </div>
              )}
            </div>
          )}

          {/* Personality */}
          {personality && (
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Personality</div>
              <div className="text-[11px] text-white/60">{personality}</div>
            </div>
          )}

          {/* Essence items */}
          <div className="divide-y divide-white/[0.04]">
            {dailyItems.map((item, i) => {
              const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.action
              return (
                <div key={i} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: PRIORITY_COLORS[item.priority] ?? '#8B7AA8' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs" style={{ color: config.color }}>{config.icon}</span>
                        <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
                        <span className="text-[9px] uppercase tracking-widest" style={{ color: PRIORITY_COLORS[item.priority] ?? '#8B7AA8' }}>{item.priority}</span>
                      </div>
                      <p className="text-sm text-white/70">{item.content}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Daily question */}
          {dailyQuestion && (
            <div className="px-5 py-4 bg-white/[0.02] border-t border-white/[0.06]">
              <div className="flex items-start gap-3">
                <span className="text-sm shrink-0 mt-0.5 opacity-60">💭</span>
                <div>
                  <p className="text-xs text-white/30 mb-1">Daily Intelligence Question</p>
                  <p className="text-sm text-white/60 italic">&ldquo;{dailyQuestion}&rdquo;</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blueprint tile */}
      {blueprintTile && (
        <div className="mb-6 glass rounded-sm border border-white/[0.06] p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#7A2E32] font-medium">Blueprint</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 uppercase">{blueprintTile.tier}</span>
            </div>
            {blueprintTile.agentsUsed?.length > 0 && (
              <span className="text-[10px] text-white/30">{blueprintTile.agentsUsed.join(' + ')}</span>
            )}
          </div>
          <p className="text-sm text-white/70 whitespace-pre-line">{blueprintTile.content}</p>
          {blueprintTile.upgradeMessage && (
            <Link href="/dashboard/client/blueprint?upgrade=expanded" className="inline-block mt-3 text-xs font-medium text-[#7A2E32] hover:underline">
              {blueprintTile.upgradeMessage} →
            </Link>
          )}
        </div>
      )}

      {/* Domain tiles */}
      {domainTiles.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {domainTiles.map((d: any) => (
            <div key={d.domain} className="glass rounded-sm border border-white/[0.06] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest text-white/30">{d.label} Module</span>
                <span className="text-[10px] text-[#7A2E32] font-semibold">{d.score}/100</span>
              </div>
              {d.insight && <p className="text-[11px] text-white/60">{d.insight}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {dailyItems.length === 0 && storedItems.length === 0 && (
        <div className="text-center py-12 mb-6">
          <div className="text-3xl mb-3 opacity-30">⊙</div>
          <p className="text-white/30 text-sm">Generate your daily essence to see AI-powered intelligence here</p>
          <p className="text-white/20 text-xs mt-1">Or manually add signals below</p>
        </div>
      )}

      {/* ── Manual add — stored intelligence ── */}
      <div className="glass rounded-sm p-4 mb-6 border border-white/[0.06]">
        <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Manual Signal</div>
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

      {/* Stored intelligence items */}
      {storedItems.length > 0 && (
        <div>
          <div className="text-xs text-white/20 tracking-widest uppercase mb-3">Stored Signals</div>
          <div className="space-y-3">
            {storedItems.map(item => {
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
      )}
    </div>
  )
}
