'use client'

import { useState, useCallback } from 'react'

export default function PricingManager({ initialTiers, initialEntitlements }: { initialTiers: any[]; initialEntitlements: any[] }) {
  const [tiers, setTiers] = useState(initialTiers)
  const [entitlements, setEntitlements] = useState(initialEntitlements)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [editTier, setEditTier] = useState<any | null>(null)
  const [editEnt, setEditEnt] = useState<any | null>(null)
  const [tab, setTab] = useState<'tiers' | 'entitlements'>('tiers')

  const api = useCallback(async (action: string, body: any) => {
    setMsg(null)
    const res = await fetch('/api/admin/pricing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    })
    const data = await res.json()
    if (!res.ok) { setMsg({ type: 'err', text: data.error }); return null }
    return data
  }, [])

  const saveTier = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(fd.entries())
    const res = await api('upsert_tier', data)
    if (res) {
      setMsg({ type: 'ok', text: 'Tier saved' })
      setEditTier(null)
      const tiersRes = await fetch('/api/admin/pricing').then(r => r.json())
      setTiers(tiersRes.tiers || [])
      setTimeout(() => setMsg(null), 2000)
    }
  }

  const deleteTier = async (id: string, key: string) => {
    if (!confirm('Delete this tier?')) return
    const res = await api('delete_tier', { id, key })
    if (res) {
      setTiers(prev => prev.filter(t => t.id !== id))
      setEntitlements(prev => prev.filter(e => e.plan_key !== key))
    }
  }

  const saveEnt = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(fd.entries()) as any
    data.can_use_legal_addon = !!data.can_use_legal_addon
    data.can_use_wealth_addon = !!data.can_use_wealth_addon
    data.can_use_luxury_hospitality_addon = !!data.can_use_luxury_hospitality_addon
    data.can_use_creator_commerce_addon = !!data.can_use_creator_commerce_addon
    const res = await api('upsert_entitlement', data)
    if (res) {
      setMsg({ type: 'ok', text: 'Entitlement saved' })
      setEditEnt(null)
      const entsRes = await fetch('/api/admin/pricing').then(r => r.json())
      setEntitlements(entsRes.entitlements || [])
      setTimeout(() => setMsg(null), 2000)
    }
  }

  const deleteEnt = async (id: string) => {
    if (!confirm('Delete this entitlement?')) return
    const res = await api('delete_entitlement', { id })
    if (res) setEntitlements(prev => prev.filter(e => e.id !== id))
  }

  const tierKeys = tiers.map((t: any) => t.key).filter(Boolean)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Pricing & Plans</h1>
          <p className="text-white/40 text-sm mt-1">{tiers.length} tiers · {entitlements.length} entitlements</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span className={`text-xs px-3 py-1 rounded-sm ${msg.type === 'ok' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {msg.text}
            </span>
          )}
          <div className="flex rounded-sm overflow-hidden border border-white/[0.08]">
            <button onClick={() => setTab('tiers')} className={`px-4 py-2 text-xs ${tab === 'tiers' ? 'bg-[#C6A664]/20 text-[#C6A664]' : 'text-white/40 hover:text-white/60'}`}>Tiers</button>
            <button onClick={() => setTab('entitlements')} className={`px-4 py-2 text-xs ${tab === 'entitlements' ? 'bg-[#C6A664]/20 text-[#C6A664]' : 'text-white/40 hover:text-white/60'}`}>Entitlements</button>
          </div>
        </div>
      </div>

      {/* Tiers tab */}
      {tab === 'tiers' && (
        <>
          <button onClick={() => setEditTier({})} className="px-4 py-2 text-xs rounded-sm bg-[#C6A664]/20 text-[#C6A664] hover:bg-[#C6A664]/30">+ New Tier</button>
          <div className="glass rounded-sm overflow-hidden border border-white/[0.06]">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Key</th>
                  <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Name</th>
                  <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Org</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Specialty Agents</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Custom Agents</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Workflows</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Swarm Cap</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Price Range</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {tiers.map((t: any) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm text-white/60 font-mono">{t.key}</td>
                    <td className="px-4 py-3 text-sm text-white/80">{t.name}</td>
                    <td className="px-4 py-3">{t.is_organization ? '🏢' : t.is_creator ? '🎨' : '—'}</td>
                    <td className="px-4 py-3 text-sm text-white/60 text-right">{t.max_specialty_agents}</td>
                    <td className="px-4 py-3 text-sm text-white/60 text-right">{t.max_custom_agents}</td>
                    <td className="px-4 py-3 text-sm text-white/60 text-right">{t.max_workflows}</td>
                    <td className="px-4 py-3 text-sm text-white/60 text-right">{t.max_swarm_capacity}</td>
                    <td className="px-4 py-3 text-sm text-white/40 text-right">{t.price_range || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditTier(t)} className="px-2 py-1 text-xs rounded-sm bg-white/5 text-white/50 hover:text-white/80">Edit</button>
                        <button onClick={() => deleteTier(t.id, t.key)} className="px-2 py-1 text-xs rounded-sm bg-red-900/30 text-red-400 hover:bg-red-900/60">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editTier !== null && (
            <Modal title={editTier.id ? 'Edit Tier' : 'New Tier'} onClose={() => setEditTier(null)}>
              <form onSubmit={saveTier} className="space-y-3">
                <input type="hidden" name="id" value={editTier.id || ''} />
                <Grid>
                  <Field label="Key" name="key" value={editTier.key || ''} />
                  <Field label="Name" name="name" value={editTier.name || ''} />
                </Grid>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Description</label>
                  <textarea name="description" defaultValue={editTier.description || ''} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70" rows={2} />
                </div>
                <Grid>
                  <Field label="Price Range" name="price_range" value={editTier.price_range || ''} />
                  <Field label="Sweet Spot" name="price_sweet_spot" value={editTier.price_sweet_spot || ''} />
                </Grid>
                <Grid>
                  <Field label="Max Specialty Agents" name="max_specialty_agents" value={editTier.max_specialty_agents ?? 0} type="number" />
                  <Field label="Max Custom Agents" name="max_custom_agents" value={editTier.max_custom_agents ?? 0} type="number" />
                </Grid>
                <Grid>
                  <Field label="Max Workflows" name="max_workflows" value={editTier.max_workflows ?? 0} type="number" />
                  <Field label="Max Swarm Capacity" name="max_swarm_capacity" value={editTier.max_swarm_capacity ?? 0} type="number" />
                </Grid>
                <Grid>
                  <Field label="Max Memory (GB)" name="max_memory_gbs" value={editTier.max_memory_gbs ?? 0} type="number" />
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Is Org</span>
                    <input type="checkbox" name="is_organization" defaultChecked={editTier.is_organization} className="accent-[#C6A664]" />
                  </label>
                </Grid>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditTier(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-[#C6A664]/20 text-[#C6A664] hover:bg-[#C6A664]/30 rounded-sm">Save</button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}

      {/* Entitlements tab */}
      {tab === 'entitlements' && (
        <>
          <button onClick={() => setEditEnt({ plan_key: tierKeys[0] || '' })} className="px-4 py-2 text-xs rounded-sm bg-[#C6A664]/20 text-[#C6A664] hover:bg-[#C6A664]/30">+ New Entitlement</button>
          <div className="glass rounded-sm overflow-hidden border border-white/[0.06]">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Plan</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Specialty Agents</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Custom</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Swarm</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Wf</th>
                  <th className="px-4 py-3 text-center text-xs text-white/30 tracking-widest uppercase font-normal">Legal</th>
                  <th className="px-4 py-3 text-center text-xs text-white/30 tracking-widest uppercase font-normal">Wealth</th>
                  <th className="px-4 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {entitlements.map((e: any) => (
                  <tr key={e.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm text-white/70 font-mono">{e.plan_key}</td>
                    <td className="px-4 py-3 text-sm text-white/60 text-right">{e.max_specialty_agents}</td>
                    <td className="px-4 py-3 text-sm text-white/60 text-right">{e.max_custom_agents}</td>
                    <td className="px-4 py-3 text-sm text-white/60 text-right">{e.max_swarm_capacity}</td>
                    <td className="px-4 py-3 text-sm text-white/60 text-right">{e.max_workflows}</td>
                    <td className="px-4 py-3 text-center">{e.can_use_legal_addon ? '✅' : '—'}</td>
                    <td className="px-4 py-3 text-center">{e.can_use_wealth_addon ? '✅' : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditEnt(e)} className="px-2 py-1 text-xs rounded-sm bg-white/5 text-white/50 hover:text-white/80">Edit</button>
                        <button onClick={() => deleteEnt(e.id)} className="px-2 py-1 text-xs rounded-sm bg-red-900/30 text-red-400 hover:bg-red-900/60">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editEnt !== null && (
            <Modal title={editEnt.id ? 'Edit Entitlement' : 'New Entitlement'} onClose={() => setEditEnt(null)}>
              <form onSubmit={saveEnt} className="space-y-3">
                <input type="hidden" name="id" value={editEnt.id || ''} />
                <div>
                  <label className="block text-xs text-white/40 mb-1">Plan Key</label>
                  <select name="plan_key" defaultValue={editEnt.plan_key || tierKeys[0]} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70">
                    {tierKeys.map((k: string) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <Grid>
                  <Field label="Max Specialty Agents" name="max_specialty_agents" value={editEnt.max_specialty_agents ?? 0} type="number" />
                  <Field label="Max Custom Agents" name="max_custom_agents" value={editEnt.max_custom_agents ?? 0} type="number" />
                </Grid>
                <Grid>
                  <Field label="Max Swarm Capacity" name="max_swarm_capacity" value={editEnt.max_swarm_capacity ?? 0} type="number" />
                  <Field label="Max Workflows" name="max_workflows" value={editEnt.max_workflows ?? 0} type="number" />
                </Grid>
                <Grid>
                  <Field label="Max AI Memory (GB)" name="max_ai_memory_gbs" value={editEnt.max_ai_memory_gbs ?? 0} type="number" />
                  <div />
                </Grid>
                <div className="grid grid-cols-2 gap-4">
                  {['legal', 'wealth', 'luxury_hospitality', 'creator_commerce'].map(addon => (
                    <label key={addon} className="flex items-center gap-2">
                      <input type="checkbox" name={`can_use_${addon}_addon`} defaultChecked={(editEnt as any)[`can_use_${addon}_addon`]} className="accent-[#C6A664]" />
                      <span className="text-xs text-white/40">{addon.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditEnt(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-[#C6A664]/20 text-[#C6A664] hover:bg-[#C6A664]/30 rounded-sm">Save</button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white/80 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>
}

function Field({ label, name, value, type }: { label: string; name: string; value: any; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1">{label}</label>
      <input type={type || 'text'} name={name} defaultValue={value ?? ''}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-[#C6A664]/40" />
    </div>
  )
}
