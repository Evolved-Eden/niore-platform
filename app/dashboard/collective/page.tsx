import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import EssenceBoard from '@/components/EssenceBoard'
import UpgradePanel from '@/components/UpgradePanel'

/**
 * Collective Overview -- distinct from Business/Creator/Personal in one
 * structural way: a Collective can be 2 people or 1000. Individual-level
 * stat cards ("Sarah completed 3 tasks") don't scale to 1000 -- so this
 * page shows aggregate bands and utilization percentages instead of raw
 * per-person detail, with drill-down available via Members/Workstations.
 */
export default async function CollectiveDashboard() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  const user = _user!

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, organization_id')
    .eq('id', user.id)
    .single()

  const name = profile?.full_name ?? user.email?.split('@')[0] ?? 'there'
  const orgId = profile?.organization_id ?? null

  // Resolve the Collective's tier entitlements (member/workstation/seat caps)
  const { data: clientRow } = await supabaseAdmin
    .from('clients')
    .select('plan_tier_key')
    .eq('id', user.id)
    .maybeSingle()

  let entitlements: { max_members: number | null; max_workstations: number | null; max_concurrent_seats: number | null } | null = null
  if (clientRow?.plan_tier_key) {
    const { data } = await supabaseAdmin
      .from('tier_entitlements')
      .select('max_members, max_workstations, max_concurrent_seats')
      .eq('plan_key', clientRow.plan_tier_key)
      .maybeSingle()
    entitlements = data
  }

  const [{ count: memberCount }, { count: workstationCount }] = await Promise.all([
    orgId
      ? supabaseAdmin.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active')
      : Promise.resolve({ count: 0 }),
    orgId
      ? supabaseAdmin.from('departments').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active')
      : Promise.resolve({ count: 0 }),
  ])

  const memberPct = entitlements?.max_members ? Math.min(100, Math.round(((memberCount ?? 0) / entitlements.max_members) * 100)) : null
  const workstationPct = entitlements?.max_workstations ? Math.min(100, Math.round(((workstationCount ?? 0) / entitlements.max_workstations) * 100)) : null

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
          Collective <span className="text-[#C6A664]">Hub</span>
        </h1>
        <p className="text-white/30 text-sm">Welcome back, {name}</p>
      </div>

      <div className="mb-8">
        <div className="text-xs text-[#C6A664] tracking-widest uppercase font-medium mb-3">
          Zuri's Direction For Your Collective
        </div>
        <EssenceBoard userId={user.id} userRole="collective" />
      </div>

      {/* Utilization strip -- bands/percentages, not per-person detail, so this
          reads the same whether the Collective has 4 members or 400. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Members</div>
          <div className="text-2xl font-light text-[#C6A664]">
            {memberCount ?? 0}{entitlements?.max_members ? <span className="text-white/30 text-base"> / {entitlements.max_members}</span> : null}
          </div>
          {memberPct !== null && (
            <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-[#C6A664]" style={{ width: `${memberPct}%` }} />
            </div>
          )}
        </div>
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Workstations</div>
          <div className="text-2xl font-light text-[#C9974A]">
            {workstationCount ?? 0}{entitlements?.max_workstations ? <span className="text-white/30 text-base"> / {entitlements.max_workstations}</span> : null}
          </div>
          {workstationPct !== null && (
            <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-[#C9974A]" style={{ width: `${workstationPct}%` }} />
            </div>
          )}
        </div>
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Concurrent Seats</div>
          <div className="text-2xl font-light text-[#8B7AA8]">
            {entitlements?.max_concurrent_seats ?? '—'}
          </div>
          <p className="text-[10px] text-white/20 mt-3">Members active across all Workstations at once</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/dashboard/client/organization" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-sm font-medium text-white mb-1">Manage Members</div>
          <p className="text-xs text-white/40">Invite, remove, and set roles across your Collective</p>
        </Link>
        <Link href="/dashboard/collective/workstations" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-sm font-medium text-white mb-1">Workstations</div>
          <p className="text-xs text-white/40">Breakout groups -- Board, Committees, sub-teams</p>
        </Link>
        <Link href="/dashboard/collective/governance" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-sm font-medium text-white mb-1">Governance</div>
          <p className="text-xs text-white/40">Roles, voting, approvals, and decision logs</p>
        </Link>
        <Link href="/dashboard/client/workforce" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-sm font-medium text-white mb-1">Workforce</div>
          <p className="text-xs text-white/40">Shared Employees, Teams, and Depts</p>
        </Link>
      </div>

      <UpgradePanel currentRole="collective" />
    </div>
  )
}
