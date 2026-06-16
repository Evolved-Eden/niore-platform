import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ClientSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <section className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-sm font-semibold mb-4">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-white/30 block mb-1">Name</span>
            <span className="text-white/80">{profile?.full_name || user.email?.split('@')[0] || '—'}</span>
          </div>
          <div>
            <span className="text-xs text-white/30 block mb-1">Email</span>
            <span className="text-white/80">{user.email}</span>
          </div>
          <div>
            <span className="text-xs text-white/30 block mb-1">Role</span>
            <span className="text-white/80 capitalize">{profile?.role || 'client'}</span>
          </div>
          <div>
            <span className="text-xs text-white/30 block mb-1">Member Since</span>
            <span className="text-white/80">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </section>

      {/* Intake Data */}
      <section className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-sm font-semibold mb-4">Intake & Design</h2>
        <p className="text-xs text-white/40 mb-4">
          Your Human Design profile and intake information. Update your design at any time.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-white/30 block mb-1">Birth Date</span>
            <span className="text-white/80">{(client as any)?.dob || '—'}</span>
          </div>
          <div>
            <span className="text-xs text-white/30 block mb-1">Birth Location</span>
            <span className="text-white/80">{(client as any)?.birth_location || '—'}</span>
          </div>
          <div>
            <span className="text-xs text-white/30 block mb-1">Human Design Type</span>
            <span className="text-white/80">{(client as any)?.hd_type || '—'}</span>
          </div>
          <div>
            <span className="text-xs text-white/30 block mb-1">Archetype</span>
            <span className="text-white/80">{(client as any)?.archetype || '—'}</span>
          </div>
        </div>
        <Link
          href="/intake"
          className="inline-block mt-4 text-xs text-[#c8ff00]/60 hover:text-[#c8ff00] transition-colors"
        >
          Update intake →
        </Link>
      </section>

      {/* Plan */}
      <section className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-sm font-semibold mb-4">Plan & Billing</h2>
        <p className="text-xs text-white/40 mb-4">Your current subscription and billing information.</p>
        <div className="text-sm">
          <span className="text-xs text-white/30 block mb-1">Current Plan</span>
          <span className="text-white/80">{(client as any)?.plan_tier || 'Free / No plan'}</span>
        </div>
        <Link
          href="/pricing"
          className="inline-block mt-4 text-xs text-[#c8ff00]/60 hover:text-[#c8ff00] transition-colors"
        >
          View plans →
        </Link>
      </section>

      {/* Danger Zone */}
      <section className="glass rounded-sm p-6 border border-red-500/20">
        <h2 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-xs text-white/40 mb-4">Irreversible actions for your account.</p>
        <button
          disabled
          className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-sm opacity-50 cursor-not-allowed"
        >
          Delete Account
        </button>
        <p className="text-[10px] text-white/20 mt-2">Contact support to delete your account</p>
      </section>
    </div>
  )
}
