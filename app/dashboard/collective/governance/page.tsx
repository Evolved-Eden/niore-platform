import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Governance v1 -- roles and a read-only activity log. Voting/approvals
 * workflows are a real, separate feature (ballot creation, quorum rules,
 * vote tallying) not built here -- this establishes the page and the roles
 * view so Governance has a real home, without pretending a full voting
 * system exists yet.
 */
export default async function CollectiveGovernancePage() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  const user = _user!

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const orgId = profile?.organization_id ?? null

  const { data: members } = orgId
    ? await supabaseAdmin
        .from('organization_members')
        .select('id, user_id, role, title_key, custom_title, status, joined_at')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
    : { data: [] }

  const roleCounts = (members ?? []).reduce<Record<string, number>>((acc, m) => {
    const role = m.role ?? 'member'
    acc[role] = (acc[role] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Governance</h1>
        <p className="text-white/40 text-sm mt-1">Roles and activity across your Collective</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className="glass rounded-sm border border-white/[0.06] px-4 py-3">
            <div className="text-lg font-light text-[#C6A664]">{count}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">{role}</div>
          </div>
        ))}
        {(!members || members.length === 0) && (
          <p className="text-sm text-white/30">No active members yet.</p>
        )}
      </div>

      <div className="glass rounded-sm border border-white/[0.06] p-5 mb-8">
        <h2 className="font-display font-semibold text-white mb-1">Voting &amp; Approvals</h2>
        <p className="text-xs text-white/40">
          Not built yet -- this is a real, separate feature (ballot creation, quorum rules, tallying) rather than
          something to fake here. Roles and member activity below are real.
        </p>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-white mb-4">Members by Role</h2>
        {members && members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Role</th>
                  <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Title</th>
                  <th className="px-4 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {members.map((m: any) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-sm text-white/80">{m.role ?? 'member'}</td>
                    <td className="px-4 py-3 text-sm text-white/50">{m.custom_title ?? m.title_key ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-white/50">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-white/30">Invite members from the Members page to see them here.</p>
        )}
      </div>
    </div>
  )
}
