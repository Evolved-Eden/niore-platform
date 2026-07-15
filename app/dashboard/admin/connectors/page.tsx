'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────
type ConnectorConfig = {
  id: string
  platform: string
  config_name: string
  config_data: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

type ConnectedClient = {
  client_id: string
  full_name: string | null
  email: string | null
  discord_connected: boolean
  whatsapp_connected: boolean
  discord_platform_id: string | null
  whatsapp_platform_id: string | null
  last_active: string | null
}

type PlatformFields = {
  [key: string]: { key: string; label: string; type: 'text' | 'password' | 'readonly'; placeholder?: string }[]
}

const PLATFORM_FIELDS: PlatformFields = {
  discord: [
    { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: 'Enter your Discord bot token' },
    { key: 'guild_id', label: 'Guild ID', type: 'text', placeholder: 'Enter your Discord server ID' },
    { key: 'default_channel_id', label: 'Default Channel ID', type: 'text', placeholder: 'Channel for Zuri delivery' },
  ],
  whatsapp: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your WhatsApp API key' },
    { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: 'Business phone number ID' },
    { key: 'webhook_callback_url', label: 'Webhook Callback URL', type: 'readonly' },
  ],
  n8n: [
    { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://your-n8n-instance/webhook/...' },
    { key: 'auth_secret', label: 'Auth Secret', type: 'password', placeholder: 'Shared secret for webhook auth' },
  ],
  email: [
    { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.sendgrid.net' },
    { key: 'smtp_port', label: 'Port', type: 'text', placeholder: '587' },
    { key: 'smtp_username', label: 'Username', type: 'text', placeholder: 'SMTP login username' },
    { key: 'smtp_password', label: 'Password', type: 'password', placeholder: 'SMTP login password' },
    { key: 'from_address', label: 'From Address', type: 'text', placeholder: 'zuri@evolvededen.ai' },
  ],
}

const PLATFORM_META: Record<string, { name: string; icon: string; description: string; note: string }> = {
  discord: {
    name: 'Discord Bot',
    icon: '◆',
    description: 'Connect Zuri to your Discord server for real-time intelligence delivery',
    note: 'Create a bot at https://discord.com/developers/applications and invite it to your server.',
  },
  whatsapp: {
    name: 'WhatsApp API',
    icon: '▼',
    description: 'Enable WhatsApp-based Zuri conversations for on-the-go support',
    note: 'Use the WhatsApp Business API or a provider like Twilio or WATI.',
  },
  n8n: {
    name: 'n8n Webhook',
    icon: '↻',
    description: 'Bridge workflows to n8n automation engine',
    note: 'Configure a webhook trigger in n8n and point it to this URL.',
  },
  email: {
    name: 'Email / SMTP',
    icon: '@',
    description: 'Send intelligence briefings and alerts via email',
    note: 'Use any SMTP-compatible email service (SendGrid, Mailgun, SES, etc.).',
  },
}

// ── Sub-components ────────────────────────────────────────────
function StatusBadge({ connected, testing }: { connected: boolean; testing?: boolean }) {
  if (testing) {
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        Testing
      </span>
    )
  }
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      connected
        ? 'bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20'
        : 'bg-white/5 text-white/30 border border-white/10'
    }`}>
      {connected ? 'Connected' : 'Disconnected'}
    </span>
  )
}

function PasswordField({ value, onChange, placeholder, id }: {
  value: string; onChange: (v: string) => void; placeholder?: string; id: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 pr-14 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 text-xs font-medium transition-colors"
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminConnectorsPage() {
  // ── State ──────────────────────────────────────────────────
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([])
  const [connectedClients, setConnectedClients] = useState<ConnectedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Form states per platform
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string } | null>>({})

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // ── Data loading ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [connRes, clientsRes] = await Promise.all([
        fetch('/api/admin/connectors'),
        fetch('/api/admin/connectors/clients'),
      ])

      if (connRes.ok) {
        const data = await connRes.json()
        setConnectors(data.connectors ?? [])

        // Pre-populate form data from existing configs
        const initial: Record<string, Record<string, string>> = {}
        for (const c of data.connectors ?? []) {
          initial[c.platform] = {}
          for (const field of PLATFORM_FIELDS[c.platform] ?? []) {
            const val = c.config_data?.[field.key]
            // For readonly fields, auto-generate
            if (field.type === 'readonly') {
              if (field.key === 'webhook_callback_url') {
                initial[c.platform][field.key] = `${window.location.origin}/api/webhooks/whatsapp`
              } else {
                initial[c.platform][field.key] = String(val ?? '')
              }
            } else {
              initial[c.platform][field.key] = String(val ?? '')
            }
          }
        }
        // Initialize empty forms for platforms without configs
        for (const platform of Object.keys(PLATFORM_FIELDS)) {
          if (!initial[platform]) {
            initial[platform] = {}
            for (const field of PLATFORM_FIELDS[platform]) {
              if (field.type === 'readonly') {
                if (field.key === 'webhook_callback_url') {
                  initial[platform][field.key] = `${window.location.origin}/api/webhooks/whatsapp`
                }
              } else {
                initial[platform][field.key] = ''
              }
            }
          }
        }
        setFormData(initial)
      } else {
        setError('Failed to load connector configs')
      }

      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setConnectedClients(data.clients ?? [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Save handler ───────────────────────────────────────────
  async function handleSave(platform: string) {
    setSaving((prev) => ({ ...prev, [platform]: true }))
    setActionMsg(null)
    setTestResult((prev) => ({ ...prev, [platform]: null }))

    try {
      const fields = formData[platform] ?? {}
      const configData: Record<string, any> = {}

      for (const field of PLATFORM_FIELDS[platform] ?? []) {
        if (field.type !== 'readonly') {
          configData[field.key] = fields[field.key] ?? ''
        }
      }

      const configName = PLATFORM_META[platform]?.name ?? platform

      const res = await fetch('/api/admin/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          config_name: configName,
          config_data: configData,
          is_active: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      setActionMsg({ type: 'ok', text: `${configName} configuration saved` })
      setTimeout(() => setActionMsg(null), 3000)
      await fetchData()
    } catch (err: any) {
      setActionMsg({ type: 'err', text: err.message })
    } finally {
      setSaving((prev) => ({ ...prev, [platform]: false }))
    }
  }

  // ── Test handler ───────────────────────────────────────────
  async function handleTest(platform: string) {
    setTesting((prev) => ({ ...prev, [platform]: true }))
    setTestResult((prev) => ({ ...prev, [platform]: null }))
    setActionMsg(null)

    try {
      const res = await fetch('/api/admin/connectors/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })

      const data = await res.json()

      setTestResult((prev) => ({
        ...prev,
        [platform]: { success: data.success, message: data.message },
      }))
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [platform]: { success: false, message: err.message },
      }))
    } finally {
      setTesting((prev) => ({ ...prev, [platform]: false }))
    }
  }

  // ── Delete handler ─────────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/connectors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }
      setDeleteConfirm(null)
      setActionMsg({ type: 'ok', text: 'Connector config deleted' })
      setTimeout(() => setActionMsg(null), 3000)
      await fetchData()
    } catch (err: any) {
      setActionMsg({ type: 'err', text: err.message })
    }
  }

  // ── Disconnect client ──────────────────────────────────────
  async function handleDisconnectClient(clientId: string, platform: string) {
    try {
      const res = await fetch('/api/client/zuri-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, platform_id: null }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Disconnect failed')
      }
      setActionMsg({ type: 'ok', text: 'Client disconnected' })
      setTimeout(() => setActionMsg(null), 3000)
      // Refresh connected clients
      const clientsRes = await fetch('/api/admin/connectors/clients')
      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setConnectedClients(data.clients ?? [])
      }
    } catch (err: any) {
      setActionMsg({ type: 'err', text: err.message })
    }
  }

  // ── Get the config for a platform ──────────────────────────
  function getConnector(platform: string): ConnectorConfig | undefined {
    return connectors.find((c) => c.platform === platform)
  }

  // ── Form field change ──────────────────────────────────────
  function setField(platform: string, key: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [key]: value },
    }))
  }

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-center py-24">
          <div className="text-white/30 text-sm">Loading connectors...</div>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Connectors</h1>
        <p className="text-white/40 text-sm mt-1">Configure third-party integrations for Zuri and the Evolved Eden platform</p>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className={`px-4 py-3 rounded-sm text-sm ${
          actionMsg.type === 'ok'
            ? 'bg-[#C6A664]/10 border border-[#C6A664]/20 text-[#C6A664]'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {actionMsg.text}
          <button
            onClick={() => setActionMsg(null)}
            className="ml-3 underline opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Connector Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(PLATFORM_META).map(([platform, meta]) => {
          const config = getConnector(platform)
          const fields = PLATFORM_FIELDS[platform]
          const isActive = config?.is_active ?? false
          const isTesting = testing[platform] ?? false
          const isSaving = saving[platform] ?? false
          const result = testResult[platform]
          const currentData = formData[platform] ?? {}

          return (
            <div
              key={platform}
              className="glass rounded-sm border border-white/[0.06] p-6"
            >
              {/* Card header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-white">{meta.name}</h3>
                  <p className="text-xs text-white/40">{meta.description}</p>
                </div>
                <StatusBadge connected={isActive} testing={isTesting} />
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`${platform}-${field.key}`}
                      className="block text-xs text-white/40 mb-1.5 tracking-wider"
                    >
                      {field.label}
                    </label>
                    {field.type === 'password' ? (
                      <PasswordField
                        id={`${platform}-${field.key}`}
                        value={currentData[field.key] ?? ''}
                        onChange={(v) => setField(platform, field.key, v)}
                        placeholder={field.placeholder}
                      />
                    ) : field.type === 'readonly' ? (
                      <input
                        id={`${platform}-${field.key}`}
                        type="text"
                        value={currentData[field.key] ?? ''}
                        readOnly
                        className="w-full bg-white/[0.02] border border-white/[0.06] rounded-sm px-4 py-2.5 text-sm text-white/30 cursor-default"
                      />
                    ) : (
                      <input
                        id={`${platform}-${field.key}`}
                        type="text"
                        value={currentData[field.key] ?? ''}
                        onChange={(e) => setField(platform, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Note */}
              <p className="mt-4 text-[11px] text-white/20 italic">{meta.note}</p>

              {/* Test result */}
              {result && (
                <div className={`mt-4 px-3 py-2 rounded-sm text-xs ${
                  result.success
                    ? 'bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {result.message}
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => handleSave(platform)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
                <button
                  onClick={() => handleTest(platform)}
                  disabled={isTesting || !config}
                  className={`px-4 py-2.5 text-xs font-medium rounded-sm border transition-all disabled:opacity-40 ${
                    config
                      ? 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
                      : 'border-white/[0.06] text-white/20 cursor-not-allowed'
                  }`}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                {config && (
                  <button
                    onClick={() => setDeleteConfirm(config.id)}
                    className="px-3 py-2.5 text-xs text-red-400/50 hover:text-red-400 transition-colors"
                    title="Delete configuration"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Connected Clients Table ──────────────────────────────── */}
      <div className="glass rounded-sm border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-base font-semibold tracking-tight text-white">
            Connected Clients
          </h2>
          <span className="text-xs text-white/30">{connectedClients.length} connected</span>
        </div>
        <p className="text-white/30 text-xs mb-5">
          Clients who have connected Zuri to Discord or WhatsApp
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Client</th>
                <th className="px-4 py-3 text-center text-xs text-white/30 tracking-widest uppercase font-normal">Discord</th>
                <th className="px-4 py-3 text-center text-xs text-white/30 tracking-widest uppercase font-normal">WhatsApp</th>
                <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Last Active</th>
                <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {connectedClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/30 text-sm">
                    No clients have connected any platform yet.
                  </td>
                </tr>
              ) : (
                connectedClients.map((client) => (
                  <tr key={client.client_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-white/80">
                        {client.full_name || 'Unknown'}
                      </div>
                      {client.email && (
                        <div className="text-xs text-white/40">{client.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {client.discord_connected ? (
                        <span className="text-[#C6A664] text-sm" title={client.discord_platform_id ?? ''}>✓</span>
                      ) : (
                        <span className="text-white/20 text-sm">✕</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {client.whatsapp_connected ? (
                        <span className="text-[#C6A664] text-sm" title={client.whatsapp_platform_id ?? ''}>✓</span>
                      ) : (
                        <span className="text-white/20 text-sm">✕</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-white/40">
                      {client.last_active
                        ? new Date(client.last_active).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {client.discord_connected && (
                          <button
                            onClick={() => handleDisconnectClient(client.client_id, 'discord')}
                            className="px-2.5 py-1 text-[10px] rounded-sm border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition-all"
                          >
                            Disconnect Discord
                          </button>
                        )}
                        {client.whatsapp_connected && (
                          <button
                            onClick={() => handleDisconnectClient(client.client_id, 'whatsapp')}
                            className="px-2.5 py-1 text-[10px] rounded-sm border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition-all"
                          >
                            Disconnect WhatsApp
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delete Confirmation ──────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Delete connector config?</h3>
            <p className="text-sm text-white/40 mb-6">
              This will remove the configuration for this platform. Connected clients will not be affected.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="text-xs text-white/20 font-mono">
        {connectors.length} connector config{connectors.length !== 1 ? 's' : ''} · direct DB
      </div>
    </div>
  )
}
