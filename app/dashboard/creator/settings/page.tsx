import { createClient } from '@/lib/supabase/server'

export default async function CreatorSettingsPage() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  // Guaranteed non-null by root middleware
  const user = _user!

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, role, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Creator Settings</h1>
        <p className="text-white/30 text-sm">Update your creator profile and workspace preferences</p>
      </div>

      <div className="glass rounded-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <span className="text-xs text-white/30 tracking-widest uppercase">Profile</span>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <div className="text-xs text-white/30 tracking-widest uppercase mb-1">Full Name</div>
            <div className="text-sm text-white/80">{profile?.full_name ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-white/30 tracking-widest uppercase mb-1">Email</div>
            <div className="text-sm text-white/80">{profile?.email ?? user?.email ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-white/30 tracking-widest uppercase mb-1">Role</div>
            <div className="text-sm text-[#5E8B84]">{profile?.role ?? 'creator'}</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <span className="text-xs text-white/30 tracking-widest uppercase">Preferences</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/80">Email Notifications</div>
              <div className="text-xs text-white/30">Receive updates about your content and payouts</div>
            </div>
            <div className="w-10 h-5 rounded-full bg-white/10 relative cursor-pointer">
              <div className="w-3.5 h-3.5 rounded-full bg-[#5E8B84] absolute top-0.5 right-0.5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/80">Analytics Digest</div>
              <div className="text-xs text-white/30">Weekly performance summary via email</div>
            </div>
            <div className="w-10 h-5 rounded-full bg-white/10 relative cursor-pointer">
              <div className="w-3.5 h-3.5 rounded-full bg-white/30 absolute top-0.5 left-0.5" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <span className="w-2 h-2 rounded-full bg-[#5E8B84] animate-pulse-slow" />
          Settings are read-only in this preview
        </div>
      </div>
    </div>
  )
}
