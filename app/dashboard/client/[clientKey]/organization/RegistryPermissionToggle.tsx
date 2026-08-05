'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegistryPermissionToggle({ organizationId, initialValue }: { organizationId: string; initialValue: boolean }) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !value
    setValue(next)
    setSaving(true)
    try {
      const res = await fetch('/api/client/organization/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, allowMemberRegistryListing: next }),
      })
      if (!res.ok) setValue(!next) // revert on failure
      router.refresh()
    } catch {
      setValue(!next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white/70">Let members list their Twin in the Registry</p>
        <p className="text-xs text-white/30 max-w-md mt-1">
          All-or-nothing for the whole org. Members still choose individually whether they
          actually list — this only decides whether they're allowed to.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className="px-4 py-2 text-xs font-bold rounded-sm shrink-0 disabled:opacity-40"
        style={value ? { backgroundColor: '#C6A664', color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
      >
        {value ? 'Allowed' : 'Not Allowed'}
      </button>
    </div>
  )
}
