'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const USER_ROLES = [
  { value: 'client', label: 'Client' },
  { value: 'admin', label: 'Admin' },
  { value: 'creator', label: 'Creator' },
  { value: 'personal', label: 'Personal' },
]

const PLAN_TIERS = [
  { key: 'client_founder', label: 'Founder' },
  { key: 'client_teams', label: 'Teams' },
  { key: 'client_enterprise', label: 'Enterprise' },
  { key: 'creator_studio', label: 'Studio' },
  { key: 'creator_premium', label: 'Premium' },
  { key: 'creator_concierge', label: 'Concierge' },
  { key: 'client_test', label: '🚀 Test Account (unlimited)' },
]

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [mode, setMode] = useState<'basic' | 'full'>('basic')
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'client',
    planTier: '',
    isTestAccount: false,
    autoApprove: false,
    deployAgents: false,
    orgName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const endpoint = mode === 'full' ? '/api/admin/accounts/setup' : '/api/admin/users/new'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role: form.role,
          planTier: form.planTier || null,
          isTestAccount: form.isTestAccount,
          autoApprove: form.autoApprove,
          deployAgents: form.deployAgents,
          orgName: form.orgName || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Create New User</h1>
          <p className="text-white/40 text-sm mt-1">Add a user, client, admin, or test account</p>
        </div>
        <button onClick={() => router.push('/dashboard/admin/users')} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">
          Back to Users
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button onClick={() => setMode('basic')} className={`px-4 py-2 text-xs font-medium rounded-sm transition-colors ${mode === 'basic' ? 'bg-[#c8ff00] text-black' : 'bg-white/5 border border-white/10 text-white/60'}`}>
          Basic Setup
        </button>
        <button onClick={() => setMode('full')} className={`px-4 py-2 text-xs font-medium rounded-sm transition-colors ${mode === 'full' ? 'bg-[#c8ff00] text-black' : 'bg-white/5 border border-white/10 text-white/60'}`}>
          Full Setup (Org + Entitlements)
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-sm text-sm">{error}</div>
      )}

      {result && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-sm text-sm space-y-1">
          <p>✓ {result.message}</p>
          {result.userId && <p className="text-xs text-green-400/60">User ID: {result.userId}</p>}
          {result.organizationId && <p className="text-xs text-green-400/60">Org ID: {result.organizationId}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass rounded-sm p-6 space-y-5 border border-white/[0.06]">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Email <span className="text-red-400">*</span></label>
          <input type="email" required placeholder="user@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30" />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Password <span className="text-red-400">*</span></label>
          <input type="password" required minLength={6} placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30" />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Full Name</label>
          <input type="text" placeholder="Jane Doe" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30" />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70">
            {USER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* Plan Tier (shown for client/creator roles) */}
        {(form.role === 'client' || form.role === 'creator') && !form.isTestAccount && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Plan Tier</label>
            <select value={form.planTier} onChange={e => setForm({ ...form, planTier: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70">
              <option value="">None — assign later</option>
              {PLAN_TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
        )}

        {/* Full setup extra fields */}
        {mode === 'full' && (
          <>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Organization Name</label>
              <input type="text" placeholder="Leave blank for auto-generated" value={form.orgName} onChange={e => setForm({ ...form, orgName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="deployAgents" checked={form.deployAgents} onChange={e => setForm({ ...form, deployAgents: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="deployAgents" className="text-sm font-medium text-white/70">Deploy default agents (Zuri + Front Desk)</label>
            </div>
          </>
        )}

        {/* Test account override */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isTestAccount" checked={form.isTestAccount} onChange={e => { setForm({ ...form, isTestAccount: e.target.checked }); if (e.target.checked) setForm(f => ({ ...f, planTier: 'client_test', autoApprove: true })) }} className="w-4 h-4" />
          <label htmlFor="isTestAccount" className="text-sm font-medium text-white/70">Create as Test Account (auto-approved, unlimited entitlements)</label>
        </div>

        {/* Auto-approve */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="autoApprove" checked={form.autoApprove} onChange={e => setForm({ ...form, autoApprove: e.target.checked })} className="w-4 h-4" />
          <label htmlFor="autoApprove" className="text-sm font-medium text-white/70">Auto-approve (skip approval queue)</label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium bg-[#c8ff00] text-black rounded-sm hover:bg-white transition-colors font-bold flex-1">
            {loading ? 'Creating...' : result ? 'Create Another' : 'Create User'}
          </button>
          <button type="button" onClick={() => router.push('/dashboard/admin/users')} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
