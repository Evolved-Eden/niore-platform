import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CreatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('intelligence_profiles')
    .select('*')
    .eq('entity_id', user.id)
    .eq('entity_type', 'user')
    .single()

  const stats = [
    { label: 'Profile Version', value: profile?.version ?? 1,                   color: '#00d4ff' },
    { label: 'Confidence',      value: profile?.confidence_score ?? '—',         color: '#c8ff00' },
    { label: 'Daily Essence',   value: profile?.daily_essence ? 'Active' : '—', color: '#a78bfa' },
    { label: 'Status',          value: profile?.profile_kind ?? '—',            color: '#fb923c' },
  ]

  const VERTICAL_COLOR: Record<string, string> = {
    real_estate: '#fb923c',
    healthcare:  '#00d4ff',
    social:      '#a78bfa',
    corporate:   '#c8ff00',
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Creator Studio</h1>
        <p className="text-white/30 text-sm">Build, deploy, and monetize your intelligence</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-sm p-5">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">{s.label}</div>
            <div className="text-2xl font-light" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Profile section */}
      <div className="glass rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/30 tracking-widest uppercase">Your Intelligence Profile</span>
        </div>

        {profile ? (
          <div className="p-6 space-y-4">
            <div className="text-sm text-white/60">{profile.identity_summary ?? 'No identity summary yet.'}</div>
            {profile.personality_traits && (
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(profile.personality_traits as Record<string, number>).map(([trait, score]) => (
                  <div key={trait} className="glass rounded-sm p-3">
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{trait}</div>
                    <div className="text-lg text-[#c8ff00]">{(score * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-white/20 text-sm">
            No intelligence profile yet.{' '}
            <span className="text-[#00d4ff] cursor-pointer hover:underline">
              Complete your onboarding →
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
