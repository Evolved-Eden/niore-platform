'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────
type ClientData = {
  zuri_connected: boolean
  zuri_discord_connected: boolean
  zuri_whatsapp_connected: boolean
}

type ConnectorField = { key: string; label: string; type: 'text' | 'password' }

type AvailableConnector = {
  id: string
  key: string
  name: string
  description: string | null
  category: string
  icon: string | null
  fields: ConnectorField[]
  connected: boolean
  connected_at: string | null
}

// ── Sub-components ────────────────────────────────────────────
function StatusBadge({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      connected
        ? 'bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20'
        : 'bg-white/5 text-white/30 border border-white/10'
    }`}>
      {label ?? (connected ? 'Connected' : 'Disconnected')}
    </span>
  )
}

function Toggle({ enabled, onChange, label, description }: {
  enabled: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm text-white/70">{label}</div>
        {description && <div className="text-[11px] text-white/30">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-9 h-5 rounded-full transition-all shrink-0 ml-3 ${
          enabled ? 'bg-[#C6A664]' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            enabled ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ClientConnectorsPage() {
  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Connection states
  const [discordUserId, setDiscordUserId] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [connectingDiscord, setConnectingDiscord] = useState(false)
  const [connectingWhatsApp, setConnectingWhatsApp] = useState(false)
  const [discordConnected, setDiscordConnected] = useState(false)
  const [whatsappConnected, setWhatsappConnected] = useState(false)

  // Notification preferences
  const [discordBriefings, setDiscordBriefings] = useState(true)
  const [whatsappReminders, setWhatsappReminders] = useState(true)
  const [dailyDigest, setDailyDigest] = useState(false)

  // ── Your own API connections (client-owned credentials) ────
  const [apiConnectors, setApiConnectors] = useState<AvailableConnector[]>([])
  const [apiFormData, setApiFormData] = useState<Record<string, Record<string, string>>>({})
  const [apiSaving, setApiSaving] = useState<Record<string, boolean>>({})
  const [apiMsg, setApiMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchApiConnectors = useCallback(async () => {
    try {
      const res = await fetch('/api/client/connectors')
      if (res.ok) {
        const data = await res.json()
        setApiConnectors(data.connectors ?? [])
      }
    } catch { /* best-effort -- section just shows empty if this fails */ }
  }, [])

  useEffect(() => { fetchApiConnectors() }, [fetchApiConnectors])

  // ── Calendar <-> Email linking ──────────────────────────────
  const [calendarLink, setCalendarLink] = useState<{ connector_credential_id: string | null; email_connector_credential_id: string | null } | null>(null)
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkMsg, setLinkMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [selectedEmailForCalendar, setSelectedEmailForCalendar] = useState('')

  const fetchCalendarLink = useCallback(async () => {
    try {
      const res = await fetch('/api/client/calendar')
      if (res.ok) {
        const data = await res.json()
        setCalendarLink(data.calendar)
        if (data.calendar?.email_connector_credential_id) {
          setSelectedEmailForCalendar(data.calendar.email_connector_credential_id)
        }
      }
    } catch { /* best-effort */ }
  }, [])

  useEffect(() => { fetchCalendarLink() }, [fetchCalendarLink])

  async function handleLinkCalendarToEmail(calendarConnectorId: string) {
    setLinkSaving(true)
    setLinkMsg(null)
    try {
      const res = await fetch('/api/client/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendar_connector_id: calendarConnectorId,
          email_connector_id: selectedEmailForCalendar || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to link')
      setCalendarLink(data.calendar)
      setLinkMsg({ type: 'ok', text: selectedEmailForCalendar ? 'Calendar linked to your email' : 'Calendar saved' })
      setTimeout(() => setLinkMsg(null), 3000)
    } catch (err: any) {
      setLinkMsg({ type: 'err', text: err.message })
    } finally {
      setLinkSaving(false)
    }
  }

  function setApiField(connectorId: string, fieldKey: string, value: string) {
    setApiFormData((prev) => ({
      ...prev,
      [connectorId]: { ...prev[connectorId], [fieldKey]: value },
    }))
  }

  async function handleSaveApiConnector(connector: AvailableConnector) {
    setApiSaving((prev) => ({ ...prev, [connector.id]: true }))
    setApiMsg(null)
    try {
      const credentials = apiFormData[connector.id] ?? {}
      const missing = connector.fields.filter((f) => !credentials[f.key]?.trim())
      if (missing.length > 0) {
        throw new Error(`Please fill in: ${missing.map((f) => f.label).join(', ')}`)
      }
      const res = await fetch('/api/client/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connector_type_id: connector.id, credentials }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setApiMsg({ type: 'ok', text: `${connector.name} connected` })
      setApiFormData((prev) => ({ ...prev, [connector.id]: {} }))
      await fetchApiConnectors()
    } catch (err: any) {
      setApiMsg({ type: 'err', text: err.message })
    } finally {
      setApiSaving((prev) => ({ ...prev, [connector.id]: false }))
    }
  }

  async function handleDisconnectApiConnector(connector: AvailableConnector) {
    setApiSaving((prev) => ({ ...prev, [connector.id]: true }))
    setApiMsg(null)
    try {
      const res = await fetch('/api/client/connectors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connector_type_id: connector.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to disconnect')
      setApiMsg({ type: 'ok', text: `${connector.name} disconnected` })
      await fetchApiConnectors()
    } catch (err: any) {
      setApiMsg({ type: 'err', text: err.message })
    } finally {
      setApiSaving((prev) => ({ ...prev, [connector.id]: false }))
    }
  }

  // ── Fetch client data ─────────────────────────────────────
  const fetchClient = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [clientRes, prefsRes] = await Promise.all([
        fetch('/api/client'),
        fetch('/api/client/notification-prefs'),
      ])
      if (!clientRes.ok) throw new Error('Failed to load client data')
      const clientData = await clientRes.json()
      const c = clientData.client as ClientData
      setClient(c)
      setDiscordConnected(c?.zuri_discord_connected ?? false)
      setWhatsappConnected(c?.zuri_whatsapp_connected ?? false)

      if (prefsRes.ok) {
        const prefsData = await prefsRes.json()
        if (prefsData.prefs) {
          setDiscordBriefings(prefsData.prefs.discord_briefings ?? true)
          setWhatsappReminders(prefsData.prefs.whatsapp_reminders ?? true)
          setDailyDigest(prefsData.prefs.daily_digest ?? false)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClient() }, [fetchClient])

  // ── Save notification prefs ───────────────────────────────
  const saveNotifPref = useCallback(async (key: string, value: boolean) => {
    try {
      await fetch('/api/client/notification-prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
    } catch { /* best-effort */ }
  }, [])

  // ── Connect / Disconnect Discord ──────────────────────────
  async function handleConnectDiscord() {
    if (discordConnected) {
      // Disconnect
      setConnectingDiscord(true)
      try {
        const res = await fetch('/api/client/zuri-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'discord', platform_id: null }),
        })
        if (!res.ok) throw new Error('Failed to disconnect Discord')
        setDiscordConnected(false)
        setDiscordUserId('')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setConnectingDiscord(false)
      }
    } else {
      // Connect
      if (!discordUserId.trim()) {
        setError('Please enter your Discord User ID')
        return
      }
      setConnectingDiscord(true)
      try {
        const res = await fetch('/api/client/zuri-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'discord', platform_id: discordUserId.trim() }),
        })
        if (!res.ok) throw new Error('Failed to connect Discord')
        setDiscordConnected(true)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setConnectingDiscord(false)
      }
    }
  }

  // ── Connect / Disconnect WhatsApp ─────────────────────────
  async function handleConnectWhatsApp() {
    if (whatsappConnected) {
      setConnectingWhatsApp(true)
      try {
        const res = await fetch('/api/client/zuri-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'whatsapp', platform_id: null }),
        })
        if (!res.ok) throw new Error('Failed to disconnect WhatsApp')
        setWhatsappConnected(false)
        setWhatsappNumber('')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setConnectingWhatsApp(false)
      }
    } else {
      if (!whatsappNumber.trim()) {
        setError('Please enter your WhatsApp number')
        return
      }
      setConnectingWhatsApp(true)
      try {
        const res = await fetch('/api/client/zuri-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'whatsapp', platform_id: whatsappNumber.trim() }),
        })
        if (!res.ok) throw new Error('Failed to connect WhatsApp')
        setWhatsappConnected(true)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setConnectingWhatsApp(false)
      }
    }
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-center py-24">
          <div className="text-white/30 text-sm">Loading connections...</div>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          My Connections
        </h1>
        <p className="text-white/30 text-sm mt-1">
          Connect Zuri to your preferred platforms for intelligence delivery
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-3 text-red-300 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Your API Connections (client-owned credentials) ─── */}
        {apiMsg && (
          <div className={`px-4 py-3 rounded-sm text-sm ${
            apiMsg.type === 'ok'
              ? 'bg-[#C6A664]/10 border border-[#C6A664]/20 text-[#C6A664]'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {apiMsg.text}
            <button onClick={() => setApiMsg(null)} className="ml-3 underline opacity-60 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {apiConnectors.length > 0 && (
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-white mb-1">
              Your API Connections
            </h2>
            <p className="text-white/30 text-xs mb-5">
              Connect your own accounts -- your credentials, encrypted and never shared.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {apiConnectors.map((connector) => {
                const isSaving = apiSaving[connector.id] ?? false
                const currentData = apiFormData[connector.id] ?? {}
                return (
                  <div key={connector.id} className="glass rounded-sm border border-white/[0.06] p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
                        {connector.icon ?? '◈'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-white">{connector.name}</h3>
                        {connector.description && (
                          <p className="text-xs text-white/40">{connector.description}</p>
                        )}
                      </div>
                      <StatusBadge connected={connector.connected} />
                    </div>

                    {connector.connected ? (
                      <div className="space-y-4">
                        <div className="px-4 py-3 rounded-sm bg-[#C6A664]/5 border border-[#C6A664]/10">
                          <div className="flex items-center gap-2 text-sm text-[#C6A664]">
                            <span>✓</span>
                            <span className="font-medium">Connected</span>
                          </div>
                          {connector.connected_at && (
                            <p className="text-xs text-white/40 mt-1">
                              Since {new Date(connector.connected_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDisconnectApiConnector(connector)}
                          disabled={isSaving}
                          className="w-full px-4 py-2.5 border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 text-xs font-bold rounded-sm transition-all disabled:opacity-40"
                        >
                          {isSaving ? 'Disconnecting...' : `Disconnect ${connector.name}`}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {connector.fields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs text-white/40 mb-1.5">{field.label}</label>
                            <input
                              type={field.type === 'password' ? 'password' : 'text'}
                              value={currentData[field.key] ?? ''}
                              onChange={(e) => setApiField(connector.id, field.key, e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => handleSaveApiConnector(connector)}
                          disabled={isSaving}
                          className="w-full px-4 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                        >
                          {isSaving ? 'Connecting...' : `Connect ${connector.name}`}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Link Calendar to Email ────────────────────────────── */}
        {(() => {
          const connectedCalendar = apiConnectors.find((c) => c.category === 'calendar' && c.connected)
          const connectedEmails = apiConnectors.filter((c) => c.category === 'email' && c.connected)
          if (!connectedCalendar) return null

          return (
            <div className="glass rounded-sm border border-white/[0.06] p-6">
              <h3 className="font-display font-semibold text-white mb-1">Link Calendar to Email</h3>
              <p className="text-xs text-white/40 mb-4">
                When linked, booking confirmations for events on {connectedCalendar.name} send from your own connected email instead of the platform default.
              </p>

              {linkMsg && (
                <div className={`mb-4 px-3 py-2 rounded-sm text-xs ${
                  linkMsg.type === 'ok'
                    ? 'bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {linkMsg.text}
                </div>
              )}

              {connectedEmails.length === 0 ? (
                <p className="text-xs text-white/30 italic">
                  Connect an email account above (e.g. Gmail) to link it here.
                </p>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedEmailForCalendar}
                    onChange={(e) => setSelectedEmailForCalendar(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20"
                  >
                    <option value="">No email linked</option>
                    {connectedEmails.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleLinkCalendarToEmail(connectedCalendar.id)}
                    disabled={linkSaving}
                    className="w-full px-4 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                  >
                    {linkSaving ? 'Saving...' : 'Save Link'}
                  </button>
                  {calendarLink?.email_connector_credential_id && (
                    <p className="text-[11px] text-[#C6A664]/60 text-center">Currently linked</p>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* ── Discord Card ───────────────────────────────────── */}
        <div className="glass rounded-sm border border-white/[0.06] p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
              ◆
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-white">Discord</h3>
              <p className="text-xs text-white/40">
                Get Zuri&apos;s intelligence directly in your Discord server
              </p>
            </div>
            <StatusBadge connected={discordConnected} />
          </div>

          {discordConnected ? (
            <div className="space-y-4">
              <div className="px-4 py-3 rounded-sm bg-[#C6A664]/5 border border-[#C6A664]/10">
                <div className="flex items-center gap-2 text-sm text-[#C6A664]">
                  <span>✓</span>
                  <span className="font-medium">Connected</span>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Zuri is delivering intelligence to your Discord.
                </p>
              </div>
              <button
                onClick={handleConnectDiscord}
                disabled={connectingDiscord}
                className="w-full px-4 py-2.5 border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 text-xs font-bold rounded-sm transition-all disabled:opacity-40"
              >
                {connectingDiscord ? 'Disconnecting...' : 'Disconnect Discord'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="discord-user-id" className="block text-xs text-white/40 mb-1.5">
                  Your Discord User ID
                </label>
                <input
                  id="discord-user-id"
                  type="text"
                  value={discordUserId}
                  onChange={(e) => setDiscordUserId(e.target.value)}
                  placeholder="e.g. 123456789012345678"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                />
                <p className="text-[11px] text-white/20 mt-1.5">
                  Find this in Discord Settings &gt; Advanced &gt; Developer Mode &gt; Right-click your name &gt; Copy ID
                </p>
              </div>
              <button
                onClick={handleConnectDiscord}
                disabled={connectingDiscord || !discordUserId.trim()}
                className="w-full px-4 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
              >
                {connectingDiscord ? 'Connecting...' : 'Connect Discord'}
              </button>
            </div>
          )}
        </div>

        {/* ── WhatsApp Card ──────────────────────────────────── */}
        <div className="glass rounded-sm border border-white/[0.06] p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
              ▼
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-white">WhatsApp</h3>
              <p className="text-xs text-white/40">
                Chat with Zuri on WhatsApp for on-the-go intelligence
              </p>
            </div>
            <StatusBadge connected={whatsappConnected} />
          </div>

          {whatsappConnected ? (
            <div className="space-y-4">
              <div className="px-4 py-3 rounded-sm bg-[#C6A664]/5 border border-[#C6A664]/10">
                <div className="flex items-center gap-2 text-sm text-[#C6A664]">
                  <span>✓</span>
                  <span className="font-medium">Connected</span>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Zuri is available on WhatsApp.
                </p>
              </div>
              <button
                onClick={handleConnectWhatsApp}
                disabled={connectingWhatsApp}
                className="w-full px-4 py-2.5 border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 text-xs font-bold rounded-sm transition-all disabled:opacity-40"
              >
                {connectingWhatsApp ? 'Disconnecting...' : 'Disconnect WhatsApp'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="whatsapp-number" className="block text-xs text-white/40 mb-1.5">
                  Your WhatsApp Number
                </label>
                <input
                  id="whatsapp-number"
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +1 (555) 123-4567"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                />
                <p className="text-[11px] text-white/20 mt-1.5">
                  Enter your full number with country code.
                </p>
              </div>

              {/* QR placeholder */}
              <div className="p-4 rounded-sm border border-white/[0.06] bg-white/[0.02] text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-sm bg-white/[0.04] border border-white/[0.06] mb-2">
                  <span className="text-[10px] text-white/20">QR</span>
                </div>
                <p className="text-[10px] text-white/20">
                  Scan to connect Zuri on WhatsApp
                </p>
              </div>

              <button
                onClick={handleConnectWhatsApp}
                disabled={connectingWhatsApp || !whatsappNumber.trim()}
                className="w-full px-4 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
              >
                {connectingWhatsApp ? 'Connecting...' : 'Connect WhatsApp'}
              </button>
            </div>
          )}
        </div>

        {/* ── Notification Preferences ─────────────────────────── */}
        <div className="glass rounded-sm border border-white/[0.06] p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
              ◇
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Notification Preferences</h3>
              <p className="text-xs text-white/40">
                Choose how Zuri reaches you
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-white/[0.06]">
            <Toggle
              enabled={discordBriefings}
              onChange={(v) => { setDiscordBriefings(v); saveNotifPref('discord_briefings', v) }}
              label="Receive essence briefings on Discord"
              description="Daily intelligence summaries delivered to your DMs"
            />
            <Toggle
              enabled={whatsappReminders}
              onChange={(v) => { setWhatsappReminders(v); saveNotifPref('whatsapp_reminders', v) }}
              label="Receive consultation reminders on WhatsApp"
              description="Get notified before your scheduled consultations"
            />
            <Toggle
              enabled={dailyDigest}
              onChange={(v) => { setDailyDigest(v); saveNotifPref('daily_digest', v) }}
              label="Daily intelligence digest"
              description="End-of-day summary of insights and recommendations"
            />
          </div>

          <div className="mt-5 px-4 py-3 rounded-sm bg-[#C6A664]/5 border border-[#C6A664]/10 text-center">
            <p className="text-xs text-[#C6A664]/60">
              Preferences are saved and synced to your account.
            </p>
          </div>
        </div>

        {/* ── Help CTA ───────────────────────────────────────── */}
        <div className="glass rounded-sm border border-white/[0.06] p-6 text-center">
          <div className="text-2xl mb-2 opacity-30">?</div>
          <h3 className="font-display text-base font-semibold text-white mb-1">
            Need help setting up?
          </h3>
          <p className="text-xs text-white/40 mb-4">
            Book a consultation and our team will help you connect Zuri to your platforms.
          </p>
          <Link
            href="/dashboard/client/consulting"
            className="inline-block px-6 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
          >
            Book a Consultation
          </Link>
        </div>
      </div>
    </div>
  )
}
