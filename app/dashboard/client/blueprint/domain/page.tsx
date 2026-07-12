'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Question = {
  key: string
  type: 'select' | 'scale' | 'text'
  label: string
  system: string
  options?: { value: string; label: string; weight: number }[]
  scaleMin?: number
  scaleMax?: number
}

type ExistingProfile = {
  score: number
  insights: string[]
  answers: Record<string, any>
  completedAt: string
}

function DomainAssessmentInner() {
  const params = useSearchParams()
  const router = useRouter()
  const domain = params.get('key') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ message: string; purchaseUrl?: string } | null>(null)
  const [label, setLabel] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; insights: string[] } | null>(null)

  useEffect(() => {
    async function load() {
      if (!domain) {
        setError({ message: 'No domain module specified.' })
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/blueprint/domain?domain=${encodeURIComponent(domain)}`)
        const data = await res.json()
        if (res.status === 402) {
          setError({ message: data.message || 'This module has not been purchased yet.', purchaseUrl: data.purchase_url })
        } else if (!res.ok) {
          setError({ message: data.error || 'Failed to load module.' })
        } else {
          setLabel(data.label)
          setQuestions(data.questions || [])
          setExistingProfile(data.existingProfile)
          if (data.existingProfile?.answers) setAnswers(data.existingProfile.answers)
        }
      } catch (e: any) {
        setError({ message: e.message || 'Failed to load module.' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [domain])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/blueprint/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, answers }),
      })
      const data = await res.json()
      if (res.status === 402) {
        setError({ message: data.message, purchaseUrl: data.purchase_url })
      } else if (!res.ok) {
        setError({ message: data.error || 'Failed to save answers.' })
      } else {
        setResult({ score: data.profile.score, insights: data.profile.insights })
      }
    } catch (e: any) {
      setError({ message: e.message || 'Failed to save answers.' })
    } finally {
      setSubmitting(false)
    }
  }

  const allAnswered = questions.length > 0 && questions.every((q) => {
    const v = answers[q.key]
    return v !== undefined && v !== null && v !== ''
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="text-3xl mb-4">🔒</div>
        <h1 className="text-lg font-semibold mb-2">{label || 'Domain Module'}</h1>
        <p className="text-sm text-white/50 mb-6">{error.message}</p>
        <Link
          href={error.purchaseUrl || '/dashboard/client/blueprint'}
          className="inline-block px-5 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
        >
          Go to Blueprint
        </Link>
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center animate-fade-in">
        <div className="text-3xl mb-4">✨</div>
        <h1 className="text-lg font-semibold mb-1">{label} Profile Complete</h1>
        <p className="text-sm text-white/40 mb-6">Score: {result.score}/100</p>
        <div className="text-left space-y-2 mb-8">
          {result.insights.map((ins, i) => (
            <div key={i} className="glass rounded-sm border border-white/[0.06] p-3 text-xs text-white/60">
              {ins}
            </div>
          ))}
        </div>
        <p className="text-xs text-white/30 mb-4">
          This is now a permanent category in your Essence Board — you&apos;ll see {label.toLowerCase()} insights show up
          in your daily, weekly, and monthly intelligence going forward.
        </p>
        <Link
          href="/dashboard/client/essence"
          className="inline-block px-5 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
        >
          View Essence Board
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-10 animate-fade-in">
      <button onClick={() => router.push('/dashboard/client/blueprint')} className="text-xs text-white/30 hover:text-white/60 mb-6">
        ← Back to Blueprint
      </button>
      <h1 className="font-display text-xl font-bold mb-1">
        {label} <span className="text-[#c8ff00]">Module</span>
      </h1>
      <p className="text-white/30 text-sm mb-8">
        {existingProfile ? 'Update your answers below — this refreshes your permanent Essence Board category.' : '5 quick questions. Your answers become a permanent part of your Essence Board.'}
      </p>

      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.key} className="glass rounded-sm border border-white/[0.06] p-4">
            <label className="block text-sm font-medium mb-3">{q.label}</label>

            {q.type === 'select' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options?.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: opt.value }))}
                    className={`text-left text-xs px-3 py-2 rounded-sm border transition-colors ${
                      answers[q.key] === opt.value
                        ? 'border-[#c8ff00] bg-[#c8ff00]/10 text-[#c8ff00]'
                        : 'border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'scale' && (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={q.scaleMin ?? 1}
                  max={q.scaleMax ?? 10}
                  value={answers[q.key] ?? Math.round(((q.scaleMin ?? 1) + (q.scaleMax ?? 10)) / 2)}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: Number(e.target.value) }))}
                  className="flex-1 accent-[#c8ff00]"
                />
                <span className="text-sm font-semibold text-[#c8ff00] w-8 text-center">
                  {answers[q.key] ?? Math.round(((q.scaleMin ?? 1) + (q.scaleMax ?? 10)) / 2)}
                </span>
              </div>
            )}

            {q.type === 'text' && (
              <textarea
                value={answers[q.key] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#c8ff00]/50"
                placeholder="Your answer..."
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="mt-8 w-full py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving...' : existingProfile ? 'Update Profile' : 'Complete Module'}
      </button>
    </div>
  )
}

export default function DomainAssessmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" /></div>}>
      <DomainAssessmentInner />
    </Suspense>
  )
}
