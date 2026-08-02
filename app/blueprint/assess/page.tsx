'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Shared question types ──
type Question = {
  key: string; type: string; label: string; required?: boolean
  description?: string; options?: { value: string; label: string; weight?: number }[]
  scaleMin?: number; scaleMax?: number
}

type Section = {
  key: string; title: string; description: string
  questions: Question[]
}

// ── Intake role ──
type IntakeRole = 'client' | 'creator' | 'personal' | 'affiliate'
const VALID_PATHS: IntakeRole[] = ['client', 'creator', 'personal', 'affiliate']

// ── Flow step ──
type Step = 'loading' | 'welcome' | 'core' | 'core_complete' | 'extended' | 'extended_complete' | 'intake_role' | 'intake' | 'complete'

const STORAGE_KEY = 'blueprint_progress_v1'

function saveProgress(state: Record<string, any>) {
  try {
    const toSave: Record<string, any> = {}
    const keys: (keyof typeof state)[] = ['step', 'intakeRole', 'coreStep', 'coreAnswers', 'coreScores', 'coreResult', 'coreQIndex',
      'extStep', 'extAnswers', 'extScores', 'extResult', 'extQIndex',
      'intakeAnswers', 'intakeQuestions', 'intakeResult', 'intakeQIndex', 'pricingRec']
    for (const k of keys) {
      if (state[k] !== undefined) toSave[k] = state[k]
    }
    delete toSave.pricingRec
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {}
}

function loadProgress(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const validSteps: Step[] = ['loading', 'welcome', 'core', 'core_complete', 'extended', 'extended_complete', 'intake_role', 'intake', 'complete']
    if (!validSteps.includes(parsed.step)) return null
    return parsed
  } catch { return null }
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

function BlueprintAssessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathParam = searchParams?.get('path') as IntakeRole | null
  const initialIntakeRole = VALID_PATHS.includes(pathParam as IntakeRole) ? pathParam as IntakeRole : 'client'

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [returnUrl, setReturnUrl] = useState('')
  const [step, setStep] = useState<Step>('loading')
  const [intakeRole, setIntakeRole] = useState<IntakeRole>(initialIntakeRole)

  // Restore saved progress on mount
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    if (restored) return
    const saved = loadProgress()
    if (saved) {
      if (saved.step) setStep(saved.step as Step)
      if (saved.intakeRole) setIntakeRole(saved.intakeRole as IntakeRole)
      if (saved.coreStep) { setCoreStep(saved.coreStep); setCoreAnswers(saved.coreAnswers || {}); setCoreScores(saved.coreScores || {}); setCoreResult(saved.coreResult || null); setCoreQIndex(saved.coreQIndex ?? 0) }
      if (saved.extStep) { setExtStep(saved.extStep); setExtAnswers(saved.extAnswers || {}); setExtScores(saved.extScores || {}); setExtResult(saved.extResult || null); setExtQIndex(saved.extQIndex ?? 0) }
      if (saved.intakeRole) { setIntakeAnswers(saved.intakeAnswers || {}); setIntakeQuestions(saved.intakeQuestions || []); setIntakeResult(saved.intakeResult || null); setIntakeQIndex(saved.intakeQIndex ?? 0) }
    } else {
      setStep('welcome')
    }
    setRestored(true)
  }, [restored])

  useEffect(() => {
    if (pathParam && VALID_PATHS.includes(pathParam) && pathParam !== intakeRole) {
      clearProgress()
      setIntakeRole(pathParam)
    }
  }, [pathParam, intakeRole])

  // Core blueprint state
  const [coreSection, setCoreSection] = useState<Section | null>(null)
  const [coreStep, setCoreStep] = useState('identity')
  const [coreAnswers, setCoreAnswers] = useState<Record<string, any>>({})
  const [coreScores, setCoreScores] = useState<Record<string, number>>({})
  const [coreResult, setCoreResult] = useState<any>(null)
  const [coreQIndex, setCoreQIndex] = useState(0)

  // Extended blueprint state
  const [extSection, setExtSection] = useState<Section | null>(null)
  const [extStep, setExtStep] = useState('mind_body')
  const [extAnswers, setExtAnswers] = useState<Record<string, any>>({})
  const [extScores, setExtScores] = useState<Record<string, number>>({})
  const [extResult, setExtResult] = useState<any>(null)
  const [extQIndex, setExtQIndex] = useState(0)

  // Intake state
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, any>>({})
  const [intakeQuestions, setIntakeQuestions] = useState<Question[]>([])
  const [intakeResult, setIntakeResult] = useState<any>(null)
  const [intakeQIndex, setIntakeQIndex] = useState(0)

  // Pricing state
  const [pricingRec, setPricingRec] = useState<any>(null)
  const [pricingLoading, setPricingLoading] = useState(false)

  // Checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Trial state
  const [trialLoading, setTrialLoading] = useState(false)
  const [trialError, setTrialError] = useState<string | null>(null)

  // Loading / error
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Purchased system / tier detection
  const [userTier, setUserTier] = useState<string | null>(null)
  const [hasExpandedAccess, setHasExpandedAccess] = useState(false)

  // Save progress to localStorage whenever step or responses change
  useEffect(() => {
    if (!restored) return
    // Save immediately (not just on effect)
    saveProgress({ step, intakeRole, coreStep, coreAnswers, coreScores, coreResult, coreQIndex,
      extStep, extAnswers, extScores, extResult, extQIndex,
      intakeAnswers, intakeQuestions, intakeResult, intakeQIndex })
  }, [restored, step, intakeRole, coreStep, coreAnswers, coreScores, coreResult, coreQIndex,
    extStep, extAnswers, extScores, extResult, extQIndex,
    intakeAnswers, intakeQuestions, intakeResult, intakeQIndex])

  // Also save on page unload / visibility change to catch text-in-progress
  useEffect(() => {
    if (!restored) return
    const onSave = () => {
      saveProgress({ step, intakeRole, coreStep, coreAnswers, coreScores, coreResult, coreQIndex,
        extStep, extAnswers, extScores, extResult, extQIndex,
        intakeAnswers, intakeQuestions, intakeResult, intakeQIndex })
    }
    window.addEventListener('beforeunload', onSave)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onSave()
    })
    return () => {
      window.removeEventListener('beforeunload', onSave)
    }
  }, [restored, step, intakeRole, coreStep, coreAnswers, coreScores, coreResult, coreQIndex,
    extStep, extAnswers, extScores, extResult, extQIndex,
    intakeAnswers, intakeQuestions, intakeResult, intakeQIndex])

  // Fetch pricing recommendation when complete
  useEffect(() => {
    if (step !== 'complete') return
    if (pricingRec || pricingLoading) return

    const combinedScore = coreResult?.overallScore ?? 0
    setPricingLoading(true)
    ;(async () => {
      try {
        const res = await fetch('/api/blueprint/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blueprint_score: combinedScore,
            section_scores: coreResult?.scores ?? {},
            intake_role: intakeRole,
            archetype: coreResult?.archetype,
            blueprint_result: coreResult,
            ext_result: extResult,
            tier: userTier,
          }),
        })
        const d = await res.json()
        if (!d.error) setPricingRec(d)
      } catch {}
      setPricingLoading(false)
    })()
  }, [step, pricingRec, pricingLoading, coreResult, extResult, intakeRole])

  // Save blueprint to DB when complete (feeds essence boards)
  useEffect(() => {
    if (step !== 'complete') return
    if (!coreResult && !extResult) return
    if (!user) return

    // Debounce — wait for pricing to settle
    const timer = setTimeout(async () => {
      const blueprintData = {
        core: coreResult ? {
          overallScore: coreResult.overallScore,
          archetype: coreResult.archetype,
          scores: coreResult.scores,
          summary: coreResult.summary,
          recommended_agents: coreResult.recommended_agents,
        } : null,
        extended: extResult ? {
          life_profile: extResult.life_profile,
          top_domains: extResult.top_domains,
          domain_resonance: extResult.domain_resonance,
          overall_score: extResult.overall_score,
        } : null,
        intake: {
          role: intakeRole,
          answers: intakeAnswers,
          result: intakeResult,
        },
        pricing: pricingRec || null,
        completed_at: new Date().toISOString(),
      }

      await fetch('/api/blueprint/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, blueprint_data: blueprintData }),
      })

      // Trigger multi-lens profile calculation (astrology, numerology, etc.)
      fetch('/api/profile/calculate', { method: 'POST' }).catch(() => {})
    }, 2000)

    return () => clearTimeout(timer)
  }, [step, coreResult, extResult, intakeRole, intakeAnswers, intakeResult, pricingRec, user])

  // Auth check + read return URL + detect purchased system
  useEffect(() => {
    async function checkAuth() {
      const params = new URLSearchParams(window.location.search)
      setReturnUrl(params.get('return') || '')

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user ?? null)

      // Detect purchased system from client record
      if (user) {
        const { data: client } = await supabase
          .from('clients')
          .select('plan_tier_key, status, metadata')
          .eq('id', user.id)
          .maybeSingle()

        if (client?.plan_tier_key) {
          setUserTier(client.plan_tier_key)
        }
        // Also check metadata for system info (from free trial / provision)
        const meta = (client?.metadata as Record<string, any>) ?? {}
        if (!client?.plan_tier_key && meta.requested_plan_tier_key) {
          setUserTier(meta.requested_plan_tier_key)
        }

        // Extended scan is paywalled behind the Expanded Blueprint purchase --
        // check client_twins.metadata.blueprint_expanded (set by the Stripe
        // webhook), not clients.metadata.
        const { data: twin } = await supabase
          .from('client_twins')
          .select('metadata')
          .eq('client_id', user.id)
          .maybeSingle()
        setHasExpandedAccess(Boolean((twin?.metadata as any)?.blueprint_expanded))
      }

      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  // ──────── DEPLOY HANDLER ────────
  const handleDeployNow = useCallback(async () => {
    if (!pricingRec?.recommended_plan?.key) return
    setCheckoutLoading(true)
    setCheckoutError(null)
    clearProgress()

    try {
      const planKey = pricingRec.recommended_plan.key
      const recommendedAddons = pricingRec.recommended_addons || []
      const recommendedAgents = coreResult?.recommended_agents || []

      const res = await fetch('/api/stripe/checkout-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: planKey,
          path: intakeRole,
          addons: recommendedAddons.map((a: any) => ({ id: a.id, name: a.name })),
          agent_ids: recommendedAgents,
          vertical: '',
        }),
      })

      const d = await res.json()

      if (d.requiresAuth && d.redirectUrl) {
        router.push(d.redirectUrl)
        return
      }

      if (d.url) {
        window.location.href = d.url
        return
      }

      if (d.error) {
        setCheckoutError(d.error)
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Deploy failed. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }, [pricingRec, coreResult, intakeRole, router])

  // ──────── TRIAL HANDLER ────────
  const handleStartTrial = useCallback(async () => {
    setTrialLoading(true)
    setTrialError(null)
    clearProgress()

    try {
      const planKey = pricingRec?.recommended_plan?.key || 'trial'
      const res = await fetch('/api/blueprint/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeRole,
          planTierKey: planKey,
          blueprintData: { core: coreResult, extended: extResult, intake: intakeResult },
        }),
      })

      const d = await res.json()

      if (d.error) {
        setTrialError(d.error)
        return
      }

      if (d.redirectUrl) {
        router.push(d.redirectUrl)
      }
    } catch (err: any) {
      setTrialError(err.message || 'Trial activation failed')
    } finally {
      setTrialLoading(false)
    }
  }, [intakeRole, pricingRec, coreResult, extResult, intakeResult, router])

  // ──────── CORE BLUEPRINT ────────

  // Load core section
  const loadCoreSection = useCallback(async (s: string) => {
    setCoreStep(s)
    setCoreQIndex(0)
    const res = await fetch('/api/blueprint/core', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: s, tier: userTier }),
    })
    const d = await res.json()
    if (d.error) { setError(d.error); return }
    if (d.section) setCoreSection(d.section)
  }, [userTier])

  // Load first core section
  useEffect(() => {
    if (step === 'core') loadCoreSection('identity')
  }, [step, loadCoreSection])

  // Submit core section and advance
  const submitCoreSection = async () => {
    saveProgress({ step, intakeRole, coreStep, coreAnswers, coreScores, coreResult, coreQIndex,
      extStep, extAnswers, extScores, extResult, extQIndex,
      intakeAnswers, intakeQuestions, intakeResult, intakeQIndex })
    setLoadingMessage('Analyzing your responses...')
    const res = await fetch('/api/blueprint/core', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: coreStep,
        answers: coreAnswers,
        sectionScores: coreScores,
        tier: userTier,
      }),
    })
    const d = await res.json()
    setLoadingMessage('')
    if (d.error) { setError(d.error); return }

    // Merge scores
    if (d.sectionScores) setCoreScores(d.sectionScores)

    if (d.status === 'complete') {
      setCoreResult(d)
      setStep('core_complete')
      return
    }

    if (d.nextStep && d.nextSection) {
      setCoreStep(d.nextStep)
      setCoreSection(d.nextSection)
      setCoreQIndex(0)
    }
  }

  // ──────── EXTENDED BLUEPRINT ────────

  const loadExtSection = useCallback(async (s: string) => {
    setExtStep(s)
    setExtQIndex(0)
    const res = await fetch('/api/blueprint/extended', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: s, tier: userTier }),
    })
    if (res.status === 402) {
      router.push('/dashboard/client/blueprint?upgrade=expanded')
      return
    }
    const d = await res.json()
    if (d.error) { setError(d.error); return }
    if (d.section) setExtSection(d.section)
  }, [userTier, router])

  useEffect(() => {
    if (step === 'extended') loadExtSection('mind_body')
  }, [step, loadExtSection])

  const submitExtSection = async () => {
    saveProgress({ step, intakeRole, coreStep, coreAnswers, coreScores, coreResult, coreQIndex,
      extStep, extAnswers, extScores, extResult, extQIndex,
      intakeAnswers, intakeQuestions, intakeResult, intakeQIndex })
    setLoadingMessage('Analyzing your extended profile...')
    const res = await fetch('/api/blueprint/extended', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: extStep,
        answers: extAnswers,
        sectionScores: extScores,
        tier: userTier,
      }),
    })
    setLoadingMessage('')
    if (res.status === 402) {
      router.push('/dashboard/client/blueprint?upgrade=expanded')
      return
    }
    const d = await res.json()
    if (d.error) { setError(d.error); return }

    if (d.sectionScores) setExtScores(d.sectionScores)

    if (d.status === 'complete') {
      setExtResult(d)
      setStep('extended_complete')
      return
    }

    if (d.nextStep && d.nextSection) {
      setExtStep(d.nextStep)
      setExtSection(d.nextSection)
      setExtQIndex(0)
    }
  }

  // ──────── INTAKE ────────

  const loadIntakeQuestions = useCallback(async (role: IntakeRole) => {
    setIntakeRole(role)
    setIntakeQIndex(0)
    const res = await fetch(`/api/blueprint/intake/${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const d = await res.json()
    if (d.error) { setError(d.error); return }
    if (d.questions) setIntakeQuestions(d.questions)
  }, [])

  const submitIntake = async () => {
    saveProgress({ step, intakeRole, coreStep, coreAnswers, coreScores, coreResult, coreQIndex,
      extStep, extAnswers, extScores, extResult, extQIndex,
      intakeAnswers, intakeQuestions, intakeResult, intakeQIndex })
    setLoadingMessage('Submitting deployment intake...')
    const res = await fetch(`/api/blueprint/intake/${intakeRole}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: intakeAnswers }),
    })
    const d = await res.json()
    setLoadingMessage('')
    if (d.error) { setError(d.error); return }
    setIntakeResult(d.answers)
    setStep('complete')
  }

  useEffect(() => {
    if (pathParam && VALID_PATHS.includes(pathParam as IntakeRole) && pathParam !== intakeRole) {
      setIntakeRole(pathParam as IntakeRole)
    }
  }, [pathParam, intakeRole])

  // ──────── SHARED QUESTION RENDERER ────────

  const renderQuestion = (q: Question, answers: Record<string, any>, setAnswer: (k: string, v: any) => void) => {
    const val = answers[q.key]
    switch (q.type) {
      case 'select':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options?.map(o => (
              <button key={o.value} onClick={() => setAnswer(q.key, o.value)}
                className={`text-left p-4 rounded-xl border transition-all ${val === o.value ? 'border-[#C6A664] bg-[#C6A664]/10 text-[#C6A664]' : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06]'}`}>
                <div className="text-sm font-medium">{o.label}</div>
              </button>
            ))}
          </div>
        )
      case 'multi_select': {
        const sel: string[] = Array.isArray(val) ? val : []
        const toggle = (v: string) => setAnswer(q.key, sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v])
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options?.map(o => {
              const checked = sel.includes(o.value)
              return (
                <label key={o.value} onClick={() => toggle(o.value)}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${checked ? 'border-[#C6A664] bg-[#C6A664]/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'}`}>
                  <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-[#C6A664] border-[#C6A664]' : 'border-white/30'}`}>
                    {checked && (
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{o.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{checked ? '✓ Selected' : 'Click to select'}</div>
                  </div>
                </label>
              )
            })}
          </div>
        )
      }
      case 'scale': {
        const min = q.scaleMin ?? 1, max = q.scaleMax ?? 10
        return (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-white/40">
              <span>{min} – Low</span>
              <span>{max} – High</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => (
                <button key={n} onClick={() => setAnswer(q.key, n)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${val === n ? 'bg-[#C6A664] text-[#0A0A0B]' : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.1]'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )
      }
      case 'boolean':
        return (
          <div className="flex gap-4">
            {[true, false].map(b => (
              <button key={String(b)} onClick={() => setAnswer(q.key, b)}
                className={`px-6 py-3 rounded-xl border transition-all ${val === b ? 'border-[#C6A664] bg-[#C6A664]/10 text-[#C6A664]' : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20'}`}>
                {b ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        )
      case 'text':
        return (
          <textarea value={val ?? ''} onChange={e => setAnswer(q.key, e.target.value)}
            placeholder={q.description ?? 'Type your answer...'}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/30 focus:outline-none focus:border-[#C6A664]/50 focus:bg-white/[0.06] transition-all resize-none" rows={3} />
        )
      default:
        return <p className="text-white/40 text-sm">Unsupported</p>
    }
  }

  // ──────── CONVERSATION SECTION LAYOUT ────────

  const renderConversation = (
    section: Section | null,
    answers: Record<string, any>,
    setAnswer: (k: string, v: any) => void,
    onNext: () => void,
    onBack: () => void,
    isLast: boolean,
    sectionTitle: string,
    qIndex: number,
    setQIndex: (i: number) => void,
  ) => {
    if (!section || !section.questions.length) {
      return (
        <main className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
        </main>
      )
    }

    const q = section.questions[qIndex]
    const isLastQ = qIndex >= section.questions.length - 1
    const totalQ = section.questions.length
    const hasAnswer = answers[q.key] !== undefined && answers[q.key] !== '' && !(Array.isArray(answers[q.key]) && answers[q.key].length === 0)
    const needsContinue = q.type === 'multi_select' || q.type === 'text'

    function advance() {
      if (isLastQ) {
        onNext()
        setQIndex(0)
      } else {
        setQIndex(qIndex + 1)
      }
    }

    function handleAnswer(key: string, value: any) {
      setAnswer(key, value)
      // Auto-advance for single-select types
      if (!needsContinue && value !== undefined) {
        setTimeout(() => advance(), 300)
      }
    }

    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Progress header */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/30 text-xs">{sectionTitle}</span>
              <span className="text-white/20 text-xs">Question {qIndex + 1} of {totalQ}</span>
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#C6A664] rounded-full transition-all duration-300" style={{ width: `${((qIndex) / totalQ) * 100}%` }} />
            </div>
          </div>

          {/* Zuri conversation bubble */}
          <div className="flex gap-3 mb-6 animate-fade-in" key={`${section.key}-${qIndex}`}>
            <div className="w-9 h-9 rounded-full bg-[#C6A664]/20 flex items-center justify-center text-base shrink-0 mt-1">
              ◈
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/30 mb-1.5 tracking-wider uppercase">Zuri</p>
              <div className="rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] p-5">
                {qIndex === 0 && (
                  <p className="text-white/60 text-xs mb-3 leading-relaxed">{section.description}</p>
                )}
                <p className="text-white/90 font-medium leading-relaxed">
                  {q.label}
                  {q.required && <span className="text-red-400 ml-1">*</span>}
                </p>
                {q.description && (
                  <p className="text-white/40 text-xs mt-2 leading-relaxed">{q.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Answer area */}
          <div className="ml-12 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }} key={`answer-${section.key}-${qIndex}`}>
            {renderQuestion(q, answers, handleAnswer)}
          </div>

          {/* Continue button for multi_select / text */}
          {needsContinue && (
            <div className="flex justify-end mb-8">
              <button
                onClick={advance}
                disabled={!hasAnswer}
                className="px-6 py-2.5 rounded-xl bg-[#C6A664] text-[#0A0A0B] text-sm font-medium hover:bg-[#b8ee00] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLastQ ? 'Complete Section →' : 'Continue →'}
              </button>
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button onClick={() => {
              if (qIndex > 0) setQIndex(qIndex - 1)
              else onBack()
            }}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all text-xs">
              ← {qIndex > 0 ? 'Previous Question' : 'Back'}
            </button>
            <span className="text-[10px] text-white/20">
              {qIndex === 0 ? '' : `Question ${qIndex + 1}`}
            </span>
          </div>
        </div>
      </main>
    )
  }

  // ──────── RENDER STEPS ────────

  // Loading states
  if (checkingAuth || step === 'loading') return (
    <main className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
    </main>
  )

  if (error) return (
    <main className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-white/50 mb-6">{error}</p>
        <button onClick={() => { setError(null); setStep('welcome') }}
          className="px-6 py-3 bg-[#C6A664] text-[#0A0A0B] rounded-xl font-medium">
          Try Again
        </button>
      </div>
    </main>
  )

  if (loadingMessage) return (
    <main className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-semibold mb-2">{loadingMessage}</h2>
      </div>
    </main>
  )

  // ── WELCOME ──
  if (step === 'welcome') return (
    <main className="min-h-screen bg-[#0A0A0B] text-white flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-xs text-[#C6A664] uppercase tracking-widest mb-3">Intelligence Mapping Layer</div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-3">
            Welcome to Your <span className="text-[#C6A664]">Blueprint</span>
          </h1>
          <p className="text-white/40 max-w-lg mx-auto leading-relaxed">
            This is not a form. It&apos;s an intelligence mapping layer — discovering your identity,
            patterns, constraints, and trajectory. Your answers activate the agents, swarms, and
            workflows that will serve your evolution.
          </p>
          <p className="text-white/40 max-w-lg mx-auto leading-relaxed mt-4">
            The full Blueprint flow builds your AI twin, essence boards, business OS recommendations,
            and deployment intake in one connected experience.
          </p>
        </div>

        <div className="space-y-4 mb-10">
          <div className="glass rounded-2xl p-6 border border-white/[0.06]">
            <h3 className="text-lg font-semibold mb-2">Core Blueprint</h3>
            <p className="text-white/50 text-sm mb-4">40 questions across 6 dimensions — identity, reality, vision, business, digital environment, and system preferences. ~10 minutes.</p>
            <div className="flex items-center gap-3 text-xs text-white/30">
              <span>✦ Baseline score</span>
              <span>✦ Archetype</span>
              <span>✦ Agent recommendations</span>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 border border-white/[0.06] opacity-70">
            <h3 className="text-lg font-semibold mb-2">Extended Whole-Life Scan</h3>
            <p className="text-white/50 text-sm mb-4">35 questions across 7 life domains — mind, body, relationships, spiritual, lifestyle, creativity, legacy. ~10 minutes. Optional.</p>
            <div className="flex items-center gap-3 text-xs text-white/30">
              <span>✦ Life Intelligence Profile</span>
              <span>✦ 23-domain resonance map</span>
              <span>✦ Vertical recommendations</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => { clearProgress(); setStep('core') }}
            className="px-8 py-3 bg-[#C6A664] text-[#0A0A0B] rounded-xl font-bold hover:bg-white transition-all">
            Start Core Blueprint
          </button>
          <button onClick={async () => {
            clearProgress()
            setCoreResult({ status: 'skipped' })
            setExtResult({ status: 'skipped' })
            setStep('intake_role')
          }}
            className="px-8 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all">
            Already have a Blueprint? Set up Deployment
          </button>
        </div>
        
      </div>
    </main>
  )

  // ── CORE BLUEPRINT ──
  if (step === 'core') {
    const sectionNames = ['identity', 'reality', 'vision', 'business', 'digital', 'preferences']
    const sectionIdx = sectionNames.indexOf(coreStep)
    const isLast = coreStep === 'preferences'
    const setAnswer = (k: string, v: any) => setCoreAnswers(p => ({ ...p, [k]: v }))

    return renderConversation(
      coreSection, coreAnswers, setAnswer, submitCoreSection,
      () => {
        if (sectionIdx > 0) {
          loadCoreSection(sectionNames[sectionIdx - 1])
        } else {
          setStep('welcome')
        }
      },
      isLast,
      `Core Blueprint — Section ${sectionIdx + 1} of 6`,
      coreQIndex, setCoreQIndex,
    )
  }

  // ── CORE COMPLETE ──
  if (step === 'core_complete') return (
    <main className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">◈</div>
          <h1 className="text-3xl font-display font-bold mb-2">Core Blueprint Complete</h1>
          {coreResult?.archetype && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C6A664]/10 border border-[#C6A664]/20 text-[#C6A664] text-sm mb-4">
              Archetype: {coreResult.archetype}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="glass rounded-2xl p-8 border border-white/[0.06] mb-8 text-center">
          <div className="text-5xl font-bold text-[#C6A664] mb-2">{coreResult?.overallScore ?? 0}</div>
          <div className="text-white/40 text-sm">Blueprint Score</div>
        </div>

        {/* Section scores */}
        {coreResult?.scores && (
          <div className="space-y-3 mb-8">
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Dimension Scores</h3>
            {Object.entries(coreResult.scores).map(([key, score]: [string, any]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-white/50">{score}/100</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C6A664] rounded-full transition-all" style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {coreResult?.summary && (
          <p className="text-white/50 text-sm leading-relaxed mb-8 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {coreResult.summary}
          </p>
        )}

        {/* Recommended agents */}
        {coreResult?.recommended_agents && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">Recommended Agents</h3>
            <div className="flex flex-wrap gap-2">
              {coreResult.recommended_agents.map((a: string) => (
                <span key={a} className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/60 capitalize">
                  {a.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Next steps */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/10">
          <button
            onClick={() => {
              if (!hasExpandedAccess) {
                router.push('/dashboard/client/blueprint?upgrade=expanded')
                return
              }
              setStep('extended')
            }}
            className="flex-1 px-6 py-3 bg-[#C6A664] text-[#0A0A0B] rounded-xl font-bold hover:bg-white transition-all text-center">
            {hasExpandedAccess ? 'Continue to Extended Scan' : 'Unlock Extended Scan — $150'}
          </button>
          <button onClick={() => setStep('intake_role')}
            className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-center">
            Skip to Deployment Intake
          </button>
          <button onClick={() => { setStep('core'); setCoreAnswers({}); setCoreScores({}); setCoreResult(null); loadCoreSection('identity') }}
            className="px-6 py-3 rounded-xl border border-white/10 text-white/30 hover:text-white/60 transition-all text-center text-sm">
            Retake
          </button>
        </div>
      </div>
    </main>
  )

  // ── EXTENDED BLUEPRINT ──
  if (step === 'extended') {
    const sections = ['mind_body', 'relationships', 'spiritual', 'lifestyle', 'creativity', 'legacy', 'digital_self']
    const sectionIdx = sections.indexOf(extStep)
    const isLast = extStep === 'digital_self'
    const setAnswer = (k: string, v: any) => setExtAnswers(p => ({ ...p, [k]: v }))

    return renderConversation(
      extSection, extAnswers, setAnswer, submitExtSection,
      () => {
        if (sectionIdx > 0) {
          loadExtSection(sections[sectionIdx - 1])
        } else {
          setStep('core_complete')
        }
      },
      isLast,
      `Extended Scan — Section ${sectionIdx + 1} of 7`,
      extQIndex, setExtQIndex,
    )
  }

  // ── EXTENDED COMPLETE ──
  if (step === 'extended_complete') return (
    <main className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">✦</div>
          <h1 className="text-3xl font-display font-bold mb-2">Life Intelligence Profile</h1>
          <p className="text-white/50 text-sm">Your whole-life resonance map is ready</p>
        </div>

        {/* Life profile scores */}
        {extResult?.life_profile && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {Object.entries(extResult.life_profile).map(([key, score]: [string, any]) => (
              <div key={key} className="glass rounded-xl p-4 border border-white/[0.06] text-center">
                <div className="text-2xl font-bold text-[#C6A664]">{score}</div>
                <div className="text-xs text-white/40 capitalize mt-1">{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        )}

        {/* Domain resonance */}
        {extResult?.top_domains && (
          <div className="mb-10">
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Top Resonance Domains</h3>
            <div className="space-y-3">
              {extResult.top_domains.map((d: { domain: string; score: number }, i: number) => (
                <div key={d.domain}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70 capitalize">{d.domain.replace(/_/g, ' ')}</span>
                    <span className="text-[#C6A664]">{d.score}%</span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C6A664] rounded-full" style={{ width: `${d.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Domain resonance full map preview */}
        {extResult?.domain_resonance && (
          <details className="mb-10">
            <summary className="text-sm text-white/40 cursor-pointer hover:text-white/60">View all 23 domains</summary>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(extResult.domain_resonance).sort(([,a]: any, [,b]: any) => b - a).map(([key, score]: [string, any]) => (
                <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] text-xs">
                  <span className="text-white/50 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-white/70 font-medium">{score}%</span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Next steps */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/10">
          <button onClick={() => setStep('intake_role')}
            className="flex-1 px-6 py-3 bg-[#C6A664] text-[#0A0A0B] rounded-xl font-bold hover:bg-white transition-all text-center">
            Continue to Deployment Intake
          </button>
          <button onClick={async () => {
            setExtStep('mind_body')
            setExtAnswers({})
            setExtScores({})
            setExtResult(null)
            setStep('extended')
          }}
            className="px-6 py-3 rounded-xl border border-white/10 text-white/30 hover:text-white/60 transition-all text-center text-sm">
            Retake
          </button>
        </div>
      </div>
    </main>
  )

  // ── INTAKE ROLE SELECTION ──
  if (step === 'intake_role') return (
    <main className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold mb-3">Deployment <span className="text-[#C6A664]">Intake</span></h1>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            How will you use your intelligence system?
          </p>
        </div>

        <div className="space-y-4">
          {[
            { role: 'client' as IntakeRole, title: 'I want my own system', desc: 'Deploy a personal intelligence system for my life and business', icon: '◈' },
            { role: 'creator' as IntakeRole, title: 'I build for clients', desc: 'I\'m an agency, consultant, or tech provider deploying for others', icon: '◆' },
            { role: 'personal' as IntakeRole, title: 'Personal use', desc: 'For myself, my family, or my personal projects', icon: '◇' },
            { role: 'affiliate' as IntakeRole, title: 'Affiliate OS', desc: 'For affiliate marketers and referral partners', icon: '⊘' },
          ].map(({ role, title, desc, icon }) => (
            <button key={role} onClick={() => { setIntakeRole(role); loadIntakeQuestions(role); setStep('intake') }}
              className="w-full glass rounded-2xl p-6 border border-white/[0.06] hover:border-[#C6A664]/30 hover:bg-white/[0.03] transition-all text-left flex items-center gap-5">
              <div className="text-3xl text-[#C6A664]">{icon}</div>
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-white/50 text-sm mt-1">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <button onClick={() => {
          if (extResult) setStep('extended_complete')
          else if (coreResult) setStep('core_complete')
          else setStep('welcome')
        }}
          className="mt-8 text-sm text-white/30 hover:text-white/50 transition-colors mx-auto block">
          ← Back
        </button>
      </div>
    </main>
  )

  // ── INTAKE FORM (Conversation) ──
  if (step === 'intake') {
    const setAnswer = (k: string, v: any) => setIntakeAnswers(p => ({ ...p, [k]: v }))

    if (intakeQuestions.length === 0) return (
      <main className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
      </main>
    )

    const roleNames: Record<IntakeRole, string> = { client: 'Client', creator: 'Creator', personal: 'Personal', affiliate: 'Affiliate' }
    const q = intakeQuestions[intakeQIndex]
    const isLastQ = intakeQIndex >= intakeQuestions.length - 1
    const hasAnswer = q && intakeAnswers[q.key] !== undefined && intakeAnswers[q.key] !== '' && !(Array.isArray(intakeAnswers[q.key]) && intakeAnswers[q.key].length === 0)
    const needsContinue = q?.type === 'multi_select' || q?.type === 'text'

    function advance() {
      if (isLastQ) {
        submitIntake()
      } else {
        setIntakeQIndex(intakeQIndex + 1)
      }
    }

    if (!q) return (
      <main className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
      </main>
    )

    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/30 text-xs">Deployment Intake — {roleNames[intakeRole]}</span>
              <span className="text-white/20 text-xs">Question {intakeQIndex + 1} of {intakeQuestions.length}</span>
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#C6A664] rounded-full transition-all duration-300" style={{ width: `${(intakeQIndex / intakeQuestions.length) * 100}%` }} />
            </div>
          </div>

          {/* Zuri bubble */}
          <div className="flex gap-3 mb-6 animate-fade-in" key={`intake-${intakeQIndex}`}>
            <div className="w-9 h-9 rounded-full bg-[#C6A664]/20 flex items-center justify-center text-base shrink-0 mt-1">
              ◈
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/30 mb-1.5 tracking-wider uppercase">Zuri</p>
              <div className="rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] p-5">
                {intakeQIndex === 0 && (
                  <p className="text-white/60 text-xs mb-3 leading-relaxed">
                    {intakeRole === 'client' && 'Set up your personal intelligence system deployment.'}
                    {intakeRole === 'creator' && 'Configure how you deploy intelligence systems for your clients.'}
                    {intakeRole === 'personal' && 'Set up your personal intelligence system and AI companion.'}
                    {intakeRole === 'affiliate' && 'Set up your affiliate partnership and referral tracking.'}
                  </p>
                )}
                <p className="text-white/90 font-medium leading-relaxed">
                  {q.label}{q.required && <span className="text-red-400 ml-1">*</span>}
                </p>
                {q.description && (
                  <p className="text-white/40 text-xs mt-2 leading-relaxed">{q.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Answer area */}
          <div className="ml-12 mb-8 animate-fade-in" key={`answer-intake-${intakeQIndex}`}>
            {renderQuestion(q, intakeAnswers, (key, value) => {
              setAnswer(key, value)
              if (!needsContinue && value !== undefined) {
                setTimeout(() => advance(), 300)
              }
            })}
          </div>

          {/* Continue button */}
          {needsContinue && (
            <div className="flex justify-end mb-8">
              <button
                onClick={advance}
                disabled={!hasAnswer}
                className="px-6 py-2.5 rounded-xl bg-[#C6A664] text-[#0A0A0B] text-sm font-medium hover:bg-[#b8ee00] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLastQ ? 'Complete Setup →' : 'Continue →'}
              </button>
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button onClick={() => {
              if (intakeQIndex > 0) setIntakeQIndex(intakeQIndex - 1)
              else setStep('intake_role')
            }}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all text-xs">
              ← {intakeQIndex > 0 ? 'Previous Question' : 'Change Role'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── COMPLETE / DEPLOY ──
  if (step === 'complete') {
    const combinedScore = coreResult?.overallScore ?? 0
    const lifeScore = extResult?.overall_score ?? null

    const plan = pricingRec?.recommended_plan

    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">⛭</div>
            <h1 className="text-3xl font-display font-bold mb-2">Blueprint Ready</h1>
            <p className="text-white/50 text-sm">Your intelligence system is configured and ready to deploy</p>
          </div>

          {/* Combined scores */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass rounded-xl p-6 border border-white/[0.06] text-center">
              <div className="text-3xl font-bold text-[#C6A664]">{combinedScore}</div>
              <div className="text-xs text-white/40 mt-1">Blueprint Score</div>
            </div>
            {lifeScore !== null && (
              <div className="glass rounded-xl p-6 border border-white/[0.06] text-center">
                <div className="text-3xl font-bold text-[#5E8B84]">{lifeScore}</div>
                <div className="text-xs text-white/40 mt-1">Life Intelligence</div>
              </div>
            )}
          </div>

          {/* Archetype */}
          {coreResult?.archetype && (
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#C6A664]/10 border border-[#C6A664]/20 text-[#C6A664] text-sm">
                Archetype: {coreResult.archetype}
              </span>
            </div>
          )}

          {/* ── RECOMMENDED PLAN ── */}
          {pricingLoading && (
            <div className="glass rounded-2xl p-8 border border-white/[0.06] mb-8 text-center">
              <div className="w-6 h-6 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-white/40">Calculating your best plan...</p>
            </div>
          )}

          {pricingRec && plan && (
            <div className="glass rounded-2xl p-6 border border-[#C6A664]/20 mb-8" style={{ background: 'linear-gradient(135deg, rgba(200,255,0,0.05) 0%, rgba(200,255,0,0.01) 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-[#C6A664] uppercase tracking-widest mb-1">Recommended Plan</div>
                  <h2 className="text-2xl font-bold">
                    {plan.name} <span className="text-base font-normal text-white/40">{plan.period}</span>
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#C6A664]">${plan.price.toLocaleString()}</div>
                  <div className="text-xs text-white/40">{plan.period || 'free'}</div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="text-sm text-white/50 mb-4">
                <span className="text-white/70 font-medium">${plan.price.toLocaleString()}</span> base + <span className="text-white/70 font-medium">${pricingRec.addon_total.toLocaleString()}</span> recommended add-ons
                {pricingRec.monthly_total > plan.price && (
                  <span className="block mt-1 text-xs text-white/30">= <span className="text-[#C6A664] font-medium">${pricingRec.monthly_total.toLocaleString()}/month</span> total</span>
                )}
              </div>

              {/* Recommended add-ons */}
              {pricingRec.recommended_addons?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Intelligent Add-On Recommendations</p>
                  <div className="flex flex-wrap gap-2">
                    {pricingRec.recommended_addons.map((a: any) => (
                      <span key={a.id} className="px-3 py-1 rounded-full border border-white/10 text-xs text-white/60 bg-white/[0.03]">
                        {a.name} <span className="text-[#C6A664]">+${a.price}{a.period}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── BUSINESS OS (custom) ── */}
          {pricingRec?.business_os_eligible && (
            <div className="glass rounded-2xl p-6 border border-white/[0.06] mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Upgrade Available</div>
                  <h3 className="text-lg font-bold text-white/90">{pricingRec.business_os.name}</h3>
                  <p className="text-xs text-white/40 mt-1 max-w-md">{pricingRec.business_os.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#C6A664]">{pricingRec.business_os.price_label}</div>
                  <div className="text-[10px] text-white/30">Enterprise-grade</div>
                </div>
              </div>
            </div>
          )}

          {/* Deploy checklist */}
          <div className="glass rounded-2xl p-6 border border-white/[0.06] mb-8">
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Deployment Checklist</h3>
            <div className="space-y-3">
              {[
                { label: 'Blueprint Assessment', done: !!coreResult },
                { label: 'Life Intelligence Scan', done: !!extResult?.life_profile },
                { label: 'Deployment Intake', done: !!intakeResult?.completed },
                { label: 'Agent Selection', done: true },
                { label: 'Dashboard Configuration', done: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${item.done ? 'bg-[#C6A664] text-[#0A0A0B]' : 'bg-white/[0.06] text-white/30'}`}>
                    {item.done ? '✓' : i + 1}
                  </div>
                  <span className={item.done ? 'text-white/70' : 'text-white/30'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended agents */}
          {coreResult?.recommended_agents && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">Recommended Agents</h3>
              <div className="flex flex-wrap gap-2">
                {coreResult.recommended_agents.map((a: string) => (
                  <span key={a} className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/60 capitalize">
                    {a.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!user && (
            <div className="glass rounded-2xl p-6 border border-white/[0.06] mb-8 bg-white/[0.02]">
              <div className="flex items-start gap-4">
                <div className="text-3xl">◈</div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Save your Blueprint</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    You&apos;re exploring the Blueprint as a guest. Create an account to save your progress, deploy your system, and return to your recommendations anytime.
                  </p>
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search))}
                      className="flex-1 px-5 py-3 rounded-xl bg-[#C6A664] text-[#0A0A0B] font-semibold hover:bg-white transition-all"
                    >
                      Sign in to save
                    </button>
                    <button
                      onClick={() => router.push('/register?redirect=' + encodeURIComponent(window.location.pathname + window.location.search))}
                      className="flex-1 px-5 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
                    >
                      Create account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Checkout error */}
          {checkoutError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {checkoutError}
            </div>
          )}

          {/* Actions — Deploy Now vs Free Trial */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/10">
            <button
              onClick={handleDeployNow}
              disabled={checkoutLoading || trialLoading || !pricingRec?.recommended_plan?.key}
              className="flex-1 px-8 py-4 bg-[#C6A664] text-[#0A0A0B] rounded-xl font-bold hover:bg-white transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed text-base"
            >
              {checkoutLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Deploying...
                </span>
              ) : (
                `Deploy Now — ${plan?.name || 'Your Plan'}`
              )}
            </button>
            {user && (
              <button
                onClick={handleStartTrial}
                disabled={trialLoading || checkoutLoading}
                className="flex-1 px-8 py-4 rounded-xl border-2 border-[#C6A664]/40 text-[#C6A664] font-bold hover:bg-[#C6A664]/10 transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed text-base"
              >
                {trialLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
                    Activating Trial...
                  </span>
                ) : (
                  'Start 3-Day Free Trial'
                )}
              </button>
            )}
            <button onClick={() => {
              const planKey = pricingRec?.recommended_plan?.key || ''
              router.push(`/pricing/${intakeRole}?tier=${planKey}&score=${combinedScore}`)
            }}
              className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-center text-sm">
              {plan ? `View ${plan.name} Pricing` : 'Plans'}
            </button>
            <button onClick={() => router.push(returnUrl || (user ? '/dashboard' : '/register'))}
              className="px-6 py-3 rounded-xl border border-white/10 text-white/30 hover:text-white/60 transition-all text-center text-sm">
              {returnUrl ? '← Dashboard' : user ? 'Dashboard' : 'Create Account'}
            </button>
          </div>
          {trialError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {trialError}
            </div>
          )}
        </div>
      </main>
    )
  }

  return null
}

function BlueprintAssessFallback() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
    </main>
  )
}

export default function BlueprintAssessPage() {
  return (
    <Suspense fallback={<BlueprintAssessFallback />}>
      <BlueprintAssessContent />
    </Suspense>
  )
}
