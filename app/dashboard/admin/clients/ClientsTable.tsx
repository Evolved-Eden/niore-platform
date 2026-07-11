'use client'

import { useState, useCallback } from 'react'
import type { ClientRow } from './page'

const TIERS = [
  'trial',
  'client_founder', 'client_team', 'client_enterprise',
  'creator_studio', 'creator_premium', 'creator_concierge',
  'personal_free', 'personal_plus', 'personal_premium',
  'affiliate_starter', 'affiliate_pro', 'affiliate_enterprise',
  'service_free', 'service_basic', 'service_premium',
  'employee_starter', 'employee_growth', 'employee_pro', 'employee_enterprise',
  'department_starter', 'department_premium',
  'os_creator', 'os_founder', 'os_business', 'os_agency',
  'none',
]

const ADDON_KEYS = [
  'additional_intelligence', 'additional_agent', 'additional_swarm',
  'additional_memory', 'additional_workflow', 'twin_expansion',
  'premium_essence', 'sdk_api', 'white_label', 'voice_systems',
]

export default function ClientsTable({ initialClients }: { initialClients: ClientRow[] }) {
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const filtered = clients.filter(u => {
    const q = search.toLowerCase()
    if (q && !(u.email && u.email.toLowerCase().includes(q)) &&
        !(u.full_name && u.full_name.toLowerCase().includes(q)) &&
        !(u.biz_name && u.biz_name.toLowerCase().includes(q))) return false
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    return true
  })

  const doAction = useCallback(async (id: string, action: string, extra?: Record<string, any>) => {
    setActionMsg(null)
    const body: any = { action, clientId: id, ...extra }
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setActionMsg({ type: 'err', text: data.error || 'Request failed' })
      return
    }
    if (action === 'activate') {
      setClients(prev => prev.map(c => c.id === id ? { ...c, status: 'active', onboarding_status: 'completed' } : c))
    } else if (action === 'reject') {
      setClients(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected', onboarding_status: 'rejected' } : c))
    } else if (action === 'suspend') {
      setClients(prev => prev.map(c => c.id === id ? { ...c, status: 'suspended' } : c))
    } else if (action === 'set_plan' && extra?.plan) {
      setClients(prev => prev.map(c => c.id === id ? { ...c, plan_tier_key: extra.plan } : c))
    } else if (action === 'set_additional_plans' && extra?.plans) {
      setClients(prev => prev.map(c => c.id === id ? { ...c, additional_plans: extra.plans } : c))
    } else if (action === 'set_addons' && extra?.addons) {
      setClients(prev => prev.map(c => c.id === id ? { ...c, addons: extra.addons } : c))
    } else if (action === 'delete') {
      if (data.success) setClients(prev => prev.filter(c => c.id !== id))
    } else if (action === 'provision') {
      // fetch will automatically attach org data
    }
    setActionMsg({ type: 'ok', text: `${action} — ok` })
    setTimeout(() => setActionMsg(null), 3000)
  }, [])

  const [planModal, setPlanModal] = useState<{ id: string; current: string | null } | null>(null)
  const [planValue, setPlanValue] = useState('')
  const [additionalPlansModal, setAdditionalPlansModal] = useState<{ id: string; current: string[] } | null>(null)
  const [additionalPlansValue, setAdditionalPlansValue] = useState<string[]>([])
  const [addonsModal, setAddonsModal] = useState<{ id: string; current: string[] } | null>(null)
  const [addonsValue, setAddonsValue] = useState<string[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailClient, setDetailClient] = useState<ClientRow | null>(null)
  const [editKey, setEditKey] = useState('')
  const [editVal, setEditVal] = useState('')
  const [twinClient, setTwinClient] = useState<ClientRow | null>(null)
  const [twinMeta, setTwinMeta] = useState<Record<string, any>>({})
  const [twinFields, setTwinFields] = useState({
    personality_summary: '',
    communication_style: '',
    preference_summary: '',
  })
  const [twinStatus, setTwinStatus] = useState('active')
  const [twinVersion, setTwinVersion] = useState(1)
  const [twinSaving, setTwinSaving] = useState(false)
  const [provisioning, setProvisioning] = useState<string | null>(null)

  const statusColor = (s: string | null) => {
    switch (s) {
      case 'active': return 'bg-green-900/40 text-green-400'
      case 'rejected': return 'bg-red-900/40 text-red-400'
      case 'suspended': return 'bg-yellow-900/40 text-yellow-400'
      case 'pending_approval':
      case 'pending': return 'bg-blue-900/40 text-blue-400'
      case 'admin_approved': return 'bg-purple-900/40 text-purple-400'
      default: return 'bg-white/[0.04] text-white/30'
    }
  }

  // ── Twin panel ──
  async function loadTwinMeta(clientId: string) {
    try {
      const res = await fetch('/api/admin/twins')
      if (!res.ok) return
      const data = await res.json()
      const twins: any[] = data.twins || []
      const twin = twins.find((t: any) => t.client_id === clientId)
      if (twin) {
        const meta = twin.metadata || {}
        setTwinMeta(meta)
        setTwinFields({
          personality_summary: twin.personality_summary || meta.personality_summary || '',
          communication_style: twin.communication_style || meta.communication_style || '',
          preference_summary: twin.preference_summary || meta.preference_summary || '',
        })
        setTwinStatus(twin.twin_status || 'active')
        setTwinVersion(twin.version || 1)
      } else {
        setTwinMeta({})
        setTwinFields({ personality_summary: '', communication_style: '', preference_summary: '' })
        setTwinStatus('active')
        setTwinVersion(1)
      }
    } catch { /* ignore */ }
  }

  async function handleSaveTwin() {
    if (!twinClient) return
    setTwinSaving(true)
    try {
      const res = await fetch('/api/admin/twins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: twinClient.id,
          action: 'save_twin',
          updates: {
            personality_summary: twinFields.personality_summary,
            communication_style: twinFields.communication_style,
            preference_summary: twinFields.preference_summary,
            twin_status: twinStatus,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMsg({ type: 'ok', text: 'Twin saved' })
      setTimeout(() => setActionMsg(null), 3000)
      loadTwinMeta(twinClient.id)
    } catch (err: any) {
      setActionMsg({ type: 'err', text: err.message })
    }
    setTwinSaving(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Client Management</h1>
          <p className="text-white/40 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {actionMsg && (
            <span className={`text-xs px-3 py-1 rounded-sm ${actionMsg.type === 'ok' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {actionMsg.text}
            </span>
          )}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-xs text-white/50 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending</option>
            <option value="admin_approved">Admin Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <input
            type="text"
            placeholder="Search name, email, business..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#c8ff00]/40 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-sm overflow-hidden border border-white/[0.06]">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Client</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Type</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Status</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Base Plan</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">+Plans</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Add-ons</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Vertical</th>
              <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Created</th>
              <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-white/30 text-sm">No clients found</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4">
                    <button onClick={() => setDetailClient(c)} className="text-left">
                      <div className="text-sm font-medium text-white/80 hover:text-[#c8ff00] transition-colors">
                        {c.full_name || c.biz_name || c.user_name || '—'}
                      </div>
                      <div className="text-xs text-white/40">{c.email || c.user_email || '—'}</div>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/50">{c.client_type || '—'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded-sm text-xs font-medium ${statusColor(c.status)}`}>
                      {c.status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/40">{c.plan_tier_key || '—'}</td>
                  <td className="px-4 py-4 text-sm text-white/40">
                    {c.additional_plans && c.additional_plans.length > 0
                      ? <span className="text-[#c8ff00]">{c.additional_plans.join(', ')}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-4 text-sm text-white/40">
                    {c.addons && c.addons.length > 0
                      ? <span className="text-[#00d4ff]">{c.addons.join(', ')}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-4 text-sm text-white/40 max-w-[120px] truncate">{c.primary_vertical || '—'}</td>
                  <td className="px-4 py-4 text-sm text-white/40">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {c.status !== 'active' && (
                        <button onClick={() => doAction(c.id, 'activate')}
                          className="px-2.5 py-1 text-xs rounded-sm bg-green-900/30 text-green-400 hover:bg-green-900/60"
                        >Activate</button>
                      )}
                      {c.status === 'active' && (
                        <button onClick={() => doAction(c.id, 'suspend')}
                          className="px-2.5 py-1 text-xs rounded-sm bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/60"
                        >Suspend</button>
                      )}
                      <button onClick={() => { setPlanModal({ id: c.id, current: c.plan_tier_key }); setPlanValue(c.plan_tier_key || '') }}
                        className="px-2.5 py-1 text-xs rounded-sm bg-blue-900/30 text-blue-400 hover:bg-blue-900/60"
                      >Base</button>
                      <button onClick={() => { setAdditionalPlansModal({ id: c.id, current: c.additional_plans || [] }); setAdditionalPlansValue(c.additional_plans || []) }}
                        className="px-2.5 py-1 text-xs rounded-sm bg-purple-900/30 text-purple-400 hover:bg-purple-900/60"
                      >+Plans</button>
                      <button onClick={() => { setAddonsModal({ id: c.id, current: c.addons || [] }); setAddonsValue(c.addons || []) }}
                        className="px-2.5 py-1 text-xs rounded-sm bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/60"
                      >Add-ons</button>
                      <button onClick={() => { setTwinClient(c); loadTwinMeta(c.id) }}
                         className="px-2.5 py-1 text-xs rounded-sm bg-[#ff6b6b]/20 text-[#ff6b6b] hover:bg-[#ff6b6b]/40"
                       >Twin</button>
                      {!c.plan_tier_key?.includes('trial') && c.status === 'active' && (
                        <button onClick={async () => {
                          setProvisioning(c.id)
                          await doAction(c.id, 'provision')
                          setProvisioning(null)
                        }} disabled={provisioning === c.id}
                          className="px-2.5 py-1 text-xs rounded-sm bg-amber-900/30 text-amber-400 hover:bg-amber-900/60 disabled:opacity-40"
                        >{provisioning === c.id ? '...' : 'Provision'}</button>
                      )}
                      <button onClick={() => { setDetailClient(c) }}
                         className="px-2.5 py-1 text-xs rounded-sm bg-white/5 text-white/50 hover:text-white/80"
                       >Edit</button>
                      {(c.status === 'rejected' || c.status === 'pending_approval') && (
                        <button onClick={() => setDeleteConfirm(c.id)}
                          className="px-2.5 py-1 text-xs rounded-sm bg-red-900/30 text-red-400 hover:bg-red-900/60"
                        >Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Delete client?</h3>
            <p className="text-sm text-white/40 mb-6">This will remove the client record. Cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancel</button>
              <button onClick={() => { doAction(deleteConfirm, 'delete'); setDeleteConfirm(null) }} className="px-4 py-2 text-sm bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Plan modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Set Plan Tier</h3>
            <p className="text-sm text-white/40 mb-4">Current: {planModal.current || 'none'}</p>
            <select value={planValue} onChange={e => setPlanValue(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2 text-sm text-white/70 mb-4 focus:outline-none"
            >
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setPlanModal(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancel</button>
              <button onClick={() => { doAction(planModal.id, 'set_plan', { plan: planValue }); setPlanModal(null) }} className="px-4 py-2 text-sm bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 rounded-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Plans modal (multi-select) */}
      {additionalPlansModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Additional Plans</h3>
            <p className="text-sm text-white/40 mb-4">Select plans to stack on top of the base plan.</p>
            <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
              {TIERS.filter(t => t !== 'none').map(t => (
                <label key={t} className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80 cursor-pointer">
                  <input type="checkbox" checked={additionalPlansValue.includes(t)} onChange={() => {
                    setAdditionalPlansValue(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
                  }} className="accent-[#c8ff00]" />
                  {t}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setAdditionalPlansModal(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancel</button>
              <button onClick={() => { doAction(additionalPlansModal.id, 'set_additional_plans', { plans: additionalPlansValue }); setAdditionalPlansModal(null) }} className="px-4 py-2 text-sm bg-purple-900/40 text-purple-400 hover:bg-purple-900/60 rounded-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add-ons modal (multi-select) */}
      {addonsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Add-ons</h3>
            <p className="text-sm text-white/40 mb-4">Select add-ons for this client.</p>
            <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
              {ADDON_KEYS.map(a => (
                <label key={a} className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80 cursor-pointer">
                  <input type="checkbox" checked={addonsValue.includes(a)} onChange={() => {
                    setAddonsValue(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
                  }} className="accent-[#00d4ff]" />
                  {a}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setAddonsModal(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancel</button>
              <button onClick={() => { doAction(addonsModal.id, 'set_addons', { addons: addonsValue }); setAddonsModal(null) }} className="px-4 py-2 text-sm bg-cyan-900/40 text-cyan-400 hover:bg-cyan-900/60 rounded-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail / Edit panel */}
      {detailClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white/80 mb-4">Client Details</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
              <Row label="ID"><code className="text-xs text-white/40 font-mono break-all">{detailClient.id}</code></Row>
              <Row label="Status">
                <span className={`inline-block px-2 py-0.5 rounded-sm text-xs font-medium ${statusColor(detailClient.status)}`}>
                  {detailClient.status || '—'}
                </span>
              </Row>
              <Row label="Full Name">{detailClient.full_name || detailClient.user_name || '—'}</Row>
              <Row label="Business">{detailClient.biz_name || '—'}</Row>
              <Row label="Email">{detailClient.email || detailClient.user_email || '—'}</Row>
              <Row label="Phone">{detailClient.phone || '—'}</Row>
              <Row label="Type">{detailClient.client_type || '—'}</Row>
              <Row label="Base Plan">{detailClient.plan_tier_key || '—'}</Row>
              <Row label="+ Plans">{(detailClient.additional_plans || []).length > 0 ? detailClient.additional_plans!.join(', ') : '—'}</Row>
              <Row label="Add-ons">{(detailClient.addons || []).length > 0 ? detailClient.addons!.join(', ') : '—'}</Row>
              <Row label="Onboarding">{detailClient.onboarding_status || '—'}</Row>
              <Row label="Vertical">{detailClient.primary_vertical || '—'}</Row>
              <Row label="VIP Level">{detailClient.vip_level || '—'}</Row>
              <Row label="Lifecycle">{detailClient.lifecycle_stage || '—'}</Row>
              <Row label="Total Spend">{detailClient.total_spend ? `$${detailClient.total_spend}` : '—'}</Row>
              <Row label="LTV">{detailClient.lifetime_value ? `$${detailClient.lifetime_value}` : '—'}</Row>
              <Row label="Linked User">{detailClient.user_email || 'none'} ({detailClient.user_role || '—'})</Row>
              <Row label="Created">{detailClient.created_at ? new Date(detailClient.created_at).toLocaleString() : '—'}</Row>
              <Row label="Updated">{detailClient.updated_at ? new Date(detailClient.updated_at).toLocaleString() : '—'}</Row>
            </div>

            {/* Quick edit fields */}
            <h4 className="text-sm font-medium text-white/60 mb-3">Quick Edit</h4>
            <div className="flex gap-3 mb-4">
              <select value={editKey} onChange={e => setEditKey(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-xs text-white/50"
              >
                <option value="">Select field...</option>
                <option value="full_name">Full Name</option>
                <option value="biz_name">Business Name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="primary_vertical">Vertical</option>
                <option value="vip_level">VIP Level</option>
                <option value="lifecycle_stage">Lifecycle Stage</option>
                <option value="client_type">Client Type</option>
              </select>
              <input type="text" value={editVal} onChange={e => setEditVal(e.target.value)}
                placeholder="Value..."
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-xs text-white/70 placeholder:text-white/20"
              />
              <button onClick={async () => {
                if (!editKey || !editVal) return
                await doAction(detailClient.id, 'update', { updates: { [editKey]: editVal } })
                // Update local state
                setClients(prev => prev.map(c => c.id === detailClient.id ? { ...c, [editKey]: editVal } as ClientRow : c))
                setDetailClient(prev => prev ? { ...prev, [editKey]: editVal } as ClientRow : null)
                setEditKey('')
                setEditVal('')
              }}
                className="px-3 py-2 text-xs rounded-sm bg-[#c8ff00]/20 text-[#c8ff00] hover:bg-[#c8ff00]/30"
              >Update</button>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setDetailClient(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Twin panel */}
      {twinClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white/80 mb-1">Twin Configuration</h3>
            <p className="text-sm text-white/40 mb-5">
              {twinClient.full_name || twinClient.email || 'User'} &mdash; v{twinVersion}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1">Status</label>
                <select value={twinStatus} onChange={e => setTwinStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#ff6b6b]/40"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Personality Summary</label>
                <textarea value={twinFields.personality_summary}
                  onChange={e => setTwinFields(f => ({ ...f, personality_summary: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 resize-none focus:outline-none focus:border-[#ff6b6b]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Communication Style</label>
                <textarea value={twinFields.communication_style}
                  onChange={e => setTwinFields(f => ({ ...f, communication_style: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 resize-none focus:outline-none focus:border-[#ff6b6b]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Preference Summary</label>
                <textarea value={twinFields.preference_summary}
                  onChange={e => setTwinFields(f => ({ ...f, preference_summary: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 resize-none focus:outline-none focus:border-[#ff6b6b]/40"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSaveTwin} disabled={twinSaving}
                  className="px-5 py-2 bg-[#ff6b6b] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                >
                  {twinSaving ? 'Saving...' : 'Save Twin'}
                </button>
                <button onClick={() => { setTwinClient(null); window.open(`/dashboard/admin/twin`, '_blank') }}
                  className="px-4 py-2 border border-white/10 text-white/30 text-xs rounded-sm hover:border-white/30 transition-all"
                >
                  Full Management &rarr;
                </button>
                <button onClick={() => setTwinClient(null)}
                  className="px-4 py-2 text-xs text-white/30 hover:text-white/60"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-white/20 font-mono">
        Direct SQL — {clients.length} clients · live DB
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="text-white/40 text-xs">{label}</dt>
      <dd className="text-white/70 text-sm text-right">{children}</dd>
    </div>
  )
}
