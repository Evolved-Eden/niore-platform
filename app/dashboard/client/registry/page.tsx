import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ListingForm from './ListingForm'

export default async function TwinRegistryPage() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  const user = _user!

  const [myTwinsRes, listingsRes] = await Promise.all([
    supabaseAdmin
      .from('client_twins')
      .select('id, organization_id, is_independent, is_listed, listing_visibility, listing_headline, listing_skills, metadata')
      .eq('client_id', user.id),
    supabaseAdmin
      .from('client_twins')
      .select('id, listing_headline, listing_skills, listing_visibility, essence_score, intelligence_score, organizations:organization_id(name)')
      .eq('is_listed', true)
      .order('listed_at', { ascending: false })
      .limit(30),
  ])

  const myTwins = myTwinsRes.data || []
  const myTwinIds = new Set(myTwins.map((t) => t.id))

  // A twin is eligible to list if it has no active org, the person owns
  // that org, or the org has opened Registry listing to all members.
  const eligibility = await Promise.all(
    myTwins.map(async (t) => {
      if (!t.organization_id) return { ...t, eligible: true, reason: null as string | null }
      const [{ data: membership }, { data: org }] = await Promise.all([
        supabaseAdmin
          .from('organization_members')
          .select('role')
          .eq('organization_id', t.organization_id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabaseAdmin
          .from('organizations')
          .select('allow_member_registry_listing')
          .eq('id', t.organization_id)
          .maybeSingle(),
      ])
      const eligible = membership?.role === 'owner' || !!org?.allow_member_registry_listing
      return {
        ...t,
        eligible,
        reason: eligible ? null : "Your org hasn't opened Registry listing to members — detach, leave, or purchase a separate independent Twin to list instead.",
      }
    })
  )

  const listings = (listingsRes.data || []).map((t: any) => ({
    id: t.id,
    headline: t.listing_headline,
    skills: t.listing_skills || [],
    blueprintScore: t.essence_score,
    intelligenceScore: t.intelligence_score,
    trainedAt: t.listing_visibility === 'named' ? t.organizations?.name ?? null : null,
    isMine: myTwinIds.has(t.id),
  }))

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
          The Twin <span className="text-[#C6A664]">Registry</span>
        </h1>
        <p className="text-white/30 text-sm">
          Trained Twins, available to hire — entirely opt-in, by the people who built them.
        </p>
      </div>

      {eligibility.length > 0 && (
        <div className="space-y-4 mb-8">
          {eligibility.map((t) => (
            <div key={t.id} className="glass rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-white/30 tracking-widest uppercase">
                  {t.is_independent ? 'Independent Twin' : t.organization_id ? 'Org Twin' : 'Your Twin'}
                </div>
                {!t.eligible && (
                  <span className="text-[10px] text-[#8B7AA8]">Not listable yet</span>
                )}
              </div>
              {t.eligible ? (
                <ListingForm
                  twinId={t.id}
                  initial={{
                    isListed: t.is_listed,
                    visibility: (t.listing_visibility || 'anonymous') as 'anonymous' | 'named',
                    headline: t.listing_headline || '',
                    skills: t.listing_skills || [],
                  }}
                />
              ) : (
                <p className="text-sm text-white/40">{t.reason}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-sm overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs text-white/30 tracking-widest uppercase">
            Available Now ({listings.length})
          </span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {listings.map((l) => (
            <div key={l.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/80">{l.headline || 'Trained Twin available'}</p>
                  {l.trainedAt && <p className="text-xs text-[#8B7AA8] mt-0.5">Trained at {l.trainedAt}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {l.skills.map((s: string) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/50">{s}</span>
                    ))}
                  </div>
                </div>
                {l.isMine && (
                  <span className="text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm text-[#C6A664] bg-[#C6A664]/10 border border-[#C6A664]/20 shrink-0">
                    Your listing
                  </span>
                )}
              </div>
            </div>
          ))}
          {listings.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-white/30">
              No one's listed yet — be the first.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
