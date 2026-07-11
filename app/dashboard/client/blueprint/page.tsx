'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type IntakeInfo = {
  archetype?: string
  coreArch?: string
  energyType?: string
  naturalGift?: string
  growthEdge?: string
  mindArchitecture?: string
  hasIntake: boolean
}

type BlueprintData = {
  overallScore: number
  archetype: string
  scores: Record<string, number>
  summary: string
  recommended_agents: string[]
  intake_role: string
}

// ── Lens display config ─────────────────────────────

const LENS_DISPLAY: Record<string, { icon: string; label: string; color: string }> = {
  astrology:          { icon: '☉', label: 'Western Astrology', color: '#c8ff00' },
  vedicAstrology:    { icon: '☽', label: 'Vedic Astrology', color: '#a78bfa' },
  numerology:        { icon: '7', label: 'Numerology', color: '#34d399' },
  chineseZodiac:     { icon: '🐉', label: 'Chinese Zodiac', color: '#fb923c' },
  humanDesign:       { icon: '◈', label: 'Human Design', color: '#22d3ee' },
  biorhythms:        { icon: '〰', label: 'Biorhythms', color: '#f472b6' },
  elementalArchetype:{ icon: '🔥', label: 'Elemental Type', color: '#e879f9' },
  lifeTheme:         { icon: '✦', label: 'Life Theme', color: '#00d4ff' },
  soulProfile:       { icon: '∞', label: 'Soul Profile', color: '#ff6b6b' },
}

const EMPTY_LENS = {
  icon: '◇',
  label: 'Pending',
  color: '#ffffff30',
}

// ── Lens Detail Panel Components ─────────────────────

function AstrologyDetail({ data }: { data: any }) {
  if (!data) return null
  const planets = data.planets || {}
  const aspects = data.aspects || []
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'].map(p => {
          const pl = planets[p]
          if (!pl) return null
          return (
            <div key={p} className="flex items-center gap-2 p-2 rounded-sm bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-bold text-white/50 w-14">{p}</span>
              <span className="text-[11px] text-white/80">{pl.sign} {Math.floor(pl.degrees)}°</span>
              <span className="text-[9px] text-white/30">H{pl.house || '?'}</span>
              {pl.isRetrograde && <span className="text-[9px] text-[#fb923c]">R</span>}
            </div>
          )
        })}
      </div>
      {aspects.length > 0 && (
        <div>
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1.5">Aspects</div>
          <div className="flex flex-wrap gap-1.5">
            {aspects.slice(0, 8).map((asp: any, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[9px] text-white/50 border border-white/[0.06]">
                {asp.planet1} {asp.type} {asp.planet2}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-3 text-[10px] text-white/40">
        <span>Elements: {data.elementCounts?.fire || 0}F / {data.elementCounts?.earth || 0}E / {data.elementCounts?.air || 0}A / {data.elementCounts?.water || 0}W</span>
      </div>
    </div>
  )
}

function VedicDetail({ data }: { data: any }) {
  if (!data) return null
  const planets = data.planets || {}
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'].map(p => {
          const pl = planets[p]
          if (!pl) return null
          return (
            <div key={p} className="flex items-center gap-2 p-2 rounded-sm bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-bold text-white/50 w-14">{p}</span>
              <span className="text-[11px] text-white/80">{pl.sign} {Math.floor(pl.degrees)}°</span>
              <span className="text-[9px] text-white-30">H{pl.house || '?'}</span>
            </div>
          )
        })}
      </div>
      {data.moonNakshatra && (
        <div className="p-2 rounded-sm bg-[#a78bfa]/[0.08] border border-[#a78bfa]/[0.12]">
          <span className="text-[10px] text-white/50">Moon Nakshatra: </span>
          <span className="text-[11px] text-[#a78bfa] font-medium">{data.moonNakshatra} (Pada {data.moonPada})</span>
        </div>
      )}
      <div className="flex gap-2 text-[10px] text-white/40">
        <span>Doshas: Vata {data.tattvas?.vata || 0}% / Pitta {data.tattvas?.pitta || 0}% / Kapha {data.tattvas?.kapha || 0}%</span>
      </div>
    </div>
  )
}

function NumerologyDetail({ data }: { data: any }) {
  if (!data) return null
  const items = [
    { label: 'Life Path', value: data.lifePath?.label },
    { label: 'Expression', value: data.expression?.label },
    { label: "Heart's Desire", value: data.heartsDesire?.label },
    { label: 'Personality', value: data.personality?.label },
    { label: 'Maturity', value: data.maturity?.label },
    { label: 'Birthday', value: data.birthday?.label },
    { label: 'Balance', value: data.balance?.label },
    { label: 'Hidden Passion', value: data.hiddenPassion },
    { label: 'Personal Year', value: data.personalYear },
    { label: 'Personal Month', value: data.personalMonth },
    { label: 'Personal Day', value: data.personalDay },
  ]
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.filter(i => i.value != null).map(i => (
          <div key={i.label} className="p-2 rounded-sm bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[9px] text-white/30 uppercase tracking-wider">{i.label}</div>
            <div className="text-sm font-bold text-[#34d399]">{String(i.value)}</div>
          </div>
        ))}
      </div>
      {data.challenges && (
        <div className="flex flex-wrap gap-2 text-[10px] text-white/40">
          <span>Challenges: {data.firstChallenge?.label} · {data.secondChallenge?.label} · {data.thirdChallenge?.label} · {data.fourthChallenge?.label}</span>
        </div>
      )}
      {data.karmicLessons?.length > 0 && (
        <div className="text-[10px] text-white/50">
          Karmic Lessons: {data.karmicLessons.join(', ')}
        </div>
      )}
    </div>
  )
}

function ChineseZodiacDetail({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-sm bg-[#fb923c]/[0.06] border border-[#fb923c]/[0.1]">
        <span className="text-2xl">{data.animal === 'Rat' ? '🐀' : data.animal === 'Ox' ? '🐂' : data.animal === 'Tiger' ? '🐅' : data.animal === 'Rabbit' ? '🐇' : data.animal === 'Dragon' ? '🐉' : data.animal === 'Snake' ? '🐍' : data.animal === 'Horse' ? '🐎' : data.animal === 'Goat' ? '🐐' : data.animal === 'Monkey' ? '🐒' : data.animal === 'Rooster' ? '🐓' : data.animal === 'Dog' ? '🐕' : '🐖'}</span>
        <div>
          <div className="text-sm font-bold text-white">{data.animal}</div>
          <div className="text-[10px] text-white/50">{data.element} {data.yinYang} · Fixed element: {data.fixedElement}</div>
        </div>
      </div>
      {data.personality && <p className="text-xs text-white/60">{data.personality}</p>}
      {data.strengths?.length > 0 && (
        <div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Strengths</div>
          <div className="flex flex-wrap gap-1">
            {data.strengths.map((s: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-[#34d399]/[0.1] text-[9px] text-[#34d399] border border-[#34d399]/[0.2]">{s}</span>
            ))}
          </div>
        </div>
      )}
      {data.compatibility?.length > 0 && (
        <div className="text-[10px] text-white/40">Best matches: {data.compatibility.join(', ')} · Opposing: {data.opposing}</div>
      )}
    </div>
  )
}

function HumanDesignDetail({ data }: { data: any }) {
  if (!data) return null
  const items = [
    { label: 'Archetype', value: data.archetype },
    { label: 'Energy Type', value: data.foundation?.energyType },
    { label: 'Core Architecture', value: data.foundation?.coreArch },
    { label: 'Natural Gift', value: data.foundation?.naturalGift },
    { label: 'Growth Edge', value: data.foundation?.growthEdge },
    { label: 'Operating Rhythm', value: data.foundation?.operatingRhythm },
    { label: 'Lunar Node', value: data.foundation?.lunarNode },
    { label: 'Sun Gate', value: data.gates?.sun?.keyword },
    { label: 'Design Gate', value: data.gates?.design?.keyword },
  ]
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {items.filter(i => i.value).map(i => (
          <div key={i.label} className="p-2 rounded-sm bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[9px] text-white/30 uppercase tracking-wider">{i.label}</div>
            <div className="text-[11px] text-white/70">{i.value}</div>
          </div>
        ))}
      </div>
      {data.scores && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">Scores</div>
          {Object.entries(data.scores).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-20 capitalize">{k.replace(/_/g, ' ')}</span>
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-[#22d3ee] rounded-full" style={{ width: `${v}%` }} />
              </div>
              <span className="text-[9px] text-white/30">{v as number}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BiorhythmDetail({ data }: { data: any }) {
  if (!data) return null
  const cycles = [
    { name: 'Physical', score: data.today?.physicalScore, period: '23d', color: '#f472b6' },
    { name: 'Emotional', score: data.today?.emotionalScore, period: '28d', color: '#a78bfa' },
    { name: 'Intellectual', score: data.today?.intellectualScore, period: '33d', color: '#22d3ee' },
    { name: 'Spiritual', score: data.today?.spiritualScore, period: '53d', color: '#c8ff00' },
  ]
  return (
    <div className="space-y-3">
      {cycles.map(c => {
        const barWidth = Math.abs(c.score || 0)
        const isPositive = (c.score || 0) >= 0
        return (
          <div key={c.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/50">{c.name} ({c.period})</span>
              <span className="text-[10px]" style={{ color: c.color }}>{c.score > 0 ? '+' : ''}{c.score}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden relative">
              <div className="h-full rounded-full transition-all" style={{
                width: `${barWidth}%`,
                background: isPositive ? c.color : '#ff6b6b',
                marginLeft: isPositive ? '50%' : `${50 - barWidth}%`,
              }} />
            </div>
          </div>
        )
      })}
      {data.overall?.interpretation && (
        <p className="text-[10px] text-white/40 italic">{data.overall.interpretation}</p>
      )}
    </div>
  )
}

function ElementalDetail({ data }: { data: any }) {
  if (!data) return null
  const elements = [
    { name: 'Fire', pct: data.elementBalance?.fire || 0, color: '#fb923c' },
    { name: 'Earth', pct: data.elementBalance?.earth || 0, color: '#34d399' },
    { name: 'Air', pct: data.elementBalance?.air || 0, color: '#22d3ee' },
    { name: 'Water', pct: data.elementBalance?.water || 0, color: '#a78bfa' },
  ]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {elements.map(e => (
          <div key={e.name} className="text-center p-2 rounded-sm bg-white/[0.03] border border-white/[0.06]">
            <div className="text-lg font-bold" style={{ color: e.color }}>{e.pct}%</div>
            <div className="text-[9px] text-white/40 uppercase">{e.name}</div>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-sm bg-white/[0.03] border border-white/[0.06]">
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Temperament</div>
        <div className="text-sm text-white/70 font-medium">{data.temperament}</div>
        <p className="text-[10px] text-white/50 mt-1">{data.expressionStyle}</p>
      </div>
      {data.learningStyle && (
        <div className="text-[10px] text-white/40">
          <span className="text-white/50">Learning: </span>{data.learningStyle}
        </div>
      )}
      {data.stressPattern && (
        <div className="text-[10px] text-white/40">
          <span className="text-white/50">Stress: </span>{data.stressPattern}
        </div>
      )}
    </div>
  )
}

function LifeThemeDetail({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-sm bg-[#00d4ff]/[0.06] border border-[#00d4ff]/[0.1]">
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Soul Purpose</div>
        <p className="text-sm text-white/80 font-medium">{data.soulPurpose || 'Discovering...'}</p>
      </div>
      {data.lifeStage && (
        <div className="flex items-center justify-between p-2 rounded-sm bg-white/[0.03] border border-white/[0.06]">
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Life Stage</div>
            <div className="text-[11px] text-white/70">{data.lifeStage.current}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Age</div>
            <div className="text-[11px] text-white/70">{data.lifeStage.age || '?'}</div>
          </div>
          <div className="text-right max-w-[200px]">
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Description</div>
            <div className="text-[10px] text-white/50">{data.lifeStage.description}</div>
          </div>
        </div>
      )}
      {data.coreLesson && (
        <div className="p-2 rounded-sm bg-white/[0.03] border border-white/[0.06]">
          <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Core Lesson</div>
          <p className="text-[11px] text-white/60">{data.coreLesson}</p>
        </div>
      )}
      {data.growthPath?.length > 0 && (
        <div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Growth Path</div>
          <div className="space-y-1">
            {data.growthPath.slice(0, 4).map((g: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[10px] text-white/50">
                <span className="text-[#00d4ff] mt-0.5">→</span>
                <span>{g}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.missionStatement && (
        <p className="text-[10px] text-white/30 italic border-t border-white/[0.06] pt-2">{data.missionStatement}</p>
      )}
    </div>
  )
}

function SoulProfileDetail({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="space-y-3">
      <div className="flex gap-3 p-3 rounded-sm bg-[#ff6b6b]/[0.06] border border-[#ff6b6b]/[0.1]">
        <div>
          <div className="text-[9px] text-white/30 uppercase tracking-wider">Soul Age</div>
          <div className="text-sm font-bold text-white">{data.soulAge || '?'}</div>
        </div>
        <div className="flex-1">
          <div className="text-[9px] text-white/30 uppercase tracking-wider">Dharma</div>
          <div className="text-[11px] text-white/60">{data.dharma || data.soulPurpose || '?'}</div>
        </div>
      </div>
      {data.karmicPatterns?.length > 0 && (
        <div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Karmic Patterns</div>
          {data.karmicPatterns.map((p: string, i: number) => (
            <div key={i} className="text-[10px] text-white/50 flex items-start gap-1.5 mb-0.5">
              <span className="text-[#ff6b6b]">•</span> {p}
            </div>
          ))}
        </div>
      )}
      {data.soulContracts?.length > 0 && (
        <div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Soul Contracts</div>
          {data.soulContracts.map((c: string, i: number) => (
            <div key={i} className="text-[10px] text-white/50 flex items-start gap-1.5 mb-0.5">
              <span className="text-[#c8ff00]">◇</span> {c}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const EXPANDED_PRICE = 150
const DOMAIN_PRICE = 50

const DOMAIN_MODULES = [
  { id: 'domain_relationship', name: 'Relationship', desc: 'Deep relationship intelligence — partnership, family, social dynamics', icon: '❤' },
  { id: 'domain_personal', name: 'Personal', desc: 'Personal development intelligence — growth, habits, self-mastery', icon: '✦' },
  { id: 'domain_spiritual', name: 'Spiritual', desc: 'Spiritual intelligence — purpose, alignment, inner wisdom', icon: '◈' },
  { id: 'domain_lifestyle', name: 'Lifestyle', desc: 'Lifestyle intelligence — environment, routines, wellness', icon: '◆' },
  { id: 'domain_creativity', name: 'Creativity', desc: 'Creative intelligence — expression, innovation, flow', icon: '◇' },
  { id: 'domain_legacy', name: 'Legacy', desc: 'Legacy intelligence — impact, contribution, long-term vision', icon: '⊙' },
]

export default function ClientBlueprintPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null)
  const [twinExists, setTwinExists] = useState(false)
  const [intake, setIntake] = useState<IntakeInfo>({ hasIntake: false })
  const [lenses, setLenses] = useState<Record<string, any> | null>(null)
  const [expandedLens, setExpandedLens] = useState<string | null>(null)

  // Upgrade state
  const [purchasedExpanded, setPurchasedExpanded] = useState(false)
  const [purchasedEnhanced, setPurchasedEnhanced] = useState(false)
  const [purchasedDomains, setPurchasedDomains] = useState<Set<string>>(new Set())
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  // ── Lens detail panel helpers ───────────────────

  function renderLensDetail(key: string, data: any): React.ReactNode {
    switch (key) {
      case 'astrology':
        return <AstrologyDetail data={data} />
      case 'vedicAstrology':
        return <VedicDetail data={data} />
      case 'numerology':
        return <NumerologyDetail data={data} />
      case 'chineseZodiac':
        return <ChineseZodiacDetail data={data} />
      case 'humanDesign':
        return <HumanDesignDetail data={data} />
      case 'biorhythms':
        return <BiorhythmDetail data={data} />
      case 'elementalArchetype':
        return <ElementalDetail data={data} />
      case 'lifeTheme':
        return <LifeThemeDetail data={data} />
      case 'soulProfile':
        return <SoulProfileDetail data={data} />
      default:
        return <pre className="text-xs text-white/50">{JSON.stringify(data, null, 2)}</pre>
    }
  }

  // ── Blueprint Download ─────────────────────────

  function downloadBlueprint() {
    if (!blueprint && !lenses) return
    const lines: string[] = []
    lines.push('========================================')
    lines.push('  EVOLVED EDEN — BLUEPRINT REPORT')
    lines.push(`  Generated: ${new Date().toLocaleDateString()}`)
    lines.push('========================================')
    lines.push('')

    if (blueprint) {
      lines.push(`SCORE: ${blueprint.overallScore}`)
      lines.push(`ARCHETYPE: ${blueprint.archetype}`)
      lines.push('')
      lines.push('DIMENSION SCORES:')
      for (const [k, v] of Object.entries(blueprint.scores)) {
        lines.push(`  ${k.replace(/_/g, ' ')}: ${v}/100`)
      }
      if (blueprint.summary) {
        lines.push('')
        lines.push(`SUMMARY: ${blueprint.summary}`)
      }
      lines.push('')
    }

    if (lenses) {
      lines.push('--- MULTI-LENS PROFILE ---')
      lines.push('')

      const a = lenses.astrology?.data
      if (a) {
        lines.push('[Western Astrology]')
        lines.push(`  Sun: ${a.sunSign} | Moon: ${a.moonSign} | Rising: ${a.risingSign}`)
        lines.push(`  Elements: ${a.elementCounts?.fire || 0}F / ${a.elementCounts?.earth || 0}E / ${a.elementCounts?.air || 0}A / ${a.elementCounts?.water || 0}W`)
        lines.push('')
      }

      const v = lenses.vedicAstrology?.data
      if (v) {
        lines.push('[Vedic Astrology]')
        lines.push(`  Sun: ${v.sunSign} | Moon: ${v.moonSign} (${v.moonNakshatra || ''}) | Rising: ${v.risingSign}`)
        lines.push(`  Doshas: Vata ${v.tattvas?.vata || 0}% / Pitta ${v.tattvas?.pitta || 0}% / Kapha ${v.tattvas?.kapha || 0}%`)
        lines.push('')
      }

      const n = lenses.numerology?.data
      if (n) {
        lines.push('[Numerology]')
        lines.push(`  Life Path: ${n.lifePath?.label || '?'}`)
        lines.push(`  Expression: ${n.expression?.label || '?'}`)
        lines.push(`  Heart's Desire: ${n.heartsDesire?.label || '?'}`)
        lines.push(`  Personal Year/Month/Day: ${n.personalYear}/${n.personalMonth}/${n.personalDay}`)
        if (n.karmicLessons?.length) lines.push(`  Karmic Lessons: ${n.karmicLessons.join(', ')}`)
        lines.push('')
      }

      const cz = lenses.chineseZodiac?.data
      if (cz) {
        lines.push('[Chinese Zodiac]')
        lines.push(`  ${cz.animal} — ${cz.element} ${cz.yinYang}`)
        lines.push(`  Personality: ${cz.personality || ''}`)
        lines.push('')
      }

      const lt = lenses.lifeTheme?.data
      if (lt) {
        lines.push('[Life Theme]')
        lines.push(`  Purpose: ${lt.soulPurpose || ''}`)
        lines.push(`  Stage: ${lt.lifeStage?.current || ''}`)
        if (lt.missionStatement) lines.push(`  Mission: ${lt.missionStatement}`)
        lines.push('')
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blueprint-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: _u } } = await supabase.auth.getUser()
      // Guaranteed non-null by root middleware
      const u = _u!
      setUser(u)

      // Flush pending intake from localStorage (filled before auth)
      try {
        const pending = localStorage.getItem('intake_pending')
        if (pending) {
          const parsed = JSON.parse(pending)
          localStorage.removeItem('intake_pending')
          // Save to server in background
          for (const [section, sectionData] of Object.entries(parsed)) {
            fetch('/api/intake/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ section, data: sectionData }),
            }).catch(() => {}) // silent
          }
        }
      } catch {}

      // Check intake data
      const { data: clientRec } = await supabase
        .from('clients')
        .select('metadata')
        .eq('id', u.id)
        .maybeSingle()
      let intakeSections: any = null
      if (clientRec) {
        const meta = (clientRec.metadata as Record<string, any>) ?? {}
        intakeSections = meta.intake?.sections
        if (intakeSections?.results?.blueprint) {
          const bp = intakeSections.results.blueprint
          const es = intakeSections.results.essence
          setIntake({
            hasIntake: true,
            archetype: bp.archetype,
            coreArch: bp.foundation?.coreArch,
            energyType: bp.foundation?.energyType,
            naturalGift: bp.foundation?.naturalGift,
            growthEdge: bp.foundation?.growthEdge,
            mindArchitecture: es?.mindArchitecture,
          })
        }
      }

      // Check if twin exists and read blueprint from DB
      let foundBlueprint: BlueprintData | null = null
      const { data: twin } = await supabase
        .from('client_twins')
        .select('id, metadata')
        .eq('client_id', u.id)
        .maybeSingle()
      
      if (twin) {
        setTwinExists(true)
        const meta = (twin as any).metadata || {}

        // Read blueprint from DB (saved by /api/blueprint/save)
        const bp = meta.blueprint
        if (bp?.core) {
          foundBlueprint = {
            overallScore: bp.core.overallScore ?? 0,
            archetype: bp.core.archetype ?? 'Custom',
            scores: bp.core.scores ?? {},
            summary: bp.core.summary ?? '',
            recommended_agents: bp.core.recommended_agents ?? [],
            intake_role: bp.intake?.role ?? 'client',
          }
        } else {
          // Fallback: try sessionStorage (legacy)
          const stored = sessionStorage.getItem('blueprintResult')
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              foundBlueprint = {
                overallScore: parsed.scores ? Math.round(Object.values(parsed.scores).reduce((a: number, b: any) => a + b, 0) / Object.keys(parsed.scores).length) : 0,
                archetype: parsed.template_name || 'Custom',
                scores: parsed.scores || {},
                summary: parsed.summary || '',
                recommended_agents: parsed.recommended_agents || [],
                intake_role: parsed.vertical_key || 'client',
              }
            } catch {}
          }
        }

        // Extract lens data
        if (meta.lenses) {
          setLenses(meta.lenses)
        }

        // Check purchases in metadata
        if (meta.blueprint_expanded) setPurchasedExpanded(true)
        if (meta.blueprint_enhanced) setPurchasedEnhanced(true)
        if (meta.purchased_domains) setPurchasedDomains(new Set(meta.purchased_domains))
      }

      // Fallback: use intake results as blueprint data if no twin blueprint exists
      if (!foundBlueprint && intakeSections?.results?.blueprint) {
        const bp = intakeSections.results.blueprint
        const scores = bp.scores || {}
        const overallScore = Object.values(scores).length > 0
          ? Math.round(Object.values(scores).reduce((a: number, b: any) => a + b, 0) / Object.keys(scores).length)
          : 0
        foundBlueprint = {
          overallScore,
          archetype: bp.archetype || 'Custom',
          scores,
          summary: bp.summary || '',
          recommended_agents: [],
          intake_role: intakeSections.results?.essence?.mindArchitecture || 'client',
        }
      }

      if (foundBlueprint) {
        setBlueprint(foundBlueprint)
      }

      setLoading(false)
    }
    load()
  }, [router])

  async function handlePurchase(productId: string) {
    setCheckoutLoading(productId)
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [productId],
          email: user?.email,
          name: user?.user_metadata?.full_name,
        }),
      })
      const d = await res.json()
      if (d.url) window.location.href = d.url
    } catch {
      alert('Purchase failed. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function purchaseAllDomains() {
    const allIds = DOMAIN_MODULES.map(m => m.id)
    setCheckoutLoading('all_domains')
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: allIds,
          email: user?.email,
          name: user?.user_metadata?.full_name,
        }),
      })
      const d = await res.json()
      if (d.url) window.location.href = d.url
    } catch {
      alert('Purchase failed. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
            My <span className="text-[#c8ff00]">Blueprint</span>
          </h1>
          <p className="text-white/30 text-sm">Your complete intelligence assessment and expansion modules</p>
        </div>
        {(blueprint || lenses) && (
          <button
            onClick={downloadBlueprint}
            className="shrink-0 flex items-center gap-2 px-4 py-2 border border-white/10 text-white/50 text-[11px] font-bold rounded-sm hover:bg-white/[0.04] hover:text-white/70 transition-all"
          >
            <span>⬇</span>
            <span>Download Report</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main — Blueprint Results */}
        <div className="lg:col-span-2 space-y-6">
          {!blueprint ? (
            /* No blueprint yet */
            <div className="glass rounded-sm p-8 text-center">
              <div className="text-4xl mb-4">◈</div>
              <h2 className="text-xl font-semibold mb-2">No Blueprint Yet</h2>
              <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
                Your blueprint is the foundation of your intelligence system. Take the assessment to map your identity, vision, and capabilities.
              </p>

              {/* Intake-derived profile preview */}
              {intake.hasIntake && (
                <div className="mb-6 p-4 rounded-sm bg-white/[0.03] border border-white/[0.06] text-left max-w-sm mx-auto space-y-1.5">
                  <div className="text-[10px] text-white/30 tracking-widest uppercase mb-2">From Your Intake</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Archetype</span>
                    <span className="text-[#c8ff00] font-medium">{intake.archetype}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Core Architecture</span>
                    <span className="text-white font-medium">{intake.coreArch}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Energy Type</span>
                    <span className="text-[#a78bfa] font-medium">{intake.energyType}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Natural Gift</span>
                    <span className="text-white/80">{intake.naturalGift}</span>
                  </div>
                  {intake.growthEdge && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Growth Edge</span>
                      <span className="text-[#00d4ff] font-medium">{intake.growthEdge}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Omnigrid — lens preview (no blueprint but lenses exist) */}
              {lenses && (
                <div className="mb-6 text-left">
                  <div className="text-[10px] text-white/30 tracking-widest uppercase mb-3">Multi-Lens Profile</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(LENS_DISPLAY).map(([key, cfg]) => {
                      const entry = (lenses as any)?.[key]
                      const isReady = entry?.status === 'calculated' && entry?.data
                      return (
                        <div key={key} className={`p-2 rounded-sm border ${isReady ? 'border-white/[0.08] bg-white/[0.02]' : 'border-white/[0.04] opacity-40'}`}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs" style={{ color: cfg.color }}>{cfg.icon}</span>
                            <span className="text-[9px] text-white/40 font-bold uppercase">{cfg.label}</span>
                          </div>
                          <p className="text-[9px] text-white/30">{isReady ? 'Active' : 'Pending'}</p>
                        </div>
                      )
                    })}
                  </div>
                  <button
                    onClick={async () => {
                      await fetch('/api/profile/calculate', { method: 'POST' })
                      window.location.reload()
                    }}
                    className="mt-3 text-[10px] font-bold px-3 py-1.5 rounded-sm border border-[#c8ff00]/40 text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-all"
                  >
                    Calculate All Lenses
                  </button>
                </div>
              )}

              <Link
                href="/dashboard/client/blueprint/assess"
                className="inline-block px-6 py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-all"
              >
                {intake.hasIntake ? 'Complete Full Blueprint Assessment →' : 'Start Blueprint Assessment →'}
              </Link>
            </div>
          ) : (
            <>
              {/* Score Overview */}
              <div className="glass rounded-sm p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-xs text-white/30 tracking-widest uppercase">Blueprint Score</div>
                    <div className="text-4xl font-bold text-[#c8ff00] mt-1">{blueprint.overallScore}</div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <div className="text-xs text-white/30 tracking-widest uppercase">Archetype</div>
                      <div className="text-sm text-white/70 mt-1">{blueprint.archetype}</div>
                    </div>
                    <Link
                      href="/dashboard/client/blueprint/assess"
                      className="text-[10px] font-bold px-3 py-1.5 rounded-sm border border-[#c8ff00]/40 text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-all"
                    >
                      Edit Blueprint →
                    </Link>
                  </div>
                </div>

                {/* Section scores */}
                {Object.keys(blueprint.scores).length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Dimension Scores</div>
                    {Object.entries(blueprint.scores).map(([key, score]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/60 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-white/40">{score}/100</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-[#c8ff00] rounded-full" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {blueprint.summary && (
                  <p className="text-sm text-white/50 mt-6 pt-4 border-t border-white/[0.06] leading-relaxed">
                    {blueprint.summary}
                  </p>
                )}
              </div>

              {/* ══════ Omnigrid — Multi-Lens Intelligence ══════ */}
              <div className="glass rounded-sm p-6 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Omnigrid</h3>
                    <p className="text-xs text-white/40">Multi-lens intelligence profile synthesized from your birth data</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await fetch('/api/profile/calculate', { method: 'POST' })
                        window.location.reload()
                      } catch {}
                    }}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-sm border border-[#c8ff00]/40 text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-all"
                  >
                    Recalculate All Lenses
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(LENS_DISPLAY).map(([key, cfg]) => {
                    const lensEntry = (lenses as any)?.[key]
                    const data = lensEntry?.data
                    const status = lensEntry?.status || 'pending'
                    const isReady = status === 'calculated' && data

                    let summary = 'Not available'
                    if (key === 'astrology' && data) {
                      summary = `${data.sunSign || '?'} ☉ · ${data.moonSign || '?'} ☽ · ${data.risingSign || '?'} ↑`
                    } else if (key === 'vedicAstrology' && data) {
                      summary = `${data.sunSign} ☉ · ${data.moonSign} ☽ · ${data.moonNakshatra || ''}`
                    } else if (key === 'numerology' && data) {
                      summary = `LP ${data.lifePath?.label || '?'} · EX ${data.expression?.label || '?'} · HD ${data.heartsDesire?.label || '?'}`
                    } else if (key === 'chineseZodiac' && data) {
                      summary = `${data.animal} · ${data.element} ${data.yinYang}`
                    } else if (key === 'humanDesign' && data) {
                      summary = `${data.archetype || data.foundation?.energyType || '?'} · ${data.foundation?.coreArch || ''}`
                    } else if (key === 'biorhythms' && data) {
                      const t = data.today || {}
                      summary = `P:${t.physicalScore > 0 ? '+' : ''}${t.physicalScore || 0}% E:${t.emotionalScore > 0 ? '+' : ''}${t.emotionalScore || 0}%`
                    } else if (key === 'elementalArchetype' && data) {
                      summary = `${data.primaryElement} · ${data.temperament}`
                    } else if (key === 'lifeTheme' && data) {
                      summary = `${data.lifeStage?.current || '?'} · ${(data.soulPurpose || '').slice(0, 50)}...`
                    } else if (key === 'soulProfile' && data) {
                      summary = `${data.soulAge || '?'} · ${(data.soulPurpose || '').slice(0, 40)}...`
                    }

                    const cfg2 = cfg as { icon: string; label: string; color: string }
                    return (
                      <button
                        key={key}
                        onClick={() => isReady && setExpandedLens(expandedLens === key ? null : key)}
                        className={`rounded-sm border p-3 transition-all text-left w-full ${
                          isReady
                            ? 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] cursor-pointer'
                            : 'border-white/[0.04] bg-white/[0.01] opacity-50 cursor-default'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm" style={{ color: cfg2.color }}>{cfg2.icon}</span>
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{cfg2.label}</span>
                          {isReady && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg2.color }} />}
                        </div>
                        {isReady ? (
                          <>
                            <p className="text-[11px] text-white/60 leading-snug">{summary}</p>
                            {expandedLens === key && (
                              <div className="mt-2 pt-2 border-t border-white/[0.06]" onClick={e => e.stopPropagation()}>
                                {renderLensDetail(key, data)}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-[10px] text-white/20 italic">Run calculation to populate</p>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Status bar */}
                {lenses && (
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-white/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00]" />
                    {Object.keys(LENS_DISPLAY).filter(k => (lenses as any)?.[k]?.status === 'calculated').length} / {Object.keys(LENS_DISPLAY).length} lenses active
                    <span className="ml-auto">
                      {lenses.astrology?.calculatedAt
                        ? `Last calculated: ${new Date(lenses.astrology.calculatedAt).toLocaleDateString()}`
                        : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Recommended Agents */}
              {blueprint.recommended_agents.length > 0 && (
                <div className="glass rounded-sm p-6">
                  <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Recommended Agents</div>
                  <div className="flex flex-wrap gap-2">
                    {blueprint.recommended_agents.map((a: string) => (
                      <span key={a} className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/60 capitalize">
                        {a.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Twin Status */}
              <div className={`glass rounded-sm p-5 border ${twinExists ? 'border-[#c8ff00]/20' : 'border-white/[0.06]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${twinExists ? 'bg-[#c8ff00] animate-pulse-slow' : 'bg-white/20'}`} />
                  <div>
                    <p className="text-sm text-white/70">
                      {twinExists ? 'Your AI Twin is active and linked to this blueprint.' : 'No AI Twin deployed yet.'}
                    </p>
                    {!twinExists && (
                      <Link href="/dashboard/client/twin" className="text-xs text-[#c8ff00] hover:underline mt-1 inline-block">
                        Configure Twin from Blueprint →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Expanded Blueprint Upgrade ── */}
          <div className={`glass rounded-sm p-6 border ${purchasedExpanded ? 'border-[#c8ff00]/30' : 'border-white/[0.06] hover:border-white/15'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">Expanded Blueprint</h3>
                  {purchasedExpanded && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c8ff00]/20 text-[#c8ff00] uppercase tracking-wider">Purchased</span>
                  )}
                </div>
                <p className="text-sm text-white/50 mb-3">
                  Unlock the complete whole-life intelligence scan — 35 additional questions across 7 life domains.
                  Includes full essence board integration and premium AI-powered suggestions for your first year.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Essence Board Links</span>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Premium Suggestions</span>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Life Intelligence Profile</span>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">23-Domain Resonance Map</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-[#c8ff00]">${EXPANDED_PRICE}</div>
                <div className="text-[10px] text-white/30">one-time</div>
              </div>
            </div>
            {!purchasedExpanded && (
              <button
                onClick={() => handlePurchase('expanded_blueprint')}
                disabled={checkoutLoading === 'expanded_blueprint'}
                className="w-full mt-4 px-5 py-2.5 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'expanded_blueprint' ? 'Processing...' : 'Purchase Expanded Blueprint'}
              </button>
            )}
          </div>

          {/* ── Enhanced Blueprint $35 ── */}
          <div className={`glass rounded-sm p-6 border ${purchasedEnhanced ? 'border-[#00d4ff]/30' : 'border-white/[0.06] hover:border-white/15'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">Enhanced Blueprint</h3>
                  {purchasedEnhanced && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] uppercase tracking-wider">Purchased</span>
                  )}
                </div>
                <p className="text-sm text-white/50 mb-3">
                  Upgrade your intelligence foundation with deeper analysis across all dimensions.
                  Get priority essence board insights, cross-domain pattern recognition, and expanded AI twin intelligence.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Deeper Analysis</span>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Essence Board Priority</span>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Pattern Recognition</span>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">Expanded Twin Intelligence</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-[#00d4ff]">$35</div>
                <div className="text-[10px] text-white/30">one-time</div>
              </div>
            </div>
            {!purchasedEnhanced && (
              <button
                onClick={() => handlePurchase('enhanced_blueprint')}
                disabled={checkoutLoading === 'enhanced_blueprint'}
                className="w-full mt-4 px-5 py-2.5 bg-[#00d4ff] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'enhanced_blueprint' ? 'Processing...' : 'Purchase Enhanced Blueprint — $35'}
              </button>
            )}
            {purchasedEnhanced && !purchasedExpanded && (
              <p className="mt-3 text-xs text-[#00d4ff]/60 text-center">
                Add the Expanded Blueprint for full whole-life intelligence scan → <Link href="/dashboard/client/blueprint/assess" className="underline hover:text-[#00d4ff]">Go to Assessment</Link>
              </p>
            )}
          </div>

          {/* ── Domain Modules ── */}
          <div className="glass rounded-sm p-6 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Domain Intelligence Modules</h3>
                <p className="text-sm text-white/50">Add specific life-domain intelligence assessments to your blueprint. Each module unlocks 5 questions in that domain.</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[#c8ff00]">${DOMAIN_PRICE}</div>
                <div className="text-[10px] text-white/30">each</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOMAIN_MODULES.map((mod) => {
                const owned = purchasedDomains.has(mod.id)
                return (
                  <div key={mod.id} className={`rounded-sm border p-4 transition-all ${owned ? 'border-[#c8ff00]/30 bg-[#c8ff00]/05' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mod.icon}</span>
                          <h4 className="text-sm font-medium text-white/80">{mod.name}</h4>
                          {owned && <span className="text-[9px] text-[#c8ff00] font-bold">✓</span>}
                        </div>
                        <p className="text-xs text-white/40 mt-1">{mod.desc}</p>
                      </div>
                      <div className="shrink-0">
                        {!owned && (
                          <button
                            onClick={() => handlePurchase(mod.id)}
                            disabled={checkoutLoading === mod.id}
                            className="px-3 py-1.5 text-[10px] font-bold rounded-sm border border-[#c8ff00]/40 text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {checkoutLoading === mod.id ? '...' : `$${DOMAIN_PRICE}`}
                          </button>
                        )}
                        {owned && (
                          <span className="text-[10px] text-white/30 italic">Owned</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Purchase all domains */}
            {purchasedDomains.size < DOMAIN_MODULES.length && (
              <button
                onClick={purchaseAllDomains}
                disabled={checkoutLoading === 'all_domains'}
                className="w-full mt-4 px-5 py-2.5 border border-white/10 text-white/50 text-xs font-bold rounded-sm hover:bg-white/[0.04] hover:text-white/70 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'all_domains' ? 'Processing...' : `Purchase All ${DOMAIN_MODULES.length} Modules — $${DOMAIN_PRICE * DOMAIN_MODULES.length}`}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Info */}
          <div className="glass rounded-sm p-5 border border-white/[0.06]">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Blueprint Summary</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Score</span>
                <span className="text-white/80 font-medium">{blueprint?.overallScore ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Archetype</span>
                <span className="text-white/80">{blueprint?.archetype ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Domains</span>
                <span className="text-white/80">{Object.keys(blueprint?.scores ?? {}).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Expanded</span>
                <span className={purchasedExpanded ? 'text-[#c8ff00]' : 'text-white/40'}>{purchasedExpanded ? 'Active' : 'Locked'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Modules</span>
                <span className="text-white/80">{purchasedDomains.size} / {DOMAIN_MODULES.length}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="glass rounded-sm p-5 border border-white/[0.06] space-y-3">
            <Link href="/dashboard/client/twin" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              → View AI Twin
            </Link>
            <Link href="/dashboard/client/zuri" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              → Ask Zuri
            </Link>
            <Link href="/dashboard/client/blueprint/assess" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              → Edit / Re-take Assessment
            </Link>
            <Link href="/intake" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              → Intake & Profile
            </Link>
            <Link href="/pricing" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              → Upgrade Plan
            </Link>
          </div>

          {/* Essence Teaser */}
          <div className="glass rounded-sm p-5 border border-white/[0.06]">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Essence Board</div>
            <p className="text-sm text-white/50 leading-relaxed">
              {purchasedExpanded
                ? 'Your expanded blueprint powers premium essence board suggestions — daily intelligence briefs tailored to your full life profile.'
                : 'Purchase the Expanded Blueprint to unlock essence board integration and premium daily suggestions.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
