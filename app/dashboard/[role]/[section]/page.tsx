import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { UserRole } from '@/types'
import { deriveRoleFromPlanTier } from '@/types'

const SECTION_META: Record<UserRole, Record<string, { title: string; description: string }>> = {
  client: {
    twin: {
      title: 'My Twin',
      description: 'View and tune your AI-synthesized digital intelligence.',
    },
    'essence-profile': {
      title: 'Profile',
      description: 'Review your intelligence, assessment results, and deployment modules.',
    },
    vault: {
      title: 'Intelligence Vault',
      description: 'Manage secure knowledge, documents, memories, and context.',
    },
    settings: {
      title: 'Client Settings',
      description: 'Update your profile, workspace preferences, and account details.',
    },
  },
  creator: {
    intelligences: {
      title: 'Content Studio',
      description: 'Build, schedule, and publish your intelligence content.',
    },
    analytics: {
      title: 'Analytics',
      description: 'Review audience, engagement, and performance metrics.',
    },
    payouts: {
      title: 'Payouts',
      description: 'View revenue summaries and payout history.',
    },
    settings: {
      title: 'Creator Settings',
      description: 'Update your creator profile and workspace preferences.',
    },
  },
  admin: {
    users: {
      title: 'User Management',
      description: 'Manage users, roles, and platform access.',
    },
    agents: {
      title: 'Agent Registry',
      description: 'Deploy, monitor, and maintain your intelligence agents.',
    },
    engines: {
      title: 'Engine Dashboard',
      description: 'Inspect active engines and system performance.',
    },
    logs: {
      title: 'System Logs',
      description: 'Review platform events and audit history.',
    },
  },
  personal: {
    profile: {
      title: 'Profile',
      description: 'Manage your personal profile and preferences.',
    },
    settings: {
      title: 'Personal Settings',
      description: 'Account, privacy, and notification settings.',
    },
  },
  affiliate: {
    referrals: {
      title: 'Referrals',
      description: 'Track your affiliate links and referred users.',
    },
    payouts: {
      title: 'Payouts',
      description: 'View commission history and payouts.',
    },
    settings: {
      title: 'Affiliate Settings',
      description: 'Manage your affiliate profile and payout preferences.',
    },
  },
  collective: {
    members: {
      title: 'Members',
      description: 'Manage roles, invitations, and permissions across your Collective.',
    },
    governance: {
      title: 'Governance',
      description: 'Roles, voting, approvals, and decision logs.',
    },
    settings: {
      title: 'Collective Settings',
      description: 'Manage your Collective profile, workstations, and preferences.',
    },
  },
}

export default async function DashboardSectionPage({ params }: { params: Promise<{ role: string; section: string }> }) {
  const { role: roleParam, section } = await params
  const role = roleParam as UserRole
  const roleMeta = SECTION_META[role]
  if (!roleMeta) return notFound()

  const sectionMeta = roleMeta[section]
  if (!sectionMeta) return notFound()

  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  // Guaranteed non-null by root middleware
  const user = _user!

  const { data: identity } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = identity?.role as UserRole | undefined
  if (!userRole) redirect('/dashboard/client')

  // Derive role from plan_tier_key first (what they paid for), fall back to users.role
  const { data: clientRecord } = await supabase
    .from('clients')
    .select('plan_tier_key')
    .eq('id', user.id)
    .maybeSingle()
  // Admin always wins regardless of plan_tier_key (same fix as
  // app/dashboard/layout.tsx and app/dashboard/page.tsx).
  const planRole = deriveRoleFromPlanTier(clientRecord?.plan_tier_key)
  const currentRole = userRole === 'admin' ? 'admin' : (planRole ?? userRole)

  if (currentRole !== role) redirect(`/dashboard/${currentRole}`)

  return (
    <div className="max-w-5xl mx-auto animate-fade-in py-4">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">{sectionMeta.title}</h1>
        <p className="text-white/40 text-sm">{sectionMeta.description}</p>
      </div>

      <div className="glass rounded-sm p-8 border border-white/[0.06]">
        <p className="text-white/60 text-sm leading-relaxed mb-6">
          This area is still under development. You can return to your dashboard to continue working with your intelligence tools.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/dashboard/${role}`}
            className="block rounded-sm border border-white/[0.08] bg-white/5 px-5 py-4 text-sm text-white/80 hover:border-white/[0.12] hover:bg-white/10 transition"
          >
            Back to {role.charAt(0).toUpperCase() + role.slice(1)} dashboard
          </Link>
          <Link
            href="/dashboard"
            className="block rounded-sm border border-white/[0.08] bg-[#C6A664]/10 px-5 py-4 text-sm text-[#C6A664] hover:border-[#C6A664]/20 hover:bg-[#C6A664]/15 transition"
          >
            Return to Dashboard Hub
          </Link>
        </div>
      </div>
    </div>
  )
}
