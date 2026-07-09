'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Types ─────────────────────────────────────────────────────
type Step = 'payment' | 'zuri' | 'upload' | 'schedule' | 'done'

interface SlotsByDate {
  [date: string]: string[]
}

// ── Time slots (customize as needed) ─────────────────────────
const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']

function getNext14Days(): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) { // skip weekends
      days.push(d.toISOString().split('T')[0])
    }
  }
  return days
}

// ── Payment Step ──────────────────────────────────────────────
function PaymentStep({ clientSecret, amount, label, onSuccess }: {
  clientSecret: string
  amount: number
  label: string
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (error) {
      toast.error(error.message ?? 'Payment failed')
      setLoading(false)
      return
    }

    toast.success('Payment confirmed!')
    onSuccess()
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Complete your enrollment</h2>
        <p className="text-white/40 text-sm">Secure your intelligence tier to begin onboarding.</p>
      </div>

      {/* Amount summary */}
      <div className="glass rounded-sm p-5 mb-6 flex items-center justify-between">
        <div className="text-sm text-white/60">{label}</div>
        <div className="text-xl font-bold text-[#c8ff00]">
          ${(amount / 100).toLocaleString()}
        </div>
      </div>

      <form onSubmit={handlePay} className="space-y-6">
        <div className="glass rounded-sm p-5">
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>

        <button
          type="submit"
          disabled={loading || !stripe}
          className="w-full py-4 bg-[#c8ff00] text-black font-bold text-sm rounded-sm hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Pay $${(amount / 100).toLocaleString()} & Begin Onboarding`}
        </button>

        <p className="text-center text-xs text-white/20">
          Your card is saved for recurring billing. Cancel anytime.
        </p>
      </form>
    </div>
  )
}

// ── Zuri Intro Step ───────────────────────────────────────────
function ZuriStep({ onNext, userName }: { onNext: () => void; userName: string }) {
  const [messages, setMessages] = useState([
    {
      from: 'zuri',
      text: `Welcome, ${userName}. I'm Zuri — your dedicated intelligence. I'm going to help you set up your system from the ground up. Before we dive in, tell me: what's the single biggest operational bottleneck in your business right now?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { from: 'user', text: userMsg }])
    setLoading(true)

    const res = await fetch('/api/zuri', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMsg }],
        context: 'This is the client onboarding intake. Ask 2-3 strategic questions to understand their business, then tell them what to upload and that you will see them at their consultation. Keep responses under 3 sentences. After 2 exchanges, set ready=true in your response as JSON: {"reply":"...","ready":true}',
      }),
    })

    const data = await res.json()
    let reply = data.reply ?? "I'm processing your information. Let's continue."
    let isReady = false

    // Check if Zuri signals readiness
    try {
      const parsed = JSON.parse(reply)
      reply = parsed.reply
      isReady = parsed.ready ?? false
    } catch {}

    setMessages(m => [...m, { from: 'zuri', text: reply }])
    if (isReady) setReady(true)
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#c8ff00]/20 border border-[#c8ff00]/40 flex items-center justify-center text-xs font-bold text-[#c8ff00]">Z</div>
          <h2 className="text-xl font-bold">Meet Zuri</h2>
        </div>
        <p className="text-white/30 text-sm">Your intelligence is online. Let's calibrate your system.</p>
      </div>

      {/* Chat */}
      <div className="glass rounded-sm p-5 mb-4 space-y-4 min-h-[280px] max-h-[360px] overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.from === 'zuri' && (
              <div className="w-6 h-6 rounded-full bg-[#c8ff00]/20 flex items-center justify-center text-[10px] font-bold text-[#c8ff00] flex-shrink-0 mt-0.5">Z</div>
            )}
            <div className={`text-sm rounded-sm px-4 py-3 max-w-[85%] ${
              m.from === 'zuri'
                ? 'bg-white/[0.04] text-white/80 border border-white/[0.06]'
                : 'bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20 ml-auto'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#c8ff00]/20 flex items-center justify-center text-[10px] font-bold text-[#c8ff00] flex-shrink-0">Z</div>
            <div className="glass rounded-sm px-4 py-3 text-white/30 text-sm">Thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      {!ready ? (
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Tell Zuri about your business..."
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-5 py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-colors disabled:opacity-40"
          >
            Send
          </button>
        </div>
      ) : (
        <button
          onClick={onNext}
          className="w-full py-3.5 bg-[#c8ff00] text-black font-bold text-sm rounded-sm hover:bg-white transition-colors"
        >
          Continue to Document Upload →
        </button>
      )}
    </div>
  )
}

// ── Upload Step ───────────────────────────────────────────────
function UploadStep({ onNext, userId }: { onNext: () => void; userId: string }) {
  const supabase = createClient()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<string[]>([])

  async function handleUpload() {
    if (files.length === 0) { onNext(); return }
    setUploading(true)

    for (const file of files) {
      const path = `onboarding/${userId}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage
        .from('onboarding')
        .upload(path, file)

      if (!error) {
        setUploaded(u => [...u, file.name])
        // Log to knowledge_base
        const { error: dbErr } = await supabase.from('knowledge_base').insert({
          organization_id: userId,
          title: file.name,
          content: `Onboarding upload: ${file.name}`,
          source_type: 'onboarding_upload',
          metadata: { storage_path: path, upload_type: 'onboarding' },
        } as any)
        if (dbErr) {
          console.warn('knowledge_base insert skipped:', dbErr.message)
        }
      }
    }

    setUploading(false)
    toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`)
    onNext()
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Upload your documents</h2>
        <p className="text-white/40 text-sm">Help Zuri understand your business before the consultation. All files are secure and private.</p>
      </div>

      {/* Upload suggestions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Business Overview', desc: 'Deck, one-pager, or bio' },
          { label: 'Current Workflows', desc: 'SOPs, process docs' },
          { label: 'Team Structure', desc: 'Org chart or roster' },
          { label: 'Pain Points Doc', desc: 'Anything you want fixed' },
        ].map(s => (
          <div key={s.label} className="glass rounded-sm p-4 border border-white/[0.06]">
            <div className="text-xs font-medium text-white/70 mb-1">{s.label}</div>
            <div className="text-xs text-white/30">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <label className="block border-2 border-dashed border-white/10 rounded-sm p-10 text-center cursor-pointer hover:border-[#c8ff00]/30 transition-colors mb-4">
        <div className="text-white/20 text-sm mb-2">
          {files.length > 0
            ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
            : 'Drop files here or click to browse'}
        </div>
        <div className="text-xs text-white/20">PDF, DOCX, XLSX, PNG, JPG — up to 10MB each</div>
        <input
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
          onChange={e => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>

      {files.length > 0 && (
        <div className="space-y-1 mb-4">
          {files.map(f => (
            <div key={f.name} className="flex items-center gap-2 text-xs text-white/40 px-2">
              <span className="text-[#c8ff00]">—</span> {f.name}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onNext}
          className="flex-1 py-3 border border-white/10 text-white/40 text-sm rounded-sm hover:text-white hover:border-white/20 transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex-1 py-3 bg-[#c8ff00] text-black font-bold text-sm rounded-sm hover:bg-white transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : files.length > 0 ? 'Upload & Continue →' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}

// ── Schedule Step ─────────────────────────────────────────────
function ScheduleStep({ onNext, userId, userName }: {
  onNext: () => void
  userId: string
  userName: string
}) {
  const supabase = createClient()
  const days = getNext14Days()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleBook() {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time')
      return
    }
    setSaving(true)

    // Store as a notification log entry (calendar_events doesn't exist)
    const { error } = await supabase.from('notification_logs').insert({
      client_id: userId,
      notification_type: 'consultation',
      channel: 'email',
      recipient: userId,
      subject: `Onboarding Consultation — ${userName}`,
      message: `Scheduled: ${selectedDate} at ${selectedTime}. Type: onboarding_consult`,
      delivery_status: 'scheduled',
      metadata: {
        event_type: 'onboarding_consult',
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
      },
    })

    if (error) {
      console.error(error)
      toast.error('Could not save booking. Please contact us.')
    } else {
      toast.success('Consultation booked!')
      onNext()
    }
    setSaving(false)
  }

  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Schedule your consultation</h2>
        <p className="text-white/40 text-sm">Book your onboarding call. We'll walk through your system setup together.</p>
      </div>

      {/* Date picker */}
      <div className="mb-6">
        <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Select a date</div>
        <div className="grid grid-cols-4 gap-2">
          {days.map(d => (
            <button
              key={d}
              onClick={() => { setSelectedDate(d); setSelectedTime(null) }}
              className={`p-3 rounded-sm border text-xs text-center transition-all ${
                selectedDate === d
                  ? 'border-[#c8ff00] bg-[#c8ff00]/10 text-[#c8ff00]'
                  : 'border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white'
              }`}
            >
              {formatDate(d)}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="mb-8">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Select a time (EST)</div>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`py-2.5 rounded-sm border text-xs transition-all ${
                  selectedTime === t
                    ? 'border-[#c8ff00] bg-[#c8ff00]/10 text-[#c8ff00]'
                    : 'border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation */}
      {selectedDate && selectedTime && (
        <div className="glass rounded-sm p-4 mb-6 border border-[#c8ff00]/20">
          <div className="text-xs text-white/40 mb-1">Your consultation</div>
          <div className="text-sm text-[#c8ff00] font-medium">
            {formatDate(selectedDate)} at {selectedTime} EST
          </div>
          <div className="text-xs text-white/30 mt-1">~60 minutes · Video call link sent to your email</div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onNext}
          className="flex-1 py-3 border border-white/10 text-white/40 text-sm rounded-sm hover:text-white hover:border-white/20 transition-colors"
        >
          Schedule later
        </button>
        <button
          onClick={handleBook}
          disabled={saving || !selectedDate || !selectedTime}
          className="flex-1 py-3 bg-[#c8ff00] text-black font-bold text-sm rounded-sm hover:bg-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Booking...' : 'Confirm Booking →'}
        </button>
      </div>
    </div>
  )
}

// ── Done Step ─────────────────────────────────────────────────
function DoneStep({ userName, router }: { userName: string; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-[#c8ff00]/10 border border-[#c8ff00]/30 flex items-center justify-center mx-auto mb-6">
        <span className="text-[#c8ff00] text-2xl">✓</span>
      </div>
      <h2 className="text-3xl font-bold mb-3">You're in, {userName}.</h2>
      <p className="text-white/40 mb-8">
        Your intelligence is being configured. Zuri will be fully calibrated before your consultation.
      </p>

      <div className="glass rounded-sm p-6 mb-8 text-left space-y-3">
        {[
          'Confirmation email sent',
          'Zuri intelligence provisioned',
          'Consultation booked (check email)',
          'Dashboard access activated',
        ].map(item => (
          <div key={item} className="flex items-center gap-3 text-sm text-white/60">
            <span className="text-[#c8ff00]">✓</span>
            {item}
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push('/intake')}
        className="w-full py-4 bg-[#c8ff00] text-black font-bold rounded-sm hover:bg-white transition-colors"
      >
        Continue Intake →
      </button>
    </div>
  )
}

// ── MAIN ONBOARDING PAGE ──────────────────────────────────────
function OnboardingContent() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()

  const [step, setStep] = useState<Step>('payment')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentLabel, setPaymentLabel] = useState('')
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [tier, setTier] = useState<string>('')
  const [suite, setSuite] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    async function init() {
      setInitializing(true)
      setPaymentError(null)

      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      if (cancelled) return

      // Poll for client record (race condition: onSignup may not have completed)
      let client: { full_name: string | null; plan_tier_key: string | null; metadata?: Record<string, unknown> | null } | null = null
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data } = await supabase
          .from('clients')
          .select('full_name, plan_tier_key, metadata')
          .eq('id', u.id)
          .maybeSingle()
        if (data) {
          client = data as { full_name: string | null; plan_tier_key: string | null; metadata?: Record<string, unknown> | null }
          break
        }
        if (attempt < 4) await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
        if (cancelled) return
      }

      if (cancelled) return

      const requestedPlan = typeof client?.metadata?.requested_plan_tier_key === 'string'
        ? client.metadata.requested_plan_tier_key
        : null
      const t = client?.plan_tier_key ?? requestedPlan ?? params.get('tier') ?? 'client_founder'
      const s = params.get('suite') ?? ''
      setTier(t)
      setSuite(s)
      setUser({ id: u.id, email: u.email!, name: client?.full_name ?? u.email!.split('@')[0] })

      // Create payment intent
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: t, suite: s, email: u.email, name: client?.full_name }),
        })
        if (cancelled) return

        const data = await res.json()
        if (!res.ok) {
          setPaymentError(data.error ?? data.message ?? 'Failed to create payment')
          setInitializing(false)
          return
        }
        setClientSecret(data.clientSecret)
        setPaymentAmount(data.amount)
        setPaymentLabel(data.label)
      } catch (err) {
        if (!cancelled) setPaymentError('Network error creating payment. Check your connection.')
      }
      setInitializing(false)
    }
    init()

    return () => { cancelled = true }
  }, [])

  const STEPS: { id: Step; label: string }[] = [
    { id: 'payment',  label: 'Payment'  },
    { id: 'zuri',     label: 'Meet Zuri' },
    { id: 'upload',   label: 'Upload'   },
    { id: 'schedule', label: 'Schedule' },
    { id: 'done',     label: 'Done'     },
  ]

  const stepIndex = STEPS.findIndex(s => s.id === step)

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between">
        <div className="font-bold text-lg">H<span className="text-[#c8ff00]">.</span></div>
        <div className="text-xs text-white/30 tracking-widest uppercase">Onboarding</div>
      </header>

      {/* Progress */}
      <div className="px-8 py-6 border-b border-white/[0.04]">
        <div className="max-w-xl mx-auto flex items-center gap-0">
          {STEPS.filter(s => s.id !== 'done').map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 text-xs transition-colors ${
                i <= stepIndex ? 'text-[#c8ff00]' : 'text-white/20'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                  i < stepIndex
                    ? 'bg-[#c8ff00] border-[#c8ff00] text-black'
                    : i === stepIndex
                    ? 'border-[#c8ff00] text-[#c8ff00]'
                    : 'border-white/20 text-white/20'
                }`}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 2 && (
                <div className={`flex-1 h-px mx-3 transition-colors ${i < stepIndex ? 'bg-[#c8ff00]/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-12">
        {step === 'payment' && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#c8ff00',
                  colorBackground: '#0d0d1a',
                  colorText: '#ffffff',
                  colorDanger: '#ff6b6b',
                  borderRadius: '2px',
                  fontFamily: 'system-ui, sans-serif',
                },
              },
            }}
          >
            <PaymentStep
              clientSecret={clientSecret}
              amount={paymentAmount}
              label={paymentLabel}
              onSuccess={() => setStep('zuri')}
            />
          </Elements>
        )}

        {step === 'payment' && initializing && !paymentError && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-white/30 text-sm">Preparing your enrollment...</div>
          </div>
        )}

        {step === 'payment' && paymentError && (
          <div className="max-w-md mx-auto text-center">
            <div className="glass rounded-sm p-6 mb-6 border border-red-500/20">
              <div className="text-red-400 text-sm mb-2">Payment setup failed</div>
              <p className="text-white/40 text-xs mb-4">{paymentError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-colors"
              >
                Try Again
              </button>
            </div>
            <p className="text-xs text-white/20">
              If the problem persists, contact support.
            </p>
          </div>
        )}

        {step === 'zuri' && user && (
          <ZuriStep userName={user.name} onNext={() => setStep('upload')} />
        )}

        {step === 'upload' && user && (
          <UploadStep userId={user.id} onNext={() => setStep('schedule')} />
        )}

        {step === 'schedule' && user && (
          <ScheduleStep
            userId={user.id}
            userName={user.name}
            onNext={() => setStep('done')}
          />
        )}

        {step === 'done' && user && (
          <DoneStep userName={user.name} router={router} />
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
