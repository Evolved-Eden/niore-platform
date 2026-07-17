import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EssenceBoard from '@/components/EssenceBoard'
import { deriveRoleFromPlanTier } from '@/types'

const ROLE_COLOR: Record<string, string> = {
  admin: '#7A2E32',
  creator: '#5E8B84',
  client: '#C6A664',
  personal: '#B5764A',
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
    { title: 'My Twin', desc: 'View your AI Executive Twin', href: '/dashboard/client/twin', icon: '⟐' },
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
  { label: 'Blueprint Score', value: '92%', icon: '◆', color: '#C6A664' },
  { label: 'Twin Status', value: 'Active', icon: '⟐', color: '#5E8B84' },
  { label: 'Essence Items', value: '14', icon: '⊙', color: '#8B7AA8' },
  { label: 'Agents Deployed', value: '3', icon: '⊕', color: '#C6A664' },
  { label: 'Swarms Active', value: '1', icon: '⊗', color: '#5E8B84' },
  { label: 'Consultation', value: 'Scheduled', icon: '✦', color: '#B5764A' },
]

const QUICK_STATS = [
  { label: 'System Uptime', value: '99.9%' },
  { label: 'Intelligence Level', value: 'Lv. 7' },
  { label: 'Blueprint Status', value: 'Optimized' },
  { label: 'Active Agents', value: '3 Online' },
]

const SERVICES = [
  {
    title: 'Front Desk Agents',
    eyebrow: 'Intake and scheduling',
    copy: 'Qualify leads, answer common questions, route requests, and hand off clean context to your team.',
    accent: 'border-[#5E8B84]/35 text-cyan',
  },
  {
    title: 'Business Twins',
    eyebrow: 'Operations memory',
    copy: 'Turn your services, policies, offers, and workflows into a deployable intelligence layer.',
    accent: 'border-[#C6A664]/35 text-acid',
  },
  {
    title: 'Creator Systems',
    eyebrow: 'Content and monetization',
    copy: 'Package expertise into assistants, campaigns, premium experiences, and affiliate-ready funnels.',
    accent: 'border-[#8B7AA8]/35 text-violet',
  },
]

const ROLE_PATHS = [
  {
    role: 'Clients',
    href: '/define-intelligence/client',
    metric: 'Blueprint -> Twin -> Deploy',
    copy: 'Build a practical AI operating system around the way your business already works.',
  },
  {
    role: 'Creators',
    href: '/define-intelligence/creator',
    metric: 'IP -> Product -> Revenue',
    copy: 'Turn your perspective, voice, and playbooks into an always-on intelligence product.',
  },
  {
    role: 'Personal',
    href: '/define-intelligence/personal',
    metric: 'Life -> Systems -> Growth',
    copy: 'Build a personal AI companion that learns your world, simplifies your day, and grows with you.',
  },
  {
    role: 'Affiliates',
    href: '/define-intelligence/affiliate',
    metric: 'Audience -> Match -> Commission',
    copy: 'Route the right people into the right systems with partner-ready tracking and offers.',
  },
]

const DEMO_LANES = [
  ['Real Estate', '/demo/real-estate'],
  ['Hotel', '/demo/hotel'],
  ['Legal', '/demo/legal'],
  ['HR', '/demo/hr'],
  ['Med Spa', '/demo/med-spa'],
]

const EXCHANGE_ITEMS = [
  'Agent templates for vertical demos',
  'Blueprint scoring and pricing paths',
  'n8n workflow bridge to Discord and social',
  'Supabase identity, roles, and vault data',
]

// Drop the 5 team photos into public/images/team/ using these exact filenames,
// or edit the src paths below to match wherever you save them.
const TEAM_PHOTOS = [
  { src: '/images/team/team-laptop.jpg', alt: 'Working session' },
  { src: '/images/team/team-dinner.jpg', alt: 'Client dinner' },
  { src: '/images/team/team-office.jpg', alt: 'Office portrait' },
  { src: '/images/team/team-boardroom.jpg', alt: 'Boardroom' },
  { src: '/images/team/team-ai-twin.jpg', alt: 'Your AI Twin' },
]

export default async function DashboardHub({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  // Guaranteed non-null by root middleware
  const user = _user!

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

  // Admin always wins regardless of plan_tier_key (see app/dashboard/layout.tsx
  // for the full explanation -- same bug fixed there, admins with a purchased
  // plan were getting silently demoted to their plan's role).
  const planRole = deriveRoleFromPlanTier(clientRecord?.plan_tier_key)
  const role: string = userRole === 'admin' ? 'admin' : (planRole ?? userRole)

  // Handle checkout=success — redirect to role-specific dashboard
  const sp = await searchParams
  const checkout = sp?.checkout as string

  if (checkout === 'success') {
    redirect(`/dashboard/${role}`)
  }
  const color = ROLE_COLOR[role] ?? '#C6A664'
  const actions = QUICK_ACTIONS[role] ?? QUICK_ACTIONS.client
  const kpis = KPI_ITEMS

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      {/* ── Hero Section ── */}
      <div className="mb-6">
        <h1
          className="font-display text-3xl font-bold tracking-tight mb-1 bg-gradient-to-r from-[#C6A664] via-white to-[#C6A664] bg-clip-text text-transparent bg-[length:200%] animate-gradient"
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
              style={{ background: s.online ? '#C6A664' : '#555' }}
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
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A664] animate-pulse-slow" />
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
      <div className="relative rounded-sm p-[2px] bg-gradient-to-r from-[#C6A664] via-white/20 to-[#C6A664] group/cta">
        <div className="bg-[#0A0A0B] rounded-[3px] p-6 h-full">
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
              className="px-6 py-3 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-all shrink-0 glow-acid group-hover/cta:shadow-[0_0_32px_rgba(200,255,0,0.3)]"
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

      {/* ── Services ── */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/35 mb-3">Services</p>
        <div className="grid gap-4 md:grid-cols-3">
          {SERVICES.map((service) => (
            <div key={service.title} className={`rounded-lg border bg-white/[0.025] p-6 ${service.accent}`}>
              <p className="text-xs uppercase tracking-[0.26em] text-white/35">{service.eyebrow}</p>
              <h3 className="mt-4 text-xl font-semibold text-white">{service.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/45">{service.copy}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Role Paths ── */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/35 mb-3">Role Paths</p>
        <div className="grid gap-4 lg:grid-cols-4">
          {ROLE_PATHS.map((path) => (
            <Link
              key={path.role}
              href={path.href}
              className="group rounded-lg border border-white/10 bg-white/[0.025] p-5 transition-colors hover:border-[#C6A664]/50"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-[#C6A664]/70">{path.metric}</p>
              <h3 className="mt-4 text-xl font-semibold text-white">{path.role}</h3>
              <p className="mt-3 min-h-16 text-sm leading-6 text-white/45">{path.copy}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-white/60 transition-colors group-hover:text-[#C6A664]">
                Open path
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Demo Lanes ── */}
      <div className="glass rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <span className="text-xs text-white/30 tracking-widest uppercase">Demo Lanes</span>
        </div>
        <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_LANES.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25 hover:bg-white/[0.055]"
            >
              <span className="text-base font-semibold text-white">{label}</span>
              <span className="mt-2 block text-xs text-white/40">Explore demo</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Team ── */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/35 mb-3">Team</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 items-center">
          {TEAM_PHOTOS.map((photo, i) => {
            const featured = i === TEAM_PHOTOS.length - 1
            if (featured) {
              return (
                <div key={photo.src} className="relative mx-auto w-full aspect-square max-w-[180px]">
                  <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#C6A664,transparent_35%,#C6A664)] animate-spin-slow" />
                  <div className="absolute inset-[3px] rounded-full overflow-hidden bg-[#0A0A0B] border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover" />
                  </div>
                </div>
              )
            }
            return (
              <div key={photo.src} className="rounded-lg overflow-hidden border border-white/10 bg-white/[0.025] aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover" />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Exchange ── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.025] p-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">Exchange</p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
              A marketplace for repeatable intelligence.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">
              Evolved Eden is evolving into an exchange where proven agents, workflow packs, creator systems, and
              referral paths can be reused across the ecosystem.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={process.env.NEXT_PUBLIC_EXCHANGE_URL || '/exchange'}
                target="_blank" rel="noopener"
                className="inline-flex items-center justify-center rounded-sm bg-[#C6A664] px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-white glow-acid"
              >
                Visit the Exchange
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center rounded-sm border border-white/15 px-6 py-3 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
              >
                Pricing
              </a>
            </div>
          </div>
          <div className="space-y-3">
            {EXCHANGE_ITEMS.map((item) => (
              <div key={item} className="flex gap-3 rounded-md border border-white/10 bg-black/20 p-4">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C6A664]" />
                <p className="text-sm leading-6 text-white/55">{item}</p>
              </div>
            ))}
          </div>
        </div>
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
