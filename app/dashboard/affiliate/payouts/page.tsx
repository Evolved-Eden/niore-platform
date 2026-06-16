import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AffiliatePayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-2">Payouts</h1>
      <p className="text-white/30 text-sm mb-6">View commission history and payouts</p>
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <p className="text-sm text-white/40">Your payout history will appear here once you start earning commissions.</p>
      </div>
    </div>
  )
}
