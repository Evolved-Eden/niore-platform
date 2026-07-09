import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EssenceBoard from '@/components/EssenceBoard'
import { deriveRoleFromPlanTier } from '@/types'

const ROLE_COLOR: Record<string, string> = {
  admin: '#ff6b6b',
  creator: '#00d4ff',
  client: '#c8ff00',
  personal: '#fb923c',
}

interface QuickAction {
  title: string
  desc: string
  href: string
  icon: string
}

const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  client: [
    { title: 'Open Zuri', desc: 'Your personal intelligence concierge', href: '/dashboard/client/zuri', icon: '◈' },
    { title: 'My Twin', desc: 'View your AI digital twin', href: '/dashboard/client/twin', icon: '⟐' },
    { title: 'Essence Intel', desc: 'Daily intelligence briefings', href: '/dashboard/client/essence', icon: '⊙' },
    { title: 'My Agents', desc: 'Deploy and manage AI agents', href: '/dashboard/client/agents', icon: '⊕' },
    { title: 'Vault', desc: 'Secure document & knowledge', href: '/dashboard/client/vault', icon: '▣' },
    { title: 'Book Consultation', desc: '30-min strategy session', href: '/dashboard/client/consulting', icon: '✦' },
  ],
  creator: [
    { title: 'Content Studio', desc: 'Create and schedule content', href: '/dashboard/creator/intelligences', icon: '✦' },
    { title: 'Analytics', desc: 'Audience and growth metrics', href: '/dashboard/creator/analytics', icon: '⊙' },
    { title: 'Payouts', desc: 'Revenue and commission tracking', href: '/dashboard/creator/payouts', icon: '◈' },
  ],
  admin: [
    { title: 'Users', desc: 'Manage platform users', href: '/dashboard/admin/users', icon: '✦' },
    { title: 'Agents', desc: 'Deploy and monitor agents', href: '/dashboard/admin/agents', icon: '⊕' },
    { title: 'OmniGrid', desc: 'Full system control panel', href: '/dashboard/admin', icon: '◈' },
  ],
  personal: [
    { title: 'My Hub', desc: 'Your personal intelligence hub', href: '/dashboard/personal', icon: '✦' },
    { title: 'Profile', desc: 'Manage your personal profile', href: '/dashboard/personal/profile', icon: '◈' },
    { title: 'Settings', desc: 'Account & privacy settings', href: '/dashboard/personal/settings', icon: '⊙' },
  ],
}

const SYSTEM_STATUSES = [
  { label: 'Blueprint', key: 'blueprint', online: true },
  { label: 'Twin', key: 'twin', online: true },
  { label: 'Essence', key: 'essence', online: true },
  { label: 'Agents', key: 'agents', online: true },
  { label: 'Consultation', key: 'consultation', online: true },
]

const KPI_ITEMS = [
  { label: 'Blueprint Score', value: '92%', icon: '◆', color: '#c8ff00' },
  { label: 'Twin Status', value: 'Active', icon: '⟐', color: '#00d4ff' },
  { label: 'Essence Items', value: '14', icon: '⊙', color: '#a78bfa' },
  { label: 'Agents Deployed', value: '3', icon: '⊕', color: '#c8ff00' },
  { label: 'Swarms Active', value: '1', icon: '⊗', color: '#00d4ff' },
  { label: 'Consultation', value: 'Scheduled', icon: '✦', color: '#fb923c' },
]

const QUICK_STATS = [
  { label: 'System Uptime', value: '99.9%' },
  { label: 'Intelligence Level', value: 'Lv. 7' },
  { label: 'Blueprint Status', value: 'Optimized' },
  { label: 'Active Agents', value: '3 Online' },
]

export default async function DashboardHub({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch client record to get plan_tier_key (reflects what user actually paid for)
  const { data: clientRecord } = await supabase
    .from('clients')
    .select('plan_tier_key, metadata')
    .eq('id', user.id)
    .maybeSingle()

  const { data: identity } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const userRole = (identity?.role as string) ?? 'client'
  const name = identity?.full_name ?? user.email?.split('@')[0] ?? 'User'

  // Derive role from plan_tier_key first (what they paid for), fall back to users.role
  const planRole = deriveRoleFromPlanTier(clientRecord?.plan_tier_key)
  const role: string = planRole ?? userRole

  // Handle checkout=success — redirect to role-specific dashboard
  const sp = await searchParams
  const checkout = sp?.checkout as string

  if (checkout === 'success') {
    redirect(`/dashboard/${role}`)
  }
  const color = ROLE_COLOR[role] ?? '#c8ff00'
  const actions = QUICK_ACTIONS[role] ?? QUICK_ACTIONS.client
  const kpis = KPI_ITEMS

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      {/* ── Hero Section ── */}
      <div className="mb-6">
        <h1
          className="font-display text-3xl font-bold tracking-tight mb-1 bg-gradient-to-r from-[#c8ff00] via-white to-[#c8ff00] bg-clip-text text-transparent bg-[length:200%] animate-gradient"
        >
          Welcome back, {name}
        </h1>
        <p className="text-white/30 text-sm">Your {role} intelligence command center</p>
      </div>

      {/* ── System Status Bar ── */}
      <div className="flex flex-wrap gap-6 mb-4">
        {SYSTEM_STATUSES.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${s.online ? 'animate-pulse' : ''}`}
              style={{ background: s.online ? '#c8ff00' : '#555' }}
            />
            <span className="text-xs text-white/40 tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Quick Actions Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((cta) => (
          <Link
            key={cta.href}
            href={cta.href}
            className="group glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 hover:translate-y-[-2px]"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm w-5 text-center" style={{ color }}>{cta.icon}</span>
              <div className="text-xs tracking-widest uppercase" style={{ color }}>
                {cta.title}
              </div>
            </div>
            <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">{cta.desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Intelligence Command Center ── */}
      <div className="glass rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/30 tracking-widest uppercase flex items-center gap-2">
            <span>◈</span> Intelligence Command Center
          </span>
          <span className="flex items-center gap-2 text-xs text-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-pulse-slow" />
            Live
          </span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="text-center">
                <div className="text-lg mb-2" style={{ color: kpi.color }}>{kpi.icon}</div>
                <div className="text-xl font-light mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[10px] text-white/30 tracking-widest uppercase">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Role-Specific CTA ── */}
      <div className="relative rounded-sm p-[2px] bg-gradient-to-r from-[#c8ff00] via-white/20 to-[#c8ff00] group/cta">
        <div className="bg-[#080810] rounded-[3px] p-6 h-full">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold mb-1 text-white">
                {role === 'client' ? 'Run Your Blueprint Assessment' : 'Open Your Dashboard'}
              </h2>
              <p className="text-sm text-white/40">
                {role === 'client'
                  ? 'Discover which intelligence agents and systems are optimal for your business.'
                  : 'Continue to your dashboard to access tools tailored for your role.'}
              </p>
            </div>
            <Link
              href={role === 'client' ? '/dashboard/client/blueprint/assess' : `/dashboard/${role}`}
              className="px-6 py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-all shrink-0 glow-acid group-hover/cta:shadow-[0_0_32px_rgba(200,255,0,0.3)]"
            >
              {role === 'client' ? 'Start Blueprint →' : 'Go to Dashboard →'}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {QUICK_STATS.map((stat) => (
          <div key={stat.label} className="glass rounded-sm p-4 text-center">
            <div className="text-lg font-light mb-1 text-white/80">{stat.value}</div>
            <div className="text-[10px] text-white/30 tracking-widest uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Essence Board ── */}
      <div className="glass rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <span className="text-xs text-white/30 tracking-widest uppercase flex items-center gap-2">
            <span>⊙</span> Essence Intelligence Board
          </span>
        </div>
        <div className="p-6">
          <EssenceBoard userId={user.id} userRole={role} />
        </div>
      </div>
    </div>
  )
}
