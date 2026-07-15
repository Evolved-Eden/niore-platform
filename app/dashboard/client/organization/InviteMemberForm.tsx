'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const IDENTIFIER_TYPES = [
  { key: 'email', label: 'Email', placeholder: 'colleague@company.com', type: 'email' },
  { key: 'username', label: 'Username', placeholder: '@username', type: 'text' },
  { key: 'phone', label: 'Phone', placeholder: '+1 555 000 0000', type: 'tel' },
] as const

export default function InviteMemberForm({ organizationId }: { organizationId: string | null }) {
  const router = useRouter()
  const [identifierType, setIdentifierType] = useState<'email' | 'username' | 'phone'>('email')
  const [identifierValue, setIdentifierValue] = useState('')
  const [role, setRole] = useState('member')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const current = IDENTIFIER_TYPES.find((t) => t.key === identifierType)!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch('/api/client/organization/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [identifierType]: identifierValue,
          role,
          organizationId,
          orgName: organizationId ? undefined : orgName,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Something went wrong')
        return
      }
      setSuccess(json.message || 'Invited')
      setIdentifierValue('')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!organizationId && (
        <div>
          <label className="text-[10px] text-white/30 tracking-widest uppercase block mb-1.5">Organization Name</label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            placeholder="Acme Inc."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#C6A664]/40"
          />
        </div>
      )}

      <div className="flex gap-2">
        {IDENTIFIER_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setIdentifierType(t.key)}
            className="px-2.5 py-1 text-[10px] rounded-sm"
            style={identifierType === t.key ? { backgroundColor: '#C6A664', color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-white/30 tracking-widest uppercase block mb-1.5">{current.label}</label>
          <input
            type={current.type}
            value={identifierValue}
            onChange={(e) => setIdentifierValue(e.target.value)}
            required
            placeholder={current.placeholder}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#C6A664]/40"
          />
        </div>
        <div>
          <label className="text-[10px] text-white/30 tracking-widest uppercase block mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#C6A664]/40"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-[#C6A664]">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
      >
        {loading ? 'Sending...' : organizationId ? 'Invite Member' : 'Create Organization & Invite'}
      </button>

      <p className="text-[10px] text-white/20 pt-1">
        The person needs an existing account with this {current.label.toLowerCase()}. Invites for people
        without an account yet are on the roadmap.
      </p>
    </form>
  )
}
