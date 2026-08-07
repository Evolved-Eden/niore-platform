import { requireClientView } from '@/lib/client-dashboard'
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

// ─── Role color map ───────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  client: '#C6A664',
  creator: '#5E8B84',
  admin: '#7A2E32',
  personal: '#B5764A',
}

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  creator: 'Creator',
  admin: 'Admin',
  personal: 'Personal',
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free / Starter',
  starter: 'Starter',
  growth: 'Growth',
  premium: 'Premium',
  enterprise: 'Enterprise',
  trial: 'Trial',
  none: 'None',
  // client_*
  client_founder: 'Founder',
  client_org: 'Org',
  client_enterprise: 'Enterprise',
  // creator_*
  creator_studio: 'Studio',
  creator_premium: 'Premium Creator',
  creator_concierge: 'Concierge Creator',
  // personal_*
  personal_free: 'Free Personal',
  personal_plus: 'Personal Plus',
  personal_premium: 'Premium Personal',
  // affiliate_*
  affiliate_starter: 'Affiliate Starter',
  affiliate_pro: 'Affiliate Pro',
  affiliate_enterprise: 'Affiliate Enterprise',
  // service_*
  service_free: 'Free Service',
  service_basic: 'Basic Service',
  service_premium: 'Premium Service',
  // employee_*
  employee_starter: 'Employee Starter',
  employee_growth: 'Employee Growth',
  employee_pro: 'Employee Pro',
  employee_enterprise: 'Employee Enterprise',
  // department_*
  department_starter: 'Department Starter',
  department_premium: 'Department Premium',
  // os_*
  os_creator: 'OS Creator',
  os_founder: 'OS Founder',
  os_business: 'OS Business',
  os_agency: 'OS Agency',
  os_family: 'OS Family',
  os_wellness: 'OS Wellness',
  // enterprise_*
  enterprise_concierge: 'Enterprise Concierge',
  enterprise_eden_force: 'Eden Force',
  enterprise_omnigrid: 'Omnigrid',
}

function planLabel(key: string | null | undefined): string {
  if (!key || key === 'none' || key === 'free') return 'Free / Starter'
  return PLAN_LABELS[key] ?? key.replace(/^[a-z]+_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Helpers ──────────────────────────────────────────────────
function profileComplete(user: Record<string, any>, client: Record<string, any>, hasBlueprint: boolean): number {
  let score = 0
  if (user.full_name) score += 20
  if (client?.dob) score += 15
  if (client?.birth_location) score += 15
  if (client?.archetype) score += 20
  if (client?.archetype) score += 15
  if (hasBlueprint) score += 15
  return Math.min(score, 100)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ─── Badge component ──────────────────────────────────────────
function Badge({ label, color, subtle }: { label: string; color: string; subtle?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wider uppercase px-2.5 py-1 rounded-sm ${
        subtle ? '' : ''
      }`}
      style={{
        backgroundColor: `${color}12`,
        color,
        border: `1px solid ${color}25`,
      }}
    >
      {label}
    </span>
  )
}

// ─── Score bar ────────────────────────────────────────────────
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-white/60">{label}</span>
        <span className="text-xs font-medium" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-xs text-white/30 tracking-widest uppercase">{title}</div>
      {action}
    </div>
  )
}

// ─── Stat cell ────────────────────────────────────────────────
function StatCell({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white/[0.03] rounded-sm p-3 border border-white/[0.06]">
      <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">{label}</div>
      <div
        className="text-sm font-semibold truncate"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  )
}

// ================================================================
// PAGE
// ================================================================
export default async function ClientProfilePage({ params }: { params: Promise<{ clientKey: string }> }) {
  const { clientKey } = await params
  const { targetClientId, access } = await requireClientView(clientKey)
  const svc = createServiceClient()

  // ── Fetch all data in parallel ──────────────────────────────
  const [userRes, clientRes, twinRes, vaultRes] = await Promise.all([
    svc.from('users').select('*').eq('id', targetClientId).maybeSingle(),
    svc.from('clients').select('*').eq('id', targetClientId).maybeSingle(),
    svc.from('client_twins').select('*').eq('client_id', targetClientId).maybeSingle(),
    svc.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('organization_id' as any, targetClientId),
  ])

  const identity = (userRes.data ?? {}) as Record<string, any>
  const client = (clientRes.data ?? {}) as Record<string, any>
  const twin = twinRes.data ?? null
  const vaultCount = vaultRes.count ?? 0

  const name = identity.full_name ?? identity.email?.split('@')[0] ?? 'User'
  const role: string = identity.role ?? 'client'
  const roleColor = ROLE_COLORS[role] ?? '#C6A664'
  const hasBlueprint = !!((twin as any)?.metadata?.lenses?.humanDesign?.data)
  const completePct = profileComplete(identity, client, hasBlueprint)

  // Twin scores
  const engagementScore = twin?.engagement_score ?? 0
  const confidenceScore = twin?.confidence_score ?? 0
  const loyaltyScore = twin?.loyalty_score ?? 0
  const twinVersion = twin?.version ?? 0
  const twinStatus = twin?.twin_status ?? 'inactive'

  // Client fields
  const planTier = client?.plan_tier_key ?? client?.plan_tier ?? 'free'
  const lifetimeValue = client?.lifetime_value
  const consultationEligible = client?.consultation_eligible ?? false
  const agentDeployments = client?.agent_deployments ?? 0
  const dob = client?.dob
  const birthLocation = client?.birth_location
  const energyType = client?.energy_type
  const archetype = client?.archetype
  const specialty = client?.primary_specialty ?? client?.specialty

  // ── Essence items (server-side fetch) ───────────────────────
  let essenceItems: { type: string; content: string; priority: string }[] = []
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      const res = await fetch(`${appUrl}/api/zuri/essence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetClientId, userRole: role }),
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.items?.length) {
          essenceItems = data.items.slice(0, 5)
        }
      }
    } catch {
      // Fallback below
    }
  }
  if (essenceItems.length === 0) {
    essenceItems = [
      { type: 'action', content: 'No daily essence items yet — complete your blueprint to unlock personalized intelligence briefs.', priority: 'low' },
    ]
  }

  const PRIORITY_COLORS: Record<string, string> = {
    high: '#7A2E32',
    medium: '#B5764A',
    low: '#8B7AA8',
  }
  const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    focus: { label: 'Focus', color: '#C6A664' },
    optimization: { label: 'Optimization', color: '#5E8B84' },
    timing: { label: 'Timing', color: '#8B7AA8' },
    opportunity: { label: 'Opportunity', color: '#5E8B84' },
    growth: { label: 'Growth', color: '#B5764A' },
    brand: { label: 'Brand', color: '#C6A664' },
    habit: { label: 'Habit', color: '#8B7AA8' },
    action: { label: 'Action', color: '#C9974A' },
  }

  const prefix = `/dashboard/client/${clientKey}`

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* ═══ Header ═══ */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          My <span className="text-[#C6A664]">Profile</span>
        </h1>
        <p className="text-white/30 text-sm">Your complete intelligence profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══════════════════════════════════════════════════════
            MAIN COLUMN (2/3)
            ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ─── 1. IDENTITY CARD ─────────────────────────────── */}
          <div className="glass rounded-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${roleColor}12`,
                  border: `2px solid ${roleColor}30`,
                }}
              >
                <span className="text-2xl font-bold" style={{ color: roleColor }}>
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-semibold truncate">{name}</h2>
                <p className="text-sm text-white/40 truncate">{identity.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge label={ROLE_LABELS[role] ?? role} color={roleColor} />
                  <span className="text-xs text-white/30">
                    Member since {formatDate(identity.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Complete */}
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/50">Profile Complete</span>
                <span className="text-xs font-medium text-white/40">{completePct}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${completePct}%`,
                    backgroundColor: completePct === 100 ? '#5E8B84' : roleColor,
                  }}
                />
              </div>
              {access === 'self' && (
                <div className="flex items-center justify-between mt-3">
                  <Link
                    href={`${prefix}/settings`}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors inline-flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Edit profile
                  </Link>
                  <Link
                    href="/intake"
                    className="text-xs text-white/30 hover:text-white/60 transition-colors inline-flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Update intake
                  </Link>
                </div>
              )}
            </div>

            {/* Quick stat row */}
            <div className="px-6 py-4 grid grid-cols-3 gap-3">
              <StatCell label="Role" value={ROLE_LABELS[role] ?? role} color={roleColor} />
              <StatCell label="Twin Status" value={twin ? 'Active' : 'Inactive'} color={twin ? '#5E8B84' : '#6b7280'} />
              <StatCell label="Blueprint" value={hasBlueprint ? 'Complete' : 'Pending'} color={hasBlueprint ? '#C6A664' : '#6b7280'} />
            </div>
          </div>

          {/* ─── 2. INTELLIGENCE PROFILE ───────────────────────── */}
          <div className="glass rounded-sm p-6">
            <SectionHeader
              title="Intelligence Profile"
              action={access === 'self' ? (
                <Link
                  href="/intake"
                  className="text-xs text-white/20 hover:text-white/50 transition-colors inline-flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                  Edit
                </Link>
              ) : undefined}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Energy Type', value: energyType ?? '—' },
                { label: 'Birth Date', value: dob ?? '—' },
                { label: 'Birth Location', value: birthLocation ?? '—' },
                { label: 'Archetype', value: archetype ?? '—' },
                { label: 'Specialty', value: specialty ?? '—' },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between border-b border-white/[0.04] pb-2.5">
                  <div>
                    <div className="text-[10px] text-white/30 tracking-widest uppercase mb-0.5">{field.label}</div>
                    <div className={`text-sm ${field.value === '—' ? 'text-white/20 italic' : 'text-white/70'}`}>
                      {field.value}
                    </div>
                  </div>
                  {access === 'self' && (
                    <Link
                      href="/intake"
                      className="text-white/10 hover:text-white/40 transition-colors shrink-0 ml-3"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </Link>
                  )}
                </div>
              ))}
            </div>
            {(!energyType && !dob && !archetype) && access === 'self' && (
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <Link
                  href="/intake"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A664]/10 border border-[#C6A664]/25 text-[#C6A664] text-xs font-semibold rounded-sm hover:bg-[#C6A664]/20 transition-all"
                >
                  Complete your intake profile →
                </Link>
              </div>
            )}
          </div>

          {/* ─── 3. BLUEPRINT STATUS ─────────────────────────── */}
          <div className="glass rounded-sm p-6">
            <SectionHeader title="Blueprint Status" />
            {hasBlueprint && twin ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-[#C6A664]">
                      {(twin as any)?.metadata?.lenses?.humanDesign?.data?.overallScore ?? '—'}
                    </div>
                    <div className="text-[10px] text-white/30 tracking-widest uppercase mt-1">Overall Score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/70">{(twin as any)?.metadata?.lenses?.humanDesign?.data?.archetype ?? '—'}</div>
                    <div className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5">Archetype</div>
                  </div>
                </div>
                {/* Dimension scores */}
                {(() => {
                  const scores: Record<string, number> | undefined = (twin as any)?.metadata?.lenses?.humanDesign?.data?.scores
                  if (!scores || Object.keys(scores).length === 0) return null
                  return (
                    <div className="space-y-2.5 mb-4">
                      {Object.entries(scores).map(([key, val]) => (
                        <ScoreBar
                          key={key}
                          label={key.replace(/_/g, ' ')}
                          value={val}
                          color="#C6A664"
                        />
                      ))}
                    </div>
                  )
                })()}
                {/* Summary */}
                {(twin as any)?.metadata?.lenses?.humanDesign?.data?.summary && (
                  <p className="text-sm text-white/50 leading-relaxed mt-4 pt-4 border-t border-white/[0.06]">
                    {(twin as any).metadata.lenses.humanDesign.data.summary}
                  </p>
                )}
                <Link
                  href={`${prefix}/essence-profile`}
                  className="inline-block mt-4 text-xs text-[#C6A664]/60 hover:text-[#C6A664] transition-colors"
                >
                  View full blueprint →
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg text-white/20">◈</span>
                </div>
                <p className="text-sm text-white/40 mb-1">No blueprint yet</p>
                <p className="text-xs text-white/20 mb-4">Complete the assessment to unlock your intelligence foundation</p>
                {access === 'self' && (
                  <Link
                    href={`${prefix}/essence-profile/assess`}
                    className="inline-block px-5 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
                  >
                    Take Assessment →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ─── 4. AI TWIN STATUS ────────────────────────────── */}
          <div className="glass rounded-sm p-6">
            <SectionHeader
              title="AI Twin Status"
              action={
                <Link
                  href={`${prefix}/twin`}
                  className="text-xs text-white/20 hover:text-white/50 transition-colors"
                >
                  View twin →
                </Link>
              }
            />
            {twin ? (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <StatCell label="Version" value={`v${twinVersion}`} color="#8B7AA8" />
                  <StatCell label="Status" value={twinStatus} color={twinStatus === 'active' ? '#5E8B84' : '#6b7280'} />
                  <StatCell label="Loyalty" value={`${loyaltyScore}%`} color="#8B7AA8" />
                </div>
                <div className="space-y-3">
                  <ScoreBar label="Engagement" value={engagementScore} color="#C6A664" />
                  <ScoreBar label="Confidence" value={confidenceScore} color="#5E8B84" />
                  <ScoreBar label="Loyalty" value={loyaltyScore} color="#8B7AA8" />
                </div>
                {(twin as any)?.personality_summary && (
                  <p className="text-sm text-white/50 leading-relaxed mt-4 pt-4 border-t border-white/[0.06]">
                    {(twin as any).personality_summary}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg text-white/20">◆</span>
                </div>
                <p className="text-sm text-white/40 mb-1">No AI twin deployed</p>
                <p className="text-xs text-white/20 mb-4">Complete your blueprint to generate your twin</p>
                {access === 'self' && (
                  <Link
                    href={`${prefix}/essence-profile/assess`}
                    className="inline-block px-5 py-2.5 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
                  >
                    Deploy Twin →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SIDEBAR (1/3)
            ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-1 space-y-6">

          {/* ─── 5. ESSENCE ACTIVITY ──────────────────────────── */}
          <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C6A664] animate-pulse-slow" />
                <span className="text-xs text-[#C6A664] tracking-widest uppercase font-medium">
                  Essence Activity
                </span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {essenceItems.map((item, i) => {
                const cfg = TYPE_CONFIG[item.type] ?? { label: 'Insight', color: '#8B7AA8' }
                return (
                  <div
                    key={i}
                    className="px-5 py-3 hover:bg-white/[0.02] transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: PRIORITY_COLORS[item.priority] ?? '#8B7AA8' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-medium" style={{ color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span
                            className="text-[8px] uppercase tracking-widest"
                            style={{ color: PRIORITY_COLORS[item.priority] ?? '#8B7AA8' }}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">{item.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.06]">
              <Link
                href={prefix}
                className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
              >
                View full Essence Board →
              </Link>
            </div>
          </div>

          {/* ─── 6. VAULT SUMMARY ─────────────────────────────── */}
          <Link href={`${prefix}/vault`} className="block glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-white/30 tracking-widest uppercase">Vault</div>
              <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-light text-[#C6A664] mb-1">{vaultCount}</div>
            <p className="text-xs text-white/40">document{vaultCount !== 1 ? 's' : ''} stored</p>
            {vaultCount === 0 && (
              <p className="text-[10px] text-white/20 mt-2">Upload your first document to seed your intelligence vault</p>
            )}
          </Link>

          {/* ─── 7. AGENT DEPLOYMENTS ─────────────────────────── */}
          <Link href={`${prefix}/essence-profile`} className="block glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-white/30 tracking-widest uppercase">Agents</div>
              <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-light text-[#5E8B84] mb-1">{agentDeployments}</div>
            <p className="text-xs text-white/40">deployed agent{agentDeployments !== 1 ? 's' : ''}</p>
            {agentDeployments === 0 && (
              <p className="text-[10px] text-white/20 mt-2">Deploy your first agent from the blueprint page</p>
            )}
          </Link>

          {/* ─── 8. PLAN & BILLING ────────────────────────────── */}
          <div className="glass rounded-sm p-5 border border-white/[0.06]">
            <SectionHeader title="Plan & Billing" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Current Plan</span>
                <Badge
                  label={planLabel(planTier)}
                  color={planTier === 'free' ? '#6b7280' : '#C6A664'}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Lifetime Value</span>
                <span className="text-sm text-white/70 font-medium">
                  {lifetimeValue != null ? `$${lifetimeValue}` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Consultation</span>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                    consultationEligible
                      ? 'text-[#5E8B84] bg-[#5E8B84]/10 border border-[#5E8B84]/25'
                      : 'text-white/20 bg-white/[0.03] border border-white/[0.06]'
                  }`}
                >
                  {consultationEligible ? 'Eligible' : 'N/A'}
                </span>
              </div>
            </div>
            <Link
              href={`${prefix}/plan`}
              className="inline-block mt-4 text-xs text-[#C6A664]/60 hover:text-[#C6A664] transition-colors"
            >
              View plan details →
            </Link>
          </div>

          {/* ─── Quick links ──────────────────────────────────── */}
          <div className="glass rounded-sm p-5 border border-white/[0.06] space-y-2.5">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Quick Links</div>
            {[
              { href: `${prefix}/twin`, label: 'View AI Twin' },
              { href: `${prefix}/essence-profile`, label: 'Blueprint Details' },
              { href: `${prefix}/vault`, label: 'Intelligence Vault' },
              { href: `${prefix}/zuri`, label: 'Ask Zuri' },
              { href: `${prefix}/settings`, label: 'Account Settings' },
              { href: '/intake', label: 'Update Intake' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-xs text-white/30 hover:text-white/60 transition-colors py-1"
              >
                → {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
