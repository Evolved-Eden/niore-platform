'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MemberActions({ memberId, memberName }: { memberId: string; memberName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<'detach' | 'transfer' | null>(null)
  const [result, setResult] = useState<{ message?: string; error?: string; transferCheckoutUrl?: string } | null>(null)

  async function handleRemove(action: 'detach' | 'transfer') {
    setLoading(action)
    setResult(null)
    try {
      const res = await fetch('/api/client/organization/members/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResult({ error: json.error || 'Something went wrong' })
        return
      }
      setResult(json)
      if (action === 'detach') router.refresh()
    } catch {
      setResult({ error: 'Something went wrong' })
    } finally {
      setLoading(null)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] text-white/20 hover:text-red-400 transition-colors uppercase tracking-widest"
      >
        Remove
      </button>
    )
  }

  return (
    <div className="text-right">
      {!result ? (
        <div className="flex flex-col items-end gap-2">
          <p className="text-[10px] text-white/30 mb-1">Remove {memberName}?</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleRemove('detach')}
              disabled={loading !== null}
              className="text-[10px] px-2.5 py-1 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 disabled:opacity-40"
            >
              {loading === 'detach' ? 'Removing...' : 'Detach Twin'}
            </button>
            <button
              onClick={() => handleRemove('transfer')}
              disabled={loading !== null}
              className="text-[10px] px-2.5 py-1 rounded-sm bg-[#8B7AA8]/10 border border-[#8B7AA8]/20 text-[#8B7AA8] disabled:opacity-40"
            >
              {loading === 'transfer' ? 'Sending...' : 'Let Them Keep It'}
            </button>
            <button onClick={() => setOpen(false)} className="text-[10px] text-white/20">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="text-right max-w-xs">
          {result.error ? (
            <p className="text-[10px] text-red-400">{result.error}</p>
          ) : (
            <>
              <p className="text-[10px] text-[#C6A664]">{result.message}</p>
              {result.transferCheckoutUrl && (
                <a href={result.transferCheckoutUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#8B7AA8] underline block mt-1">
                  Copy transfer link →
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
