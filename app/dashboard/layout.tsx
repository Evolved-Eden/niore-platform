import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { UserRole } from '@/types'
import { deriveRoleFromPlanTier } from '@/types'

import SidebarNav from './_components/SidebarNav'

const NAV: Record<UserRole, { label: string; href: string }[]> = {
  client: [
    { label: 'Overview',     href: '/dashboard/client' },
    { label: 'Profile',      href: '/dashboard/client/profile' },
    { label: 'Intake',       href: '/intake' },
    { label: 'Blueprint',    href: '/dashboard/client/blueprint' },
    { label: 'Assessment',   href: '/dashboard/client/blueprint/assess' },
    { label: 'Essence Intel',href: '/dashboard/client/essence' },
    { label: 'My Agents',    href: '/dashboard/client/agents' },
    { label: 'My Swarms',    href: '/dashboard/client/swarms' },
    { label: 'My Twin',      href: '/dashboard/client/twin' },
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
    { label: 'Blueprint',      href: '/dashboard/client/blueprint' },
    { label: 'Assessment',     href: '/dashboard/client/blueprint/assess' },
    { label: 'Essence Intel',  href: '/dashboard/client/essence' },
    { label: 'Intelligences',  href: '/dashboard/creator/intelligences' },
    { label: 'My Agents',      href: '/dashboard/client/agents' },
    { label: 'My Swarms',      href: '/dashboard/client/swarms' },
    { label: 'My Twin',        href: '/dashboard/client/twin' },
    { label: 'Analytics',      href: '/dashboard/creator/analytics' },
    { label: 'Payouts',        href: '/dashboard/creator/payouts' },
    { label: 'Settings',       href: '/dashboard/creator/settings' },
  ],
  admin: [
    { label: 'Overview',       href: '/dashboard/admin' },
    { label: 'Intake',         href: '/intake' },
    { label: 'My Blueprint',   href: '/dashboard/admin/blueprint' },
    { label: 'Assessment',     href: '/dashboard/client/blueprint/assess' },
    { label: 'Essence Intel',  href: '/dashboard/admin/essence' },
    { label: 'My Agents',      href: '/dashboard/admin/my-agents' },
    { label: 'My Swarms',      href: '/dashboard/admin/my-swarms' },
    { label: 'My Twin',        href: '/dashboard/admin/twin' },
    { label: 'Chat / Prompt',  href: '/dashboard/chat' },
    { label: '── System ──',   href: '#' },
    { label: 'Users',          href: '/dashboard/admin/users' },
    { label: 'Clients',        href: '/dashboard/admin/clients' },
    { label: 'Pricing',        href: '/dashboard/admin/pricing' },
    { label: 'Deployments',    href: '/dashboard/admin/deployments' },
    { label: 'Verticals',      href: '/dashboard/admin/verticals' },
    { label: 'Avatars',        href: '/dashboard/admin/avatars' },
    { label: 'Agent Registry', href: '/dashboard/admin/agent-registry' },
    { label: 'Agents',         href: '/dashboard/admin/agents' },
    { label: 'Swarms',         href: '/dashboard/admin/swarms' },
    { label: 'Generators',     href: '/dashboard/admin/generators' },
    { label: 'Archetypes',     href: '/dashboard/admin/archetypes' },
    { label: 'Workflows',      href: '/dashboard/admin/workflows' },
    { label: 'Connectors',     href: '/dashboard/admin/connectors' },
    { label: 'Zuri Config',    href: '/dashboard/admin/zuri' },
    { label: 'Templates',      href: '/dashboard/admin/templates' },
    { label: 'Settings',       href: '/dashboard/admin/settings' },
  ],
  personal: [
    { label: 'My Hub',       href: '/dashboard/personal' },
    { label: 'Intake',       href: '/intake' },
    { label: 'Blueprint',    href: '/dashboard/client/blueprint' },
    { label: 'Assessment',   href: '/dashboard/client/blueprint/assess' },
    { label: 'Essence Intel',href: '/dashboard/client/essence' },
    { label: 'Profile',      href: '/dashboard/personal/profile' },
    { label: 'Settings',     href: '/dashboard/personal/settings' },
  ],
  affiliate: [
    { label: 'Overview (Aff)',href: '/dashboard/affiliate' },
    { label: 'Intake',       href: '/intake' },
    { label: 'Blueprint',    href: '/dashboard/client/blueprint' },
    { label: 'Assessment',   href: '/dashboard/client/blueprint/assess' },
    { label: 'Essence Intel',href: '/dashboard/client/essence' },
    { label: 'Referrals',    href: '/dashboard/affiliate/referrals' },
    { label: 'Payouts',      href: '/dashboard/affiliate/payouts' },
    { label: 'Settings',     href: '/dashboard/affiliate/settings' },
  ],
}

const ROLE_COLOR: Record<UserRole, string> = {
  client:    '#c8ff00',
  creator:   '#00d4ff',
  admin:     '#ff6b6b',
  personal: '#fb923c',
  affiliate: '#fb923c',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  // Guaranteed non-null by root middleware
  const user = _user!

  const { data: identity } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const userRole = (identity?.role as UserRole) ?? 'client'
  const name = identity?.full_name ?? user.email?.split('@')[0] ?? 'User'

  // Fetch client record to get plan_tier_key (reflects what user actually paid for)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clientRecord: any = null
  let rlsError = false
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('plan_tier_key, additional_plans, addons, status, metadata')
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

  // Derive role from plan_tier_key first (what they paid for), fall back to users.role
  const planRole = deriveRoleFromPlanTier(clientRecord?.plan_tier_key)
  const role: UserRole = planRole ?? (userRole === 'admin' ? 'admin' : userRole)

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
  const nav = NAV[role]

  return (
    <div className="flex min-h-screen bg-[#080810]">
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
