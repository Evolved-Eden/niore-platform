import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { UserRole } from '@/types'
import { deriveRoleFromPlanTier } from '@/types'
import { buildClientKey } from '@/lib/client-dashboard'

import SidebarNav from './_components/SidebarNav'

// This one layout renders every role's shell (client/admin/creator/personal/
// affiliate/collective all share it -- there's no per-role nested layout).
// Next.js's App Router only re-runs a layout's server logic on a hard page
// load or a layout-segment change; client-side navigation between sibling
// routes that share this layout (e.g. /dashboard/client/x -> /dashboard/
// admin/y) normally REUSES the already-rendered layout output instead of
// re-fetching it, which is what let the sidebar/role badge go stale after
// the very first render of a session (page content below it still updates
// fine, since page-level segments always refetch on navigation).
// force-dynamic stops this layout from ever being served from Next's Full
// Route Cache -- combined with SidebarNav's router.refresh() on every
// pathname change (which busts the client Router Cache for this segment),
// role/nav now gets recomputed fresh on every navigation, not just once
// per session.
export const dynamic = 'force-dynamic'

const NAV: Record<UserRole, { label: string; href: string }[]> = {
  client: [
    { label: 'Overview',     href: '/dashboard/client' },
    { label: 'Profile',      href: '/dashboard/client/profile' },
    { label: 'Organization', href: '/dashboard/client/organization' },
    { label: 'Intake',       href: '/intake' },
    { label: 'Assessment',   href: '/dashboard/assessments' },
    { label: 'Essence Intel',href: '/dashboard/client/essence' },
    { label: 'Workforce',    href: '/dashboard/client/workforce' },
    { label: 'My Twin',      href: '/dashboard/client/twin' },
    { label: 'Twin Registry',href: '/dashboard/client/registry' },
    { label: 'Journal',      href: '/dashboard/client/journal' },
    { label: 'Vault',        href: '/dashboard/client/vault' },
    { label: 'Connectors',   href: '/dashboard/client/connectors' },
    { label: 'Concierge',    href: '/dashboard/client/consulting' },
    { label: 'Zuri',         href: '/dashboard/client/zuri' },
    { label: 'Calendar',     href: '/dashboard/client/calendar' },
    { label: 'Settings',     href: '/dashboard/client/settings' },
  ],
  creator: [
    { label: 'Overview',       href: '/dashboard/creator' },
    { label: 'Intake',         href: '/intake' },
    { label: 'Profile',        href: '/dashboard/client/profile' },
    { label: 'Assessment',     href: '/dashboard/assessments' },
    { label: 'Essence Intel',  href: '/dashboard/client/essence' },
    { label: 'Intelligences',  href: '/dashboard/creator/intelligences' },
    { label: 'Workforce',      href: '/dashboard/client/workforce' },
    { label: 'My Twin',        href: '/dashboard/client/twin' },
    { label: 'Analytics',      href: '/dashboard/creator/analytics' },
    { label: 'Payouts',        href: '/dashboard/creator/payouts' },
    { label: 'Settings',       href: '/dashboard/creator/settings' },
  ],
  admin: [
    { label: 'Overview',       href: '/dashboard/admin' },
    { label: 'Intake',         href: '/intake' },
    { label: 'My Essence Profile', href: '/dashboard/admin/essence-profile' },
    { label: 'Assessment',     href: '/dashboard/assessments' },
    { label: 'Essence Intel',  href: '/dashboard/admin/essence' },
    { label: 'My Twin',        href: '/dashboard/admin/twin' },
    { label: 'Chat / Prompt',  href: '/dashboard/chat' },
    { label: '── System ──',   href: '#' },
    { label: 'Users',          href: '/dashboard/admin/users' },
    { label: 'Clients',        href: '/dashboard/admin/clients' },
    { label: 'Pricing',        href: '/dashboard/admin/pricing' },
    { label: 'Coupons',        href: '/dashboard/admin/coupons' },
    { label: 'Deployments',    href: '/dashboard/admin/deployments' },
    { label: 'Specialties',  href: '/dashboard/admin/specialties' },
    { label: 'Avatars',        href: '/dashboard/admin/avatars' },
    { label: 'Essential Employees', href: '/dashboard/admin/agents' },
    { label: 'Teams & Depts',  href: '/dashboard/admin/swarms' },
    { label: 'Generators',     href: '/dashboard/admin/generators' },
    { label: 'Archetypes',     href: '/dashboard/admin/archetypes' },
    { label: 'Workflows',      href: '/dashboard/admin/workflows' },
    { label: 'Connectors',     href: '/dashboard/admin/connectors' },
    { label: 'Connector Access', href: '/dashboard/admin/connector-access' },
    { label: 'Zuri Config',    href: '/dashboard/admin/zuri' },
    { label: 'Templates',      href: '/dashboard/admin/templates' },
    { label: 'Settings',       href: '/dashboard/admin/settings' },
  ],
  personal: [
    { label: 'My Hub',       href: '/dashboard/personal' },
    { label: 'Intake',       href: '/intake' },
    { label: 'Assessment',   href: '/dashboard/assessments' },
    { label: 'Essence Intel',href: '/dashboard/client/essence' },
    { label: 'Profile',      href: '/dashboard/personal/profile' },
    { label: 'Settings',     href: '/dashboard/personal/settings' },
  ],
  affiliate: [
    { label: 'Overview (Aff)',href: '/dashboard/affiliate' },
    { label: 'Intake',       href: '/intake' },
    { label: 'Profile',      href: '/dashboard/client/profile' },
    { label: 'Assessment',   href: '/dashboard/assessments' },
    { label: 'Essence Intel',href: '/dashboard/client/essence' },
    { label: 'Referrals',    href: '/dashboard/affiliate/referrals' },
    { label: 'Payouts',      href: '/dashboard/affiliate/payouts' },
    { label: 'Settings',     href: '/dashboard/affiliate/settings' },
  ],
  collective: [
    { label: 'Overview',     href: '/dashboard/collective' },
    { label: 'Members',      href: '/dashboard/client/organization' },
    { label: 'Workstations', href: '/dashboard/collective/workstations' },
    { label: 'Essence Intel',href: '/dashboard/collective/essence' },
    { label: 'Workforce',    href: '/dashboard/client/workforce' },
    { label: 'Governance',   href: '/dashboard/collective/governance' },
    { label: 'Calendar',     href: '/dashboard/client/calendar' },
    { label: 'Connectors',   href: '/dashboard/client/connectors' },
    { label: 'Settings',     href: '/dashboard/client/settings' },
  ],
}

const ROLE_COLOR: Record<UserRole, string> = {
  client:    '#C6A664',  // gold — primary
  creator:   '#5E8B84',  // muted teal
  admin:     '#7A2E32',  // deep wine
  personal:  '#B5764A',  // muted terracotta
  affiliate: '#C9974A',  // muted honey
  collective:'#8B7AA8',  // muted violet
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = null
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null

  try {
    supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    redirect('/login')
  }

  // Middleware should already redirect unauthenticated requests before they
  // reach this layout, but that guarantee doesn't always hold (e.g. a stale
  // or just-expired refresh token can pass middleware's cookie check and
  // still fail here) -- confirmed via prod runtime errors: "TypeError:
  // Cannot read properties of null (reading 'id')" on this exact line,
  // 11 occurrences on /dashboard/admin/settings. Redirect defensively
  // instead of trusting the non-null assertion.
  if (!user || !supabase) {
    redirect('/login')
  }

  // Service-role client for role/plan lookups. The anon-key client cannot
  // reliably load a session from this app's sign-in cookie (raw JWT in
  // sb-*-auth-token), so RLS-gated queries on `users`/`clients` run
  // anonymous, get silently blocked by RLS, and this layout used to fall
  // back to 'client' -- overriding the already-correct role that proxy.ts's
  // middleware just computed with its own service-role client (see
  // proxy.ts / lib/supabase/middleware.ts createAdminClient). That
  // disagreement is what caused the flash-dashboard-then-bounce-to-pricing
  // behavior: middleware lets the request through, then this layout's own
  // broken check immediately redirected it back out.
  const serviceClient = createServiceClient()

  const { data: identity, error: identityError } = await serviceClient
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (identityError) {
    console.warn('Dashboard layout role lookup failed:', identityError.message)
  }

  const userRole = (identity?.role as UserRole) ?? 'client'
  const name = identity?.full_name ?? user.email?.split('@')[0] ?? 'User'

  // Fetch client record to get plan_tier_key (reflects what user actually paid for)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clientRecord: any = null
  let rlsError = false
  try {
    const { data, error } = await serviceClient
      .from('clients')
      .select('id, business_name, full_name, display_name, plan_tier_key, additional_plans, addons, status, metadata')
      .eq('id', user.id)
      .maybeSingle()
    if (error) {
      console.warn('Plan guard query failed (RLS?):', error.message)
      rlsError = true
    } else {
      clientRecord = data
    }
  } catch (e) {
    console.warn('Plan guard exception:', e)
    rlsError = true
  }

  // Admin always wins, regardless of plan_tier_key -- previously planRole was
  // checked first, which meant any admin who *also* had a purchased plan
  // (e.g. users.role='admin' but clients.plan_tier_key='creator_concierge')
  // got silently demoted to their plan's role on every login. Confirmed live
  // on desire1319@yahoo.com: users.role was already 'admin' but plan_tier_key
  // 'creator_concierge' overrode it every time.
  const planRole = deriveRoleFromPlanTier(clientRecord?.plan_tier_key)
  const role: UserRole = userRole === 'admin' ? 'admin' : (planRole ?? userRole)

  // Per-client dashboard URLs: rewrite any nav link under /dashboard/client/*
  // to the viewer's OWN keyed dashboard (each client's sections now live at
  // /dashboard/client/{slug}--{id}/...). Admins/org-members viewing another
  // client keep their own nav shell; the page content targets the viewed client.
  const ownClientKey = clientRecord ? buildClientKey(clientRecord) : ''
  const keyedNav = NAV[role].map((item) => {
    if (item.href === '/dashboard/client' && ownClientKey) {
      return { ...item, href: `/dashboard/client/${ownClientKey}` }
    }
    if (item.href.startsWith('/dashboard/client/') && ownClientKey) {
      return { ...item, href: item.href.replace('/dashboard/client/', `/dashboard/client/${ownClientKey}/`) }
    }
    return item
  })

  // Plan guard: non-admin dashboard access requires at least one active plan.
  if (role !== 'admin') {
    if (!rlsError) {
      const status = clientRecord?.status ?? ''
      const approvedByAdmin = ['approved', 'admin_approved'].includes(status)
      const hasBasePlan = !!clientRecord?.plan_tier_key
      const hasAdditionalPlans = Array.isArray(clientRecord?.additional_plans) && clientRecord.additional_plans.length > 0
      const hasAddons = Array.isArray(clientRecord?.addons) && clientRecord.addons.length > 0
      const hasAnyPlan = hasBasePlan || hasAdditionalPlans || hasAddons
      const paidAccess = status === 'active' && hasAnyPlan
      const isTestAccount = clientRecord?.metadata?.is_test_account === true
      const isOnboarding = ['onboarding', 'pending', 'pending_approval'].includes(status)
      const hasIntakeData = !!clientRecord?.metadata?.intake?.sections?.results

      if (!paidAccess && !approvedByAdmin && !isTestAccount && !isOnboarding && !hasIntakeData) {
        const requestedPlan = typeof clientRecord?.metadata?.requested_plan_tier_key === 'string' ? clientRecord.metadata.requested_plan_tier_key : ''
        if (requestedPlan && requestedPlan !== 'personal_free') {
          redirect(`/onboarding?tier=${encodeURIComponent(requestedPlan)}&reason=payment_required`)
        }
        const userPath = role === 'client' ? 'client' : role === 'creator' ? 'creator' : role === 'personal' ? 'personal' : role === 'affiliate' ? 'affiliate' : 'client'
        redirect(`/pricing?path=${userPath}&reason=complete_signup`)
      }
    }
  }
  const color = ROLE_COLOR[role]
  const nav = keyedNav

  return (
    <div className="flex min-h-screen bg-[#0A0A0B]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-white/[0.06] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <Link href="/">
            <Image src="/logo.JPG" alt="Evolved Eden" width={100} height={24} className="object-contain" />
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color }}>
            {role}
          </div>
          <div className="text-sm text-white/60 truncate">{name}</div>
        </div>

        {/* Nav */}
        <SidebarNav nav={nav} color={color} />

        {/* Bottom */}
        <div className="px-6 py-4 border-t border-white/[0.06]">
          <form action="/api/auth/signout" method="post">
            <button className="text-xs text-white/20 hover:text-white/50 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="text-xs text-white/20 tracking-widest uppercase">
            <Image src="/logo.JPG" alt="" width={60} height={14} className="object-contain inline-block -mt-0.5 opacity-60" /> / <span style={{ color }}>{role}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: color }} />
            <span className="text-xs text-white/30">RI Online</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
