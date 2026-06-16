import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PersonalDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const name = profile?.full_name ?? user.email?.split('@')[0] ?? 'User'

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
          Personal <span className="text-[#fb923c]">Hub</span>
        </h1>
        <p className="text-white/30 text-sm">Welcome back, {name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Daily Essence', value: 'Active', color: '#fb923c' },
          { label: 'My Agents', value: '—', color: '#c8ff00' },
          { label: 'AI Twin Status', value: 'Ready', color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="glass rounded-sm p-5">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">{s.label}</div>
            <div className="text-2xl font-light" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/dashboard/client/zuri" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#fb923c] tracking-widest uppercase mb-2">Zuri</div>
          <p className="text-sm text-white/40">Your personal intelligence concierge</p>
        </Link>
        <Link href="/dashboard/client/essence" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#c8ff00] tracking-widest uppercase mb-2">Daily Essence</div>
          <p className="text-sm text-white/40">Your daily intelligence brief</p>
        </Link>
        <Link href="/dashboard/personal/profile" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#a78bfa] tracking-widest uppercase mb-2">Profile</div>
          <p className="text-sm text-white/40">Manage your personal profile</p>
        </Link>
        <Link href="/dashboard/personal/settings" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#34d399] tracking-widest uppercase mb-2">Settings</div>
          <p className="text-sm text-white/40">Account & privacy settings</p>
        </Link>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <span className="w-2 h-2 rounded-full bg-[#fb923c] animate-pulse-slow" />
          Personal intelligence active — explore Zuri and your Daily Essence
        </div>
      </div>
    </div>
  )
}
