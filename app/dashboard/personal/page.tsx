import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EssenceBoard from '@/components/EssenceBoard'

export default async function PersonalDashboard() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  // Guaranteed non-null by root middleware
  const user = _user!

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
          Personal <span className="text-[#B5764A]">Hub</span>
        </h1>
        <p className="text-white/30 text-sm">Welcome back, {name}</p>
      </div>

      {/* Essence Board — center stage, same as every other dashboard */}
      <div className="mb-8">
        <div className="text-xs text-[#B5764A] tracking-widest uppercase font-medium mb-3">
          Zuri's Direction For You
        </div>
        <EssenceBoard userId={user.id} userRole="personal" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Daily Essence', value: 'Active', color: '#B5764A' },
          { label: 'My Agents', value: '—', color: '#C6A664' },
          { label: 'AI Twin Status', value: 'Ready', color: '#8B7AA8' },
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
          <div className="text-xs text-[#B5764A] tracking-widest uppercase mb-2">Zuri</div>
          <p className="text-sm text-white/40">Your personal intelligence concierge</p>
        </Link>
        <Link href="/dashboard/client/essence" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#C6A664] tracking-widest uppercase mb-2">Daily Essence</div>
          <p className="text-sm text-white/40">Your daily intelligence brief</p>
        </Link>
        <Link href="/dashboard/personal/profile" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#8B7AA8] tracking-widest uppercase mb-2">Profile</div>
          <p className="text-sm text-white/40">Manage your personal profile</p>
        </Link>
        <Link href="/dashboard/personal/settings" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#5E8B84] tracking-widest uppercase mb-2">Settings</div>
          <p className="text-sm text-white/40">Account & privacy settings</p>
        </Link>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <span className="w-2 h-2 rounded-full bg-[#B5764A] animate-pulse-slow" />
          Personal intelligence active — explore Zuri and your Daily Essence
        </div>
      </div>
    </div>
  )
}
