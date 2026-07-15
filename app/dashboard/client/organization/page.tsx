import { createClient } from '@/lib/supabase/server'
import InviteMemberForm from './InviteMemberForm'
import MemberActions from './MemberActions'
import RegistryPermissionToggle from './RegistryPermissionToggle'

// Human org members. Not to be confused with "My Teams" (AI Teams/Swarms) —
// this page is people, that one is deployed intelligence.
export default async function OrganizationPage() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  const user = _user!

  const { data: myMembership } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, allow_member_registry_listing)')
    .eq('user_id', user.id)
    .maybeSingle()

  const organizationId = (myMembership as any)?.organization_id ?? null
  const orgName = (myMembership as any)?.organizations?.name ?? null
  const myRole = (myMembership as any)?.role ?? null
  const allowRegistryListing = !!(myMembership as any)?.organizations?.allow_member_registry_listing

  let members: Array<Record<string, any>> = []
  if (organizationId) {
    const { data } = await supabase
      .from('organization_members')
      .select('id, user_id, role, status, title_key, custom_title, invited_at, joined_at, users(full_name, email, avatar_url), titles(label)')
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: true })
    members = data ?? []
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
          Your <span className="text-[#C6A664]">Organization</span>
        </h1>
        <p className="text-white/30 text-sm">
          {orgName ? `${orgName} — the people on your account` : 'The people on your account'}
        </p>
      </div>

      {!organizationId ? (
        <div className="glass rounded-sm p-8 text-center">
          <p className="text-sm text-white/50 mb-4">
            You don't have an organization set up yet. Create one to invite other people
            onto your account — separate from your AI Teams, which are under{' '}
            <span className="text-[#C6A664]">My Teams</span>.
          </p>
          <InviteMemberForm organizationId={null} />
        </div>
      ) : (
        <>
          <div className="glass rounded-sm overflow-hidden mb-6">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs text-white/30 tracking-widest uppercase">
                Members ({members.length})
              </span>
              {myRole === 'owner' || myRole === 'admin' ? (
                <span className="text-[10px] text-white/20">You can invite new members below</span>
              ) : null}
            </div>
            <div className="divide-y divide-white/[0.04]">
              {members.map((m) => {
                const name = m.users?.full_name || m.users?.email || 'Pending invite'
                const title = m.custom_title || m.titles?.label || m.role
                const statusColor =
                  m.status === 'active' ? '#C6A664' : m.status === 'invited' || m.status === 'pending' ? '#8B7AA8' : '#A8A29A'
                return (
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/80">{name}</div>
                      <div className="text-xs text-white/30">{title}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm"
                        style={{ color: statusColor, backgroundColor: `${statusColor}1a`, border: `1px solid ${statusColor}33` }}
                      >
                        {m.status || 'active'}
                      </span>
                      {(myRole === 'owner' || myRole === 'admin') && m.user_id !== user.id && (
                        <MemberActions memberId={m.id} memberName={name} />
                      )}
                    </div>
                  </div>
                )
              })}
              {members.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-white/30">
                  No members yet — invite the first one below.
                </div>
              )}
            </div>
          </div>

          {(myRole === 'owner' || myRole === 'admin') && (
            <div className="glass rounded-sm p-6 mb-6">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Twin Registry</div>
              <RegistryPermissionToggle organizationId={organizationId} initialValue={allowRegistryListing} />
            </div>
          )}

          {(myRole === 'owner' || myRole === 'admin') && (
            <div className="glass rounded-sm p-6">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Invite Someone</div>
              <InviteMemberForm organizationId={organizationId} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
