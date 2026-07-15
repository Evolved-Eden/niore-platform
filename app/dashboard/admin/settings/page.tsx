'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────
type ConfigEntry = {
  key: string
  value: string
  value_type: string
  category: string
  description: string | null
  updated_at: string
  source: 'db' | 'env'
  env_value: string | null
}

type EnvOnlyEntry = {
  key: string
  value: string
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  ai:        { label: 'AI Configuration',      icon: '◈', color: '#C6A664' },
  n8n:       { label: 'n8n Automation',        icon: '↻', color: '#5E8B84' },
  stripe:    { label: 'Stripe',                icon: '✦', color: '#B5764A' },
  connector: { label: 'Connectors',             icon: '◆', color: '#8B7AA8' },
  general:   { label: 'General',               icon: '⊙', color: '#5E8B84' },
}

const VALUE_TYPE_OPTIONS = ['string', 'number', 'boolean', 'json']
const CATEGORY_OPTIONS = ['ai', 'n8n', 'stripe', 'connector', 'general']

// ── Password field ──────────────────────────────────────────────
function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-xs text-white/70 font-mono focus:outline-none focus:border-[#C6A664]/40 transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 text-[10px]"
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([])
  const [envOnly, setEnvOnly] = useState<EnvOnlyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [editingValues, setEditingValues] = useState<Record<string, string>>({})

  // Add new modal
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newType, setNewType] = useState('string')
  const [newCategory, setNewCategory] = useState('general')
  const [newDesc, setNewDesc] = useState('')

  // ── Fetch ──
  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setConfigs(data.configs || [])
        setEnvOnly(data.envOnly || [])
        // Init editing values
        const vals: Record<string, string> = {}
        for (const c of data.configs || []) {
          // Never show real secrets in the form
          vals[c.key] = isSecretKey(c.key) ? '' : c.value
        }
        setEditingValues(vals)
      }
    } catch { } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  function isSecretKey(key: string): boolean {
    return /(_KEY|_TOKEN|_SECRET|_PASSWORD)$/i.test(key)
  }

  function isEnvOverride(key: string): boolean {
    const entry = configs.find(c => c.key === key)
    return entry?.source === 'env'
  }

  function getDisplayValue(key: string): string {
    const entry = configs.find(c => c.key === key)
    if (!entry) return '—'
    if (isSecretKey(key)) {
      if (entry.source === 'env' && entry.env_value) {
        return '•••••••• (from env)'
      }
      return entry.value ? '••••••••' : '(empty)'
    }
    if (entry.source === 'env' && entry.env_value) {
      return entry.env_value + ' (from env)'
    }
    return entry.value || '(empty)'
  }

  function getCategoryEntries(category: string): ConfigEntry[] {
    return configs.filter(c => c.category === category)
  }

  // ── Save ──
  async function handleSave(key: string) {
    setSaving(prev => ({ ...prev, [key]: true }))
    setMessage(null)
    try {
      const entry = configs.find(c => c.key === key)
      const value = editingValues[key] ?? entry?.value ?? ''
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value,
          value_type: entry?.value_type || 'string',
          category: entry?.category || 'general',
          description: entry?.description || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage({ type: 'ok', text: `Saved ${key}` })
      setTimeout(() => setMessage(null), 2000)
      await fetchConfigs()
    } catch (err: any) {
      setMessage({ type: 'err', text: err.message })
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  // ── Add new ──
  async function handleAdd() {
    if (!newKey.trim()) return
    setSaving(prev => ({ ...prev, ['__new']: true }))
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newKey.trim(),
          value: newValue,
          value_type: newType,
          category: newCategory,
          description: newDesc || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setShowAdd(false)
      setNewKey('')
      setNewValue('')
      setNewDesc('')
      setMessage({ type: 'ok', text: `Added ${newKey.trim()}` })
      setTimeout(() => setMessage(null), 2000)
      await fetchConfigs()
    } catch (err: any) {
      setMessage({ type: 'err', text: err.message })
    } finally {
      setSaving(prev => ({ ...prev, ['__new']: false }))
    }
  }

  // ── Delete ──
  async function handleDelete(key: string) {
    if (!window.confirm(`Delete ${key}? This cannot be undone.`)) return
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setMessage({ type: 'ok', text: `Deleted ${key}` })
      setTimeout(() => setMessage(null), 2000)
      await fetchConfigs()
    } catch (err: any) {
      setMessage({ type: 'err', text: err.message })
    }
  }

  // ── Render ──
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-center py-24">
          <div className="text-white/30 text-sm">Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage API keys, providers, and system configuration
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
        >
          + Add Setting
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-sm text-sm ${
          message.type === 'ok'
            ? 'bg-[#C6A664]/10 border border-[#C6A664]/20 text-[#C6A664]'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Env-only warning */}
      {envOnly.length > 0 && (
        <div className="glass rounded-sm border border-amber-500/20 p-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
            <span>⚠</span> Environment-only values
          </div>
          <p className="text-xs text-white/40 mb-2">
            These are set via .env.local and override any DB config. To manage from this panel, add them below.
          </p>
          <div className="flex flex-wrap gap-2">
            {envOnly.map(e => (
              <span key={e.key} className="px-2 py-1 bg-amber-500/10 text-amber-400/80 border border-amber-500/20 rounded text-[10px] font-mono">
                {e.key}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Category Sections ── */}
      {CATEGORY_OPTIONS.map(cat => {
        const entries = getCategoryEntries(cat)
        const meta = CATEGORY_META[cat] || { label: cat, icon: '○', color: '#ffffff40' }
        if (entries.length === 0) return null

        return (
          <div key={cat} className="glass rounded-sm border border-white/[0.06] overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="text-sm" style={{ color: meta.color }}>{meta.icon}</span>
              <div>
                <h2 className="font-display font-semibold text-white text-sm">{meta.label}</h2>
                <p className="text-[10px] text-white/30">{entries.length} setting{entries.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Entries */}
            <div className="divide-y divide-white/[0.04]">
              {entries.map(entry => (
                <div key={entry.key} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Key + badges */}
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs font-mono text-white/70">{entry.key}</code>
                        {entry.source === 'env' && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] uppercase tracking-wider">
                            Env
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-white/5 text-white/30 border border-white/10 rounded text-[9px]">
                          {entry.value_type}
                        </span>
                      </div>

                      {/* Description */}
                      {entry.description && (
                        <p className="text-[11px] text-white/30 mb-2">{entry.description}</p>
                      )}

                      {/* Current value (read-only display) */}
                      <div className="text-xs text-white/50 mb-2">
                        Current: <span className="text-white/40 font-mono">{getDisplayValue(entry.key)}</span>
                        {entry.updated_at && entry.source === 'db' && (
                          <span className="ml-2 text-white/20">
                            · updated {new Date(entry.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Edit field (only for DB-managed configs) */}
                      {entry.source === 'db' && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            {isSecretKey(entry.key) ? (
                              <PasswordField
                                value={editingValues[entry.key] ?? ''}
                                onChange={(v) => setEditingValues(prev => ({ ...prev, [entry.key]: v }))}
                              />
                            ) : entry.value_type === 'boolean' ? (
                              <select
                                value={editingValues[entry.key] ?? entry.value}
                                onChange={(e) => setEditingValues(prev => ({ ...prev, [entry.key]: e.target.value }))}
                                className="bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-xs text-white/70"
                              >
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={editingValues[entry.key] ?? entry.value}
                                onChange={(e) => setEditingValues(prev => ({ ...prev, [entry.key]: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-xs text-white/70 font-mono focus:outline-none focus:border-[#C6A664]/40 transition-colors"
                                placeholder={entry.value || 'Enter value...'}
                              />
                            )}
                          </div>
                          <button
                            onClick={() => handleSave(entry.key)}
                            disabled={saving[entry.key]}
                            className="px-3 py-1.5 bg-[#C6A664] text-black text-[10px] font-bold rounded-sm hover:bg-white transition-all shrink-0 disabled:opacity-40"
                          >
                            {saving[entry.key] ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => handleDelete(entry.key)}
                            className="px-2 py-1.5 text-[10px] text-red-400/50 hover:text-red-400 transition-colors shrink-0"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Env-managed (read-only) */}
                      {entry.source === 'env' && (
                        <div className="text-[10px] text-white/20 italic">
                          Managed via environment variable. Edit .env.local to change.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Stripe / Connectors quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/dashboard/admin/connectors"
          className="glass rounded-sm border border-white/[0.06] p-5 hover:border-white/15 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg text-[#8B7AA8]">◆</span>
            <h3 className="font-display font-semibold text-white text-sm">Connector Configs</h3>
          </div>
          <p className="text-xs text-white/40">
            Manage Discord, WhatsApp, n8n, and SMTP connector credentials
          </p>
        </Link>
        <Link
          href="/dashboard/admin/pricing"
          className="glass rounded-sm border border-white/[0.06] p-5 hover:border-white/15 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg text-[#B5764A]">✦</span>
            <h3 className="font-display font-semibold text-white text-sm">Pricing & Plans</h3>
          </div>
          <p className="text-xs text-white/40">
            Manage membership tiers, entitlements, and Stripe price IDs
          </p>
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════
         ADD NEW SETTING MODAL
         ══════════════════════════════════════════════════════ */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-sm border border-white/[0.06] p-8 max-w-lg w-full mx-4">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Add Setting</h2>
                <p className="text-xs text-white/40 mt-1">Add a new configuration key</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Key *</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                  placeholder="MY_API_KEY"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 font-mono placeholder-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Value</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="..."
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
                  >
                    {VALUE_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{CATEGORY_META[c]?.label || c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this setting for?"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAdd}
                  disabled={saving['__new'] || !newKey.trim()}
                  className="flex-1 px-5 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                >
                  {saving['__new'] ? 'Adding...' : 'Add Setting'}
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/60 text-xs rounded-sm hover:bg-white/10 hover:text-white/80 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-white/20 font-mono">
        {configs.length} config entr{configs.length !== 1 ? 'ies' : 'y'} · env overrides shown in amber
      </div>
    </div>
  )
}
