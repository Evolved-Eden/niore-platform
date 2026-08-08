import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EssenceBoard from '@/components/EssenceBoard'
import UpgradePanel from '@/components/UpgradePanel'
import CopyLink from '@/components/CopyLink'
import { ensureAffiliateLink, affiliateLinkUrl } from '@/lib/affiliate'

export default async function AffiliateDashboard() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  const user = _user!

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Ensure the user has a referral link (auto-created on signup; this is a
  // safety net for users who signed up before auto-generation shipped).
  const myLink = await ensureAffiliateLink({
    userId: user.id,
    name: profile?.full_name ?? user.email?.split('@')[0] ?? null,
    client: supabase,
  })

  const { data: myLinks } = await supabase
    .from('affiliate_links')
    .select('id')
    .eq('owner_user_id', user.id)

  const linkIds = (myLinks || []).map(l => l.id)

  const { count: activeReferrals } = linkIds.length
    ? await supabase
        .from('affiliate_link_events')
        .select('id', { count: 'exact', head: true })
        .in('affiliate_link_id', linkIds)
        .eq('event_type', 'conversion')
    : { count: 0 }

  const { data: accruals } = linkIds.length
    ? await supabase
        .from('affiliate_commission_accruals')
        .select('commission_amount, status')
        .in('affiliate_link_id', linkIds)
        .in('status', ['approved', 'paid'])
    : { data: [] }

  const commissionEarned = (accruals || []).reduce((sum, a) => sum + Number(a.commission_amount || 0), 0)

  const name = profile?.full_name ?? user.email?.split('@')[0] ?? 'Partner'

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
          Affiliate <span className="text-[#C9974A]">Hub</span>
        </h1>
        <p className="text-white/30 text-sm">Welcome back, {name}</p>
      </div>

      {myLink?.code && (
        <CopyLink
          value={affiliateLinkUrl(myLink.code)}
          label="Your Referral Link"
        />
      )}

      <div className="mb-8">
        <div className="text-xs text-[#C9974A] tracking-widest uppercase font-medium mb-3">
          Zuri's Direction For You
        </div>
        <EssenceBoard userId={user.id} userRole="affiliate" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Referrals', value: String(activeReferrals ?? 0), color: '#C9974A' },
          { label: 'Commission Earned', value: `$${commissionEarned.toFixed(2)}`, color: '#C6A664' },
          { label: 'Partner Rank', value: 'Active', color: '#8B7AA8' },
        ].map(s => (
          <div key={s.label} className="glass rounded-sm p-5">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">{s.label}</div>
            <div className="text-2xl font-light" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/dashboard/affiliate/referrals" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#C9974A] tracking-widest uppercase mb-2">Referrals</div>
          <p className="text-sm text-white/40">Track your affiliate links and referrals</p>
        </Link>
        <Link href="/dashboard/affiliate/payouts" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#C6A664] tracking-widest uppercase mb-2">Payouts</div>
          <p className="text-sm text-white/40">View commission history and payouts</p>
        </Link>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <span className="w-2 h-2 rounded-full bg-[#C9974A] animate-pulse-slow" />
          Affiliate program active — more features coming soon
        </div>
      </div>

      <div className="mt-8">
        <UpgradePanel currentRole="affiliate" />
      </div>
    </div>
  )
}
