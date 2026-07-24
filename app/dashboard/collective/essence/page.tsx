import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import WrappedEssencePage from '../../client/essence/page'

/**
 * Collective's Essence Intel page. Reuses the full Essence Intelligence
 * system (daily/range items, agent deploy, matrix view -- 1300+ lines,
 * shared today across Client/Creator/Personal/Affiliate) rather than
 * rebuilding it, since that system isn't role-parameterized internally --
 * doing so would mean modifying that large shared file, a bigger and
 * riskier change than this pass should take on.
 *
 * What's genuinely Collective-specific here is the stats strip above it:
 * aggregate participation/decision metrics across the group, which don't
 * exist in the individual-focused version below.
 */
export default async function CollectiveEssencePage() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  const user = _user!

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const orgId = profile?.organization_id ?? null

  const [{ count: memberCount }, { count: activeWorkstations }] = await Promise.all([
    orgId
      ? supabaseAdmin.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active')
      : Promise.resolve({ count: 0 }),
    orgId
      ? supabaseAdmin.from('departments').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active')
      : Promise.resolve({ count: 0 }),
  ])

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 glass rounded-sm border border-white/[0.06] p-5">
        <div className="text-xs text-[#C6A664] tracking-widest uppercase font-medium mb-3">Collective Intelligence</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-lg font-light text-white">{memberCount ?? 0}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Active Members</div>
          </div>
          <div>
            <div className="text-lg font-light text-white">{activeWorkstations ?? 0}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Active Workstations</div>
          </div>
          <div>
            <div className="text-lg font-light text-white/30">—</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Decisions This Month</div>
          </div>
          <div>
            <div className="text-lg font-light text-white/30">—</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Participation Rate</div>
          </div>
        </div>
        <p className="text-[10px] text-white/20 mt-4">
          Decision and participation metrics require Governance activity to populate -- see the Governance tab.
        </p>
      </div>

      <WrappedEssencePage />
    </div>
  )
}
