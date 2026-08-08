'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDefaultSpecialties } from '@/lib/specialties'
import Link from 'next/link'

type Step = 'welcome' | 'personal' | 'business' | 'role' | 'results' | 'complete'

type IntakeData = {
  // personal
  firstName: string
  lastName: string
  name: string // kept as computed "first last" for downstream compat
  email: string
  website: string
  businessName: string
  dob: string
  birthTime: string
  birthLocation: string
  birthTimezone: string
  // role
  sellTo: string
  roleType: string
  personalType: string
  offerType: string
  // business step
  businessStage: string
  industries: string[]
  salesStyle: string
  automationLevel: string
  growthSpeed: string
  brandPersonality: string
  brandDescription: string
  audienceCurrentSize: string
  audienceDesiredSize: string
  teamCurrentSize: string
  teamDesiredSize: string
  revenueGoals: string
  vision1Year: string
  vision3Year: string
  vision5Year: string
  vision10Year: string
  vision25Year: string
  techComfort: string
  purpose: string
  mission: string
}

type EEProfile = {
  blueprint: {
    archetype: string
    completeness: number
    foundation: {
      coreArch: string
      naturalGift: string
      growthEdge: string
      energyType: string
      operatingRhythm: string
    }
    scores: {
      visionary: number
      building: number
      connecting: number
      analyzing: number
      leading: number
      creating: number
    }
    summary: string
  }
  essence: {
    mindArchitecture: string
    decisionStyle: string
    communicationStyle: string
    emotionalPattern: string
    creativityStyle: string
    summary: string
  }
  archetype: {
    primary: string
    avatar: string
    description: string
    domains: string[]
  }
  rhythm: {
    energyType: string
    peakTimes: string
    recoveryNeed: string
  }
  timing: {
    personalYear: number
    currentCycle: string
  }
  recommendation: {
    archetype: string
    suggestedPath: string
    reason: string
  }
}

const TIMEZONES = [
  { value: '-05:00', label: 'Eastern (EST)' },
  { value: '-06:00', label: 'Central (CST)' },
  { value: '-07:00', label: 'Mountain (MST)' },
  { value: '-08:00', label: 'Pacific (PST)' },
  { value: '+00:00', label: 'UTC / GMT' },
  { value: '+01:00', label: 'Central Europe (CET)' },
  { value: '+05:30', label: 'India (IST)' },
  { value: '+08:00', label: 'China / Singapore (CST)' },
  { value: '+09:00', label: 'Japan (JST)' },
  { value: '+10:00', label: 'Australia Eastern (AEST)' },
  { value: '+13:00', label: 'New Zealand (NZST)' },
]

export default function IntakePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<EEProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser(u)
        supabase.from('users').select('role').eq('id', u.id).maybeSingle().then(({ data }) => {
          setUserRole((data?.role as string) || 'client')
        })
      }
    })
  }, [])

  const [data, setData] = useState<IntakeData>({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    website: '',
    businessName: '',
    dob: '',
    birthTime: '',
    birthLocation: '',
    birthTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      ? `+00:00` : '-05:00',
    sellTo: '',
    roleType: '',
    personalType: '',
    offerType: '',
    businessStage: '',
    industries: [],
    salesStyle: '',
    automationLevel: '',
    growthSpeed: '',
    brandPersonality: '',
    brandDescription: '',
    audienceCurrentSize: '',
    audienceDesiredSize: '',
    teamCurrentSize: '',
    teamDesiredSize: '',
    revenueGoals: '',
    vision1Year: '',
    vision3Year: '',
    vision5Year: '',
    vision10Year: '',
    vision25Year: '',
    techComfort: '',
    purpose: '',
    mission: '',
  })

  // Derived full name (kept on `data.name` so downstream API calls are untouched)
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim()

  function update(field: keyof IntakeData, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  function toggleIndustry(key: string) {
    setData(prev => ({
      ...prev,
      industries: prev.industries.includes(key)
        ? prev.industries.filter(k => k !== key)
        : [...prev.industries, key],
    }))
  }

  // ── Save intake section to DB (if authenticated) ──
  async function saveSection(section: string, sectionData: Record<string, any>) {
    // Always stash to localStorage as backup
    try {
      const existing = JSON.parse(localStorage.getItem('intake_pending') || '{}')
      existing[section] = { ...sectionData, saved_at: new Date().toISOString() }
      localStorage.setItem('intake_pending', JSON.stringify(existing))
    } catch {}

    if (!user) return

    try {
      const res = await fetch('/api/intake/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data: sectionData }),
      })
      if (!res.ok) console.warn('Intake save failed:', await res.text())
    } catch (e) {
      console.warn('Intake save error:', e)
    }
  }

  // ── Move to business section with save ──
  async function goToBusiness() {
    await saveSection('personal', {
      firstName: data.firstName,
      lastName: data.lastName,
      name: fullName || data.name,
      email: data.email,
      website: data.website,
      businessName: data.businessName,
      dob: data.dob,
      birthTime: data.birthTime,
      birthLocation: data.birthLocation,
      birthTimezone: data.birthTimezone,
    })
    setStep('business')
  }

  // ── Move to role section with save ──
  async function goToRole() {
    await saveSection('business', {
      businessStage: data.businessStage,
      industries: data.industries,
      salesStyle: data.salesStyle,
      automationLevel: data.automationLevel,
      growthSpeed: data.growthSpeed,
      brandPersonality: data.brandPersonality,
      brandDescription: data.brandDescription,
      audienceCurrentSize: data.audienceCurrentSize,
      audienceDesiredSize: data.audienceDesiredSize,
      teamCurrentSize: data.teamCurrentSize,
      teamDesiredSize: data.teamDesiredSize,
      revenueGoals: data.revenueGoals,
      vision1Year: data.vision1Year,
      vision3Year: data.vision3Year,
      vision5Year: data.vision5Year,
      vision10Year: data.vision10Year,
      vision25Year: data.vision25Year,
      techComfort: data.techComfort,
      purpose: data.purpose,
      mission: data.mission,
    })
    setStep('role')
  }

  async function calculateProfile() {
    if (!fullName && !data.name) {
      setError('First and last name are required')
      return
    }
    if (!data.dob) {
      setError('Date of birth is required')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Save role section before calculating
      await saveSection('role', {
        sellTo: data.sellTo,
        roleType: data.roleType,
        personalType: data.personalType,
        offerType: data.offerType,
      })

      const res = await fetch('/api/intake/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          name: fullName || data.name,
        }),
      })
      const result = await res.json()
      if (!res.ok || result.error) {
        setError(result.error || 'Calculation failed')
        setLoading(false)
        return
      }
      setProfile(result)
      setStep('results')

      // Save results section
      saveSection('results', result)
    } catch {
      setError('Failed to calculate your profile. Please try again.')
    }
    setLoading(false)
  }

  async function finishIntake() {
    const profileResult = profile
    if (profileResult) {
      // Save results to DB (already saved by calculate, but ensure it's persisted)
      await saveSection('results', profileResult)
      // Trigger essence generation
      if (user) {
        try {
          await fetch('/api/zuri/essence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, userRole: userRole || 'client' }),
          })
        } catch (e) {
          console.warn('Essence generation trigger failed:', e)
        }
      }
    }
    setStep('complete')
  }

  function determinePath(): { path: string; label: string } {
    if (!profile) return { path: '/demo', label: 'Creator' }
    const path = profile.recommendation?.suggestedPath ?? 'Creator'
    const role = path.toLowerCase()

    if (user) {
      return {
        path: `/dashboard/${role === 'creator' ? 'creator' : role === 'client' ? 'client' : role === 'affiliate' ? 'affiliate' : role === 'collective' ? 'collective' : 'personal'}`,
        label: path,
      }
    }

    const params = new URLSearchParams({ name: fullName || data.name, path, archetype: profile.archetype.primary, energy: profile.rhythm.energyType, mind: profile.essence.mindArchitecture })
    return { path: `/demo?${params.toString()}`, label: path }
  }

  const progress = step === 'welcome' ? 0
    : step === 'personal' ? 20
    : step === 'business' ? 40
    : step === 'role' ? 60
    : step === 'results' ? 80
    : 100

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="font-display text-sm font-semibold tracking-wide">
          EVOLVED <span className="text-[#C6A664]">EDEN</span>
        </Link>
        <span className="text-xs text-white/30">{progress}% complete</span>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.05]">
        <div
          className="h-full bg-[#C6A664] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── WELCOME ── */}
        {step === 'welcome' && (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#C6A664]/10 border border-[#C6A664]/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#C6A664]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-3">
              Welcome to Your <span className="text-[#C6A664]">Intelligence</span> Discovery
            </h1>
            <p className="text-white/40 leading-relaxed mb-8 max-w-md mx-auto">
              Before we begin, let us understand who you are. Share a few details about yourself,
              and we will reveal the intelligence archetype best aligned with your design.
            </p>
            <button
              onClick={() => setStep('personal')}
              className="px-8 py-3.5 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all glow-acid"
            >
              Begin Your Discovery
            </button>
            <div className="mt-4">
              <Link
                href="/demo"
                className="text-xs text-white/20 hover:text-white/50 transition-colors"
              >
                Skip intake — go straight to demo
              </Link>
            </div>
          </div>
        )}

        {/* ── PERSONAL INFO ── */}
        {step === 'personal' && (
          <div className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-1">Tell us about yourself</h2>
            <p className="text-white/40 text-sm mb-8">
              Your birth data helps us map your natural intelligence architecture — revealing your
              natural rhythms, gifts, and growth edges.
            </p>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">First Name</label>
                  <input
                    type="text"
                    value={data.firstName}
                    onChange={e => update('firstName', e.target.value)}
                    placeholder="Jane"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Last Name</label>
                  <input
                    type="text"
                    value={data.lastName}
                    onChange={e => update('lastName', e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Email</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Website</label>
                  <input
                    type="text"
                    value={data.website}
                    onChange={e => update('website', e.target.value)}
                    placeholder="yourwebsite.com"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Business Name</label>
                <input
                  type="text"
                  value={data.businessName}
                  onChange={e => update('businessName', e.target.value)}
                  placeholder="Your business name (optional)"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Date of Birth</label>
                  <input
                    type="date"
                    value={data.dob}
                    onChange={e => update('dob', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Birth Time</label>
                  <input
                    type="time"
                    value={data.birthTime}
                    onChange={e => update('birthTime', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all [color-scheme:dark]"
                  />
                  <p className="text-[10px] text-white/20 mt-1">Approximate is fine</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Birth Location</label>
                  <input
                    type="text"
                    value={data.birthLocation}
                    onChange={e => update('birthLocation', e.target.value)}
                    placeholder="City, State/Country"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Timezone</label>
                  <select
                    value={data.birthTimezone}
                    onChange={e => update('birthTimezone', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value} className="bg-[#1A1A1A]">{tz.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep('welcome')}
                  className="text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={goToBusiness}
                  disabled={!data.firstName || !data.lastName || !data.dob}
                  className="px-6 py-3 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BUSINESS PROFILE ── */}
        {step === 'business' && (
          <div className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-1">Your Business</h2>
            <p className="text-white/40 text-sm mb-8">
              Help us calibrate your ecosystem to your business. All fields are optional —
              skip anything you prefer not to share.
            </p>

            <div className="space-y-8">
              {/* Business stage */}
              <div>
                <label className="block text-sm text-white/70 mb-3">What stage is your business in?</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Idea/Validating', 'Launching', 'Growing', 'Scaling', 'Established', 'Pivoting'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => update('businessStage', opt)}
                      className={`p-4 rounded-sm border text-sm text-left transition-all ${
                        data.businessStage === opt
                          ? 'border-[#C6A664] bg-[#C6A664]/10 text-[#C6A664]'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industries served */}
              <div>
                <label className="block text-sm text-white/70 mb-3">What industries do you serve? (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {getDefaultSpecialties().map(s => (
                    <button
                      key={s.key}
                      onClick={() => toggleIndustry(s.key)}
                      className={`px-4 py-2.5 rounded-sm border text-sm transition-all ${
                        data.industries.includes(s.key)
                          ? 'border-[#C6A664] bg-[#C6A664]/10 text-[#C6A664]'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Sales Style</label>
                  <select
                    value={data.salesStyle}
                    onChange={e => update('salesStyle', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="Relationship/Consultative" className="bg-[#1A1A1A]">Relationship / Consultative</option>
                    <option value="Direct/High-Pressure" className="bg-[#1A1A1A]">Direct / High-Pressure</option>
                    <option value="Content/Marketing-Led" className="bg-[#1A1A1A]">Content / Marketing-Led</option>
                    <option value="Partnership/Referral" className="bg-[#1A1A1A]">Partnership / Referral</option>
                    <option value="Other" className="bg-[#1A1A1A]">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Automation Level Desired</label>
                  <select
                    value={data.automationLevel}
                    onChange={e => update('automationLevel', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="Fully Manual" className="bg-[#1A1A1A]">Fully Manual</option>
                    <option value="Some Tools" className="bg-[#1A1A1A]">Some Tools</option>
                    <option value="Light Automation" className="bg-[#1A1A1A]">Light Automation</option>
                    <option value="Heavy Automation" className="bg-[#1A1A1A]">Heavy Automation</option>
                    <option value="Fully Autonomous" className="bg-[#1A1A1A]">Fully Autonomous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Growth Speed</label>
                  <select
                    value={data.growthSpeed}
                    onChange={e => update('growthSpeed', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="Steady" className="bg-[#1A1A1A]">Steady</option>
                    <option value="Moderate" className="bg-[#1A1A1A]">Moderate</option>
                    <option value="Fast" className="bg-[#1A1A1A]">Fast</option>
                    <option value="Aggressive/Exponential" className="bg-[#1A1A1A]">Aggressive / Exponential</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Brand Personality</label>
                  <select
                    value={data.brandPersonality}
                    onChange={e => update('brandPersonality', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="Luxurious/Premium" className="bg-[#1A1A1A]">Luxurious / Premium</option>
                    <option value="Professional/Trustworthy" className="bg-[#1A1A1A]">Professional / Trustworthy</option>
                    <option value="Playful/Creative" className="bg-[#1A1A1A]">Playful / Creative</option>
                    <option value="Bold/Disruptive" className="bg-[#1A1A1A]">Bold / Disruptive</option>
                    <option value="Calm/Wellness" className="bg-[#1A1A1A]">Calm / Wellness</option>
                    <option value="Innovative/Tech-Forward" className="bg-[#1A1A1A]">Innovative / Tech-Forward</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Describe Your Brand</label>
                <textarea
                  value={data.brandDescription}
                  onChange={e => update('brandDescription', e.target.value)}
                  rows={3}
                  placeholder="A few sentences about what your brand stands for..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Audience — Current Size</label>
                  <select
                    value={data.audienceCurrentSize}
                    onChange={e => update('audienceCurrentSize', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="<100" className="bg-[#1A1A1A]">&lt; 100</option>
                    <option value="100–1K" className="bg-[#1A1A1A]">100 – 1K</option>
                    <option value="1K–10K" className="bg-[#1A1A1A]">1K – 10K</option>
                    <option value="10K–100K" className="bg-[#1A1A1A]">10K – 100K</option>
                    <option value="100K+" className="bg-[#1A1A1A]">100K+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Audience — Desired Size</label>
                  <select
                    value={data.audienceDesiredSize}
                    onChange={e => update('audienceDesiredSize', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="<100" className="bg-[#1A1A1A]">&lt; 100</option>
                    <option value="100–1K" className="bg-[#1A1A1A]">100 – 1K</option>
                    <option value="1K–10K" className="bg-[#1A1A1A]">1K – 10K</option>
                    <option value="10K–100K" className="bg-[#1A1A1A]">10K – 100K</option>
                    <option value="100K+" className="bg-[#1A1A1A]">100K+</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Team — Current Size</label>
                  <select
                    value={data.teamCurrentSize}
                    onChange={e => update('teamCurrentSize', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="Just Me (Solo)" className="bg-[#1A1A1A]">Just Me (Solo)</option>
                    <option value="2–5" className="bg-[#1A1A1A]">2 – 5</option>
                    <option value="6–20" className="bg-[#1A1A1A]">6 – 20</option>
                    <option value="21–50" className="bg-[#1A1A1A]">21 – 50</option>
                    <option value="50+" className="bg-[#1A1A1A]">50+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Team — Desired Size</label>
                  <select
                    value={data.teamDesiredSize}
                    onChange={e => update('teamDesiredSize', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="Just Me (Solo)" className="bg-[#1A1A1A]">Just Me (Solo)</option>
                    <option value="2–5" className="bg-[#1A1A1A]">2 – 5</option>
                    <option value="6–20" className="bg-[#1A1A1A]">6 – 20</option>
                    <option value="21–50" className="bg-[#1A1A1A]">21 – 50</option>
                    <option value="50+" className="bg-[#1A1A1A]">50+</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Revenue Goals</label>
                  <select
                    value={data.revenueGoals}
                    onChange={e => update('revenueGoals', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="Pre-revenue" className="bg-[#1A1A1A]">Pre-revenue</option>
                    <option value="<$10K/mo" className="bg-[#1A1A1A]">&lt; $10K / mo</option>
                    <option value="$10K–$50K/mo" className="bg-[#1A1A1A]">$10K – $50K / mo</option>
                    <option value="$50K–$200K/mo" className="bg-[#1A1A1A]">$50K – $200K / mo</option>
                    <option value="$200K+/mo" className="bg-[#1A1A1A]">$200K+ / mo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Tech Comfort</label>
                  <select
                    value={data.techComfort}
                    onChange={e => update('techComfort', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6A664]/40 transition-all"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select...</option>
                    <option value="Beginner" className="bg-[#1A1A1A]">Beginner</option>
                    <option value="Comfortable" className="bg-[#1A1A1A]">Comfortable</option>
                    <option value="Advanced" className="bg-[#1A1A1A]">Advanced</option>
                    <option value="Expert/Developer" className="bg-[#1A1A1A]">Expert / Developer</option>
                  </select>
                </div>
              </div>

              {/* Long-term vision */}
              <div className="glass rounded-sm p-5 border border-white/[0.06] space-y-4">
                <div className="text-xs text-white/30 tracking-widest uppercase">Long-Term Vision</div>
                {[
                  { key: 'vision1Year', label: '1 Year' },
                  { key: 'vision3Year', label: '3 Years' },
                  { key: 'vision5Year', label: '5 Years' },
                  { key: 'vision10Year', label: '10 Years' },
                  { key: 'vision25Year', label: '25 Years' },
                ].map(v => (
                  <div key={v.key}>
                    <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">{v.label}</label>
                    <textarea
                      value={(data as any)[v.key] as string}
                      onChange={e => update(v.key as keyof IntakeData, e.target.value)}
                      rows={2}
                      placeholder={`Where is your business in ${v.label.toLowerCase()}?`}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all resize-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">What offers do you create?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'services', label: 'Services / Consulting' },
                    { value: 'products', label: 'Digital Products' },
                    { value: 'content', label: 'Content / Media' },
                    { value: 'courses', label: 'Courses / Education' },
                    { value: 'subscriptions', label: 'Subscriptions / Memberships' },
                    { value: 'multiple', label: 'Multiple offers' },
                    { value: 'none', label: 'Nothing yet' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update('offerType', opt.value)}
                      className={`p-4 rounded-sm border text-sm text-left transition-all ${
                        data.offerType === opt.value
                          ? 'border-[#C6A664] bg-[#C6A664]/10 text-[#C6A664]'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Your Purpose</label>
                <textarea
                  value={data.purpose}
                  onChange={e => update('purpose', e.target.value)}
                  rows={2}
                  placeholder="Why does your business exist?"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Your Mission</label>
                <textarea
                  value={data.mission}
                  onChange={e => update('mission', e.target.value)}
                  rows={2}
                  placeholder="What is your mission?"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C6A664]/40 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => setStep('personal')}
                  className="text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={goToRole}
                  className="px-6 py-3 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ROLE QUESTIONS ── */}
        {step === 'role' && (
          <div className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-1">Your Intelligence Path</h2>
            <p className="text-white/40 text-sm mb-8">
              A few questions to determine which path in the Evolved Eden ecosystem fits you best.
            </p>

            <div className="space-y-8">
              {/* Who do you sell to */}
              <div>
                <label className="block text-sm text-white/70 mb-3">Who do you primarily serve or sell to?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'consumers', label: 'Consumers / Individuals' },
                    { value: 'businesses', label: 'Businesses / Organizations' },
                    { value: 'both', label: 'Both' },
                    { value: 'none', label: 'Not selling yet' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update('sellTo', opt.value)}
                      className={`p-4 rounded-sm border text-sm text-left transition-all ${
                        data.sellTo === opt.value
                          ? 'border-[#C6A664] bg-[#C6A664]/10 text-[#C6A664]'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Build vs Buy */}
              <div>
                <label className="block text-sm text-white/70 mb-3">Do you want to build and sell your own AI intelligence products?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'creator', label: 'Yes — I want to create & sell' },
                    { value: 'client', label: 'No — I want to use ready-made solutions' },
                    { value: 'both', label: 'Both — create and consume' },
                    { value: 'unsure', label: 'Not sure yet' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update('roleType', opt.value)}
                      className={`p-4 rounded-sm border text-sm text-left transition-all ${
                        data.roleType === opt.value
                          ? 'border-[#C6A664] bg-[#C6A664]/10 text-[#C6A664]'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Affiliate interest */}
              <div>
                <label className="block text-sm text-white/70 mb-3">Are you interested in earning commissions by referring others to the ecosystem?</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'maybe', label: 'Maybe' },
                    { value: 'no', label: 'No' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update('personalType', opt.value)}
                      className={`p-4 rounded-sm border text-sm text-center transition-all ${
                        data.personalType === opt.value
                          ? 'border-[#C6A664] bg-[#C6A664]/10 text-[#C6A664]'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => setStep('business')}
                  className="text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={calculateProfile}
                  disabled={loading || !data.sellTo || !data.roleType}
                  className="px-6 py-3 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 inline-flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Reading your profile...
                    </>
                  ) : 'Reveal My Profile'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === 'results' && profile && (
          <div className="animate-fade-in">
            {/* Profile Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#C6A664]/10 border-2 border-[#C6A664]/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#C6A664]">
                  {(fullName || data.name).charAt(0).toUpperCase()}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold mb-1">{fullName || data.name}</h1>
              <p className="text-white/40 text-sm">{profile.rhythm.energyType} &bull; {profile.essence.mindArchitecture}</p>
            </div>

            {/* Intelligence Archetype */}
            <div className="glass rounded-sm p-6 mb-6 border border-[#C6A664]/10 text-center">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Your Intelligence Archetype</div>
              <div className="font-display text-3xl font-bold text-[#C6A664] mb-2">
                {profile.archetype.primary}
              </div>
              <p className="text-sm text-white/50">{profile.recommendation.reason}</p>
            </div>

            {/* Essence Scores */}
            <div className="glass rounded-sm p-5 mb-6">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Essence Scores</div>
              <div className="space-y-3">
                {Object.entries(profile.blueprint.scores)
                  .sort(([,a], [,b]) => b - a)
                  .map(([key, val]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-white/60 capitalize">{key}</span>
                        <span className="text-white/40">{val}/100</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#C6A664]" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Foundation & Rhythm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="glass rounded-sm p-5">
                <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Core Architecture</div>
                <div className="text-lg font-semibold text-[#C6A664] mb-1">{profile.blueprint.foundation.coreArch}</div>
                <div className="space-y-1 mt-3 text-sm">
                  <div className="flex justify-between"><span className="text-white/40">Gift</span><span className="text-white/60">{profile.blueprint.foundation.naturalGift}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Growth Edge</span><span className="text-white/60">{profile.blueprint.foundation.growthEdge}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Energy Type</span><span className="text-white/60">{profile.blueprint.foundation.energyType}</span></div>
                </div>
              </div>
              <div className="glass rounded-sm p-5">
                <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Operating Rhythm</div>
                <p className="text-sm text-white/50 mb-3">{profile.blueprint.foundation.operatingRhythm}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-white/40">Peak Times</span><span className="text-white/60">{profile.rhythm.peakTimes}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Recovery</span><span className="text-white/60">{profile.rhythm.recoveryNeed}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Current Cycle</span><span className="text-white/60">{profile.timing.currentCycle}</span></div>
                </div>
              </div>
            </div>

            {/* Decision Style & Communication */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="glass rounded-sm p-5">
                <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Decision Style</div>
                <div className="text-lg font-semibold text-[#5E8B84] mb-2">{profile.essence.decisionStyle}</div>
                <p className="text-sm text-white/50">{profile.essence.summary}</p>
              </div>
              <div className="glass rounded-sm p-5">
                <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Communication</div>
                <div className="text-lg font-semibold text-[#B5764A] mb-2">{profile.essence.communicationStyle}</div>
                <div className="space-y-1 text-sm mt-2">
                  <div className="flex justify-between"><span className="text-white/40">Creative Style</span><span className="text-white/60">{profile.essence.creativityStyle}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Pattern</span><span className="text-white/60">{profile.essence.emotionalPattern}</span></div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="glass rounded-sm p-5 mb-8 border border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Essence Summary</div>
              <p className="text-sm text-white/50 leading-relaxed">{profile.blueprint.summary}</p>
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-sm text-white/40 mb-4">
                Now let Zuri show you what your personalized intelligence system looks like.
              </p>
              <button
                onClick={() => finishIntake()}
                className="inline-block px-8 py-3.5 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all glow-acid"
              >
                Complete & Enter Your Ecosystem →
              </button>
            </div>
          </div>
        )}

        {/* ── COMPLETE ── */}
        {step === 'complete' && (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#C6A664]/10 border-2 border-[#C6A664]/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-[#C6A664]">✓</span>
            </div>
            <h1 className="font-display text-3xl font-bold mb-3">
              Intake <span className="text-[#C6A664]">Complete</span>
            </h1>
            <p className="text-white/40 leading-relaxed mb-8 max-w-md mx-auto">
              Your profile has been saved. Zuri is synthesizing your intelligence profile
              to deliver personalized insights.
            </p>
            <div className="glass rounded-sm p-6 mb-8 text-left max-w-sm mx-auto space-y-3">
              {[
                'Intelligence profile calculated',
                'Essence data saved',
                'Zuri essence being generated',
                'Dashboard access activated',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/60">
                  <span className="text-[#C6A664]">✓</span>
                  {item}
                </div>
              ))}
            </div>
            <a
              href={determinePath().path}
              className="inline-block px-8 py-3.5 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all glow-acid"
            >
              Enter Your {determinePath().label} Ecosystem →
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
