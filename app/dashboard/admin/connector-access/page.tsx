'use client'

import { useState, useEffect, useCallback } from 'react'

type ConnectorType = {
  id: string
  key: string
  name: string
  description: string | null
  category: string
  icon: string | null
  fields: Array<{ key: string; label: string; type: string }>
  requires_addon: string | null
  enabled_for_clients: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  calendar: 'Calendar',
  crm: 'CRM',
  social: 'Social / Messaging',
  financial: 'Financial',
  email: 'Email',
  custom: 'Custom',
}

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-all shrink-0 disabled:opacity-40 ${
        enabled ? 'bg-[#C6A664]' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
          enabled ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

export default function ConnectorAccessPage() {
  const [types, setTypes] = useState<ConnectorType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState<Record<string, boolean>>({})
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchTypes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/connector-types')
      if (!res.ok) throw new Error('Failed to load connector types')
      const data = await res.json()
      setTypes(data.connector_types ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTypes() }, [fetchTypes])

  async function handleToggle(type: ConnectorType) {
    setToggling((prev) => ({ ...prev, [type.id]: true }))
    setMsg(null)
    try {
      const res = await fetch('/api/admin/connector-types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: type.id, enabled_for_clients: !type.enabled_for_clients }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      setMsg({
        type: 'ok',
        text: `${type.name} ${!type.enabled_for_clients ? 'enabled' : 'disabled'} for clients`,
      })
      setTimeout(() => setMsg(null), 3000)
      await fetchTypes()
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setToggling((prev) => ({ ...prev, [type.id]: false }))
    }
  }

  const grouped = types.reduce<Record<string, ConnectorType[]>>((acc, t) => {
    acc[t.category] = acc[t.category] ?? []
    acc[t.category].push(t)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center justify-center py-24">
          <div className="text-white/30 text-sm">Loading connector types...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Connector Access</h1>
        <p className="text-white/40 text-sm mt-1">
          Control which third-party API connectors clients can connect their own accounts to at{' '}
          <span className="text-white/60 font-mono text-xs">/dashboard/client/connectors</span>.
          Clients supply their own credentials -- this only controls visibility, not the credentials themselves.
        </p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-sm text-sm ${
          msg.type === 'ok'
            ? 'bg-[#C6A664]/10 border border-[#C6A664]/20 text-[#C6A664]'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {msg.text}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {Object.entries(grouped).map(([category, categoryTypes]) => (
        <div key={category}>
          <h2 className="font-display text-sm font-semibold tracking-widest uppercase text-white/40 mb-3">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="glass rounded-sm border border-white/[0.06] divide-y divide-white/[0.06]">
            {categoryTypes.map((type) => (
              <div key={type.id} className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg shrink-0">
                  {type.icon ?? '◈'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-medium text-white text-sm">{type.name}</h3>
                    {type.requires_addon && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/40 border border-white/10">
                        Requires {type.requires_addon.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {type.description && <p className="text-xs text-white/40 mt-0.5">{type.description}</p>}
                  <p className="text-[10px] text-white/20 mt-1 font-mono">key: {type.key}</p>
                </div>
                <Toggle
                  enabled={type.enabled_for_clients}
                  onChange={() => handleToggle(type)}
                  disabled={toggling[type.id]}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {types.length === 0 && !loading && (
        <div className="text-center py-12 text-white/30 text-sm">
          No connector types in the catalog yet.
        </div>
      )}

      <div className="text-xs text-white/20 font-mono">
        {types.filter(t => t.enabled_for_clients).length} of {types.length} enabled for clients
      </div>
    </div>
  )
}
