import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AffiliateSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-2">Affiliate Settings</h1>
      <p className="text-white/30 text-sm mb-6">Manage your affiliate profile and payout preferences</p>
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <p className="text-sm text-white/40">Settings coming soon.</p>
      </div>
    </div>
  )
}
