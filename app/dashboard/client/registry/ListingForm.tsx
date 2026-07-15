'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Initial = {
  isListed: boolean
  visibility: 'anonymous' | 'named'
  headline: string
  skills: string[]
}

export default function ListingForm({ twinId, initial }: { twinId: string; initial: Initial }) {
  const router = useRouter()
  const [isListed, setIsListed] = useState(initial.isListed)
  const [visibility, setVisibility] = useState(initial.visibility)
  const [headline, setHeadline] = useState(initial.headline)
  const [skillsInput, setSkillsInput] = useState(initial.skills.join(', '))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save(overrides: Partial<Initial & { isListed: boolean }> = {}) {
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        twinId,
        isListed: overrides.isListed ?? isListed,
        visibility: overrides.visibility ?? visibility,
        headline: overrides.headline ?? headline,
        skills: (overrides.skills ?? skillsInput.split(',').map((s) => s.trim()).filter(Boolean)),
      }
      const res = await fetch('/api/client/twin/listing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json.error || 'Something went wrong')
        return
      }
      setMessage(json.message)
      router.refresh()
    } catch {
      setMessage('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">List my Twin in the Registry</p>
          <p className="text-xs text-white/30">Entirely optional. Off by default. You can remove it anytime.</p>
        </div>
        <button
          onClick={() => {
            const next = !isListed
            setIsListed(next)
            save({ isListed: next })
          }}
          disabled={saving}
          className="px-4 py-2 text-xs font-bold rounded-sm disabled:opacity-40"
          style={isListed ? { backgroundColor: '#C6A664', color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
        >
          {isListed ? 'Listed' : 'Not Listed'}
        </button>
      </div>

      {isListed && (
        <div className="space-y-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <label className="text-[10px] text-white/30 tracking-widest uppercase block mb-1.5">Headline</label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Content strategy, trained across two Marketing Departments"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#C6A664]/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 tracking-widest uppercase block mb-1.5">Skills (comma separated)</label>
            <input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="content strategy, campaign analytics, copywriting"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#C6A664]/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 tracking-widest uppercase block mb-1.5">Visibility</label>
            <div className="flex gap-2">
              <button
                onClick={() => setVisibility('anonymous')}
                className="px-3 py-1.5 text-xs rounded-sm"
                style={visibility === 'anonymous' ? { backgroundColor: '#C6A664', color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              >
                Anonymous
              </button>
              <button
                onClick={() => setVisibility('named')}
                className="px-3 py-1.5 text-xs rounded-sm"
                style={visibility === 'named' ? { backgroundColor: '#C6A664', color: '#0A0A0B' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              >
                Show my org
              </button>
            </div>
          </div>
          <button
            onClick={() => save()}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold rounded-sm disabled:opacity-40"
            style={{ backgroundColor: '#C6A664', color: '#0A0A0B' }}
          >
            {saving ? 'Saving...' : 'Save Listing'}
          </button>
        </div>
      )}

      {message && <p className="text-xs text-[#C6A664]">{message}</p>}
    </div>
  )
}
