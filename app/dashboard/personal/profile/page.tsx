import { createClient } from '@/lib/supabase/server'

export default async function PersonalProfilePage() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  // Guaranteed non-null by root middleware
  const user = _user!

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-6">Personal Profile</h1>
      <div className="glass rounded-sm p-6 border border-white/[0.06] space-y-4">
        <div>
          <div className="text-xs text-white/30 mb-1">Name</div>
          <div className="text-sm text-white/70">{profile?.full_name || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-white/30 mb-1">Email</div>
          <div className="text-sm text-white/70">{profile?.email || user?.email || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-white/30 mb-1">Role</div>
          <div className="text-sm text-white/70">{profile?.role || 'personal'}</div>
        </div>
      </div>
    </div>
  )
}
