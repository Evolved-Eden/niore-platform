import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PersonalSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-6">Personal Settings</h1>
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <p className="text-sm text-white/40">Account settings and preferences coming soon.</p>
      </div>
    </div>
  )
}
