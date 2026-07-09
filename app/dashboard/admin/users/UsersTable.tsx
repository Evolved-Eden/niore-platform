'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { UserRow } from './page'

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

export default function UsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const filtered = search
    ? users.filter(u =>
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
      )
    : users

  const doAction = useCallback(async (id: string, action: string, extra?: Record<string, string>) => {
    setActionMsg(null)
    const body: any = { action, userId: id, ...extra }
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) {
      setActionMsg({ type: 'err', text: data.error || 'Request failed' })
      return
    }
    // Update local state
    if (action === 'approve') {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, client_status: 'active' } : u))
    } else if (action === 'reject') {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, client_status: 'rejected' } : u))
    } else if (action === 'suspend') {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, client_status: 'suspended' } : u))
    } else if (action === 'set_plan' && extra?.plan) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, plan_tier: extra.plan } : u))
    } else if (action === 'delete') {
      if (data.ok) setUsers(prev => prev.filter(u => u.id !== id))
    }
    setActionMsg({ type: 'ok', text: `${action} — ok` })
    setTimeout(() => setActionMsg(null), 3000)
  }, [])

  const [planModal, setPlanModal] = useState<{ id: string; current: string | null } | null>(null)
  const [planValue, setPlanValue] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailUser, setDetailUser] = useState<UserRow | null>(null)
  const [resetPassModal, setResetPassModal] = useState<{ id: string; email: string | null } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [cleanupConfirm, setCleanupConfirm] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<string | null>(null)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">User Management</h1>
          <p className="text-white/40 text-sm mt-1">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCleanupConfirm(true)}
            className="px-4 py-2 text-xs rounded-sm bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors tracking-wider uppercase font-medium"
          >
            Cleanup Test Users
          </button>
          <Link href="/dashboard/admin/users/new" className="px-4 py-2 text-xs rounded-sm bg-[#c8ff00]/20 text-[#c8ff00] hover:bg-[#c8ff00]/30 transition-colors tracking-wider uppercase font-medium">
            + Add User
          </Link>
          {actionMsg && (
            <span className={`text-xs px-3 py-1 rounded-sm ${actionMsg.type === 'ok' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {actionMsg.text}
            </span>
          )}
          <input
            type="text"
            placeholder="Search by name or email..."
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
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">User</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Role</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Status</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Plan</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Created</th>
              <th className="px-6 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30 text-sm">No users found</td></tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <button onClick={() => setDetailUser(u)} className="text-left">
                      <div className="text-sm font-medium text-white/80 hover:text-[#c8ff00] transition-colors">{u.full_name || '—'}</div>
                      <div className="text-xs text-white/40">{u.email || '—'}</div>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/50">{u.role || 'client'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded-sm text-xs font-medium ${
                      u.client_status === 'active' ? 'bg-green-900/40 text-green-400' :
                      u.client_status === 'rejected' ? 'bg-red-900/40 text-red-400' :
                      u.client_status === 'suspended' ? 'bg-yellow-900/40 text-yellow-400' :
                      u.client_status === 'pending' ? 'bg-blue-900/40 text-blue-400' :
                      'bg-white/[0.04] text-white/30'
                    }`}>
                      {u.client_status || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/40">{u.plan_tier || '—'}</td>
                  <td className="px-6 py-4 text-sm text-white/40">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.client_status !== 'active' && (
                        <button
                          onClick={() => doAction(u.id, 'approve')}
                          className="px-3 py-1 text-xs rounded-sm bg-green-900/30 text-green-400 hover:bg-green-900/60 transition-colors"
                        >Approve</button>
                      )}
                      {u.client_status === 'active' && (
                        <button
                          onClick={() => doAction(u.id, 'suspend')}
                          className="px-3 py-1 text-xs rounded-sm bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/60 transition-colors"
                        >Suspend</button>
                      )}
                      <button
                        onClick={() => { setPlanModal({ id: u.id, current: u.plan_tier }); setPlanValue(u.plan_tier || '') }}
                        className="px-3 py-1 text-xs rounded-sm bg-blue-900/30 text-blue-400 hover:bg-blue-900/60 transition-colors"
                      >Plan</button>
                      <button
                        onClick={() => { setResetPassModal({ id: u.id, email: u.email }); setNewPassword('') }}
                        className="px-3 py-1 text-xs rounded-sm bg-purple-900/30 text-purple-400 hover:bg-purple-900/60 transition-colors"
                      >Reset PW</button>
                      {u.client_status !== 'active' && (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="px-3 py-1 text-xs rounded-sm bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors"
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
            <h3 className="text-lg font-semibold text-white/80 mb-2">Delete user?</h3>
            <p className="text-sm text-white/40 mb-6">This will remove the user and their client record. Cannot be undone.</p>
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
            <select
              value={planValue}
              onChange={e => setPlanValue(e.target.value)}
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

      {/* Reset Password modal */}
      {resetPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Reset Password</h3>
            <p className="text-sm text-white/40 mb-4">User: {resetPassModal.email || resetPassModal.id}</p>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2 text-sm text-white/70 mb-4 focus:outline-none"
              minLength={6}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setResetPassModal(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancel</button>
              <button
                onClick={async () => {
                  if (!newPassword || newPassword.length < 6) return
                  const res = await fetch('/api/admin/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: resetPassModal.id, newPassword }),
                  })
                  const data = await res.json()
                  setActionMsg({ type: data.success ? 'ok' : 'err', text: data.success ? 'Password reset' : data.error })
                  setResetPassModal(null)
                }}
                className="px-4 py-2 text-sm bg-purple-900/40 text-purple-400 hover:bg-purple-900/60 rounded-sm"
              >Set Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup confirmation */}
      {cleanupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Cleanup Test Users?</h3>
            <p className="text-sm text-white/40 mb-4">This will delete ALL users except you (edensevolutions). Their auth accounts, client records, twins, and data will be removed. Cannot be undone.</p>
            {cleanupResult ? (
              <div className="text-sm text-white/60 mb-4">{cleanupResult}</div>
            ) : (
              <div className="flex justify-end gap-3">
                <button onClick={() => setCleanupConfirm(false)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancel</button>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/admin/cleanup-users', { method: 'POST' })
                    const data = await res.json()
                    setCleanupResult(data.success ? `Deleted ${data.deleted} of ${data.total_found} users` : `Error: ${data.error}`)
                    if (data.success) {
                      // Refresh user list
                      setTimeout(() => window.location.reload(), 2000)
                    }
                  }}
                  className="px-4 py-2 text-sm bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded-sm"
                >Delete All Other Users</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-sm p-6 border border-white/[0.06] max-w-lg w-full">
            <h3 className="text-lg font-semibold text-white/80 mb-4">User Details</h3>
            <dl className="space-y-3 text-sm">
              <Row label="ID"><code className="text-xs text-white/40 font-mono">{detailUser.id}</code></Row>
              <Row label="Name">{detailUser.full_name || '—'}</Row>
              <Row label="Email">{detailUser.email || '—'}</Row>
              <Row label="Role">{detailUser.role || 'client'}</Row>
              <Row label="Status">{detailUser.client_status || '—'}</Row>
              <Row label="Plan">{detailUser.plan_tier || '—'}</Row>
              <Row label="Created">{detailUser.created_at ? new Date(detailUser.created_at).toLocaleString() : '—'}</Row>
            </dl>
            <div className="flex justify-end mt-6">
              <button onClick={() => setDetailUser(null)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-white/20 font-mono">
        Direct SQL — {users.length} users · live DB
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-white/40">{label}</dt>
      <dd className="text-white/70">{children}</dd>
    </div>
  )
}
