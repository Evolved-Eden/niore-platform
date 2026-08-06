import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EssenceBoard from '@/components/EssenceBoard'
import UpgradePanel from '@/components/UpgradePanel'
import { buildClientKey } from '@/lib/client-dashboard'

const MOOD_COLOR: Record<string, string> = {
  great: '#5E8B84', good: '#8B7AA8', neutral: '#B5764A', low: '#7A2E32', struggling: '#7A2E32',
}

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

  // ── Real personal-layer data: journal streak/mood + deployed agents ──
  // Same pattern as Business (pipeline) and Creator (courses) last passes
  // -- replacing hardcoded "Active"/"Ready" placeholders with real numbers.
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [{ data: recentEntries }, { count: agentCount }] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('mood, created_at')
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('client_deployed_agents')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', user.id),
  ])

  const entriesThisWeek = recentEntries?.length ?? 0
  const latestMood = recentEntries?.[0]?.mood ?? null
  const { data: twin } = await supabase
    .from('client_twins')
    .select('id')
    .eq('client_id', user.id)
    .maybeSingle()

  // Own client row (self-access) → keyed client dashboard links
  const { data: ownClient } = await supabase
    .from('clients')
    .select('id, business_name, full_name')
    .eq('id', user.id)
    .maybeSingle()
  const clientPrefix = buildClientKey(ownClient) ? `/dashboard/client/${buildClientKey(ownClient)}` : ''

  const stats = [
    { label: 'Journal This Week', value: entriesThisWeek, color: '#B5764A' },
    { label: 'Deployed Agents',   value: agentCount ?? 0,  color: '#C6A664' },
    { label: 'Latest Mood',       value: latestMood ? latestMood.charAt(0).toUpperCase() + latestMood.slice(1) : '—', color: latestMood ? (MOOD_COLOR[latestMood] ?? '#8B7AA8') : '#8B7AA8' },
    { label: 'AI Twin',           value: twin ? 'Active' : 'Not Set Up', color: twin ? '#5E8B84' : '#7A2E32' },
  ]

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-sm p-5">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">{s.label}</div>
            <div className="text-2xl font-light" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {clientPrefix && (
          <Link href={`${clientPrefix}/zuri`} className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
            <div className="text-xs text-[#B5764A] tracking-widest uppercase mb-2">Zuri</div>
            <p className="text-sm text-white/40">Your personal intelligence concierge</p>
          </Link>
        )}
        {clientPrefix && (
          <Link href={`${clientPrefix}/essence`} className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
            <div className="text-xs text-[#C6A664] tracking-widest uppercase mb-2">Daily Essence</div>
            <p className="text-sm text-white/40">Your daily intelligence brief</p>
          </Link>
        )}
        {clientPrefix && (
          <Link href={`${clientPrefix}/journal`} className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
            <div className="text-xs text-[#8B7AA8] tracking-widest uppercase mb-2">Journal</div>
            <p className="text-sm text-white/40">{entriesThisWeek} {entriesThisWeek === 1 ? 'entry' : 'entries'} this week</p>
          </Link>
        )}
        <Link href="/dashboard/personal/profile" className="glass rounded-sm p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="text-xs text-[#5E8B84] tracking-widest uppercase mb-2">Profile</div>
          <p className="text-sm text-white/40">Manage your personal profile</p>
        </Link>
      </div>

      <div className="glass rounded-sm p-6 mb-8">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <span className={`w-2 h-2 rounded-full animate-pulse-slow`} style={{ backgroundColor: twin ? '#5E8B84' : '#B5764A' }} />
          {twin ? 'Personal intelligence active — explore Zuri and your Daily Essence' : 'Set up your AI Twin to unlock personalized intelligence'}
        </div>
      </div>

      <UpgradePanel currentRole="personal" />
    </div>
  )
}
