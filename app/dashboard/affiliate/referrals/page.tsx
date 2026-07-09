import { createClient } from '@/lib/supabase/server'

export default async function AffiliateReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-2">Referrals</h1>
      <p className="text-white/30 text-sm mb-6">Track your affiliate links and referred users</p>
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <p className="text-sm text-white/40">Your referral links and tracking data will appear here after your first referral.</p>
      </div>
    </div>
  )
}
