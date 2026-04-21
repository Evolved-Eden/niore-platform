import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: citizen } = await supabase
    .from('ris_citizens')
    .select('*')
    .eq('supabase_user_id', user.id)
    .single()

  const stats = [
    { label: 'OmniScore',    value: citizen?.omni_score  ?? '—', color: '#c8ff00' },
    { label: 'AXIS Balance', value: citizen?.axis_balance ?? '—', color: '#00d4ff' },
    { label: 'Active Twins', value: '1',                          color: '#a78bfa' },
  ]

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
          Welcome back, <span className="text-[#c8ff00]">{citizen?.display_name ?? 'Citizen'}</span>
        </h1>
        <p className="text-white/30 text-sm">Your intelligence ecosystem</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-sm p-5">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">{s.label}</div>
            <div className="text-3xl font-light" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Zuri CTA */}
      <div className="glass rounded-sm p-6 mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-white/30 tracking-widest uppercase mb-1">Your AI Twin</div>
          <div className="text-white font-medium">Zuri is online and ready</div>
          <div className="text-white/30 text-sm mt-1">Ask anything, automate anything.</div>
        </div>
        <a
          href="/dashboard/client/zuri"
          className="px-5 py-2.5 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-colors flex-shrink-0"
        >
          Open Zuri →
        </a>
      </div>

      {/* Intelligence status */}
      <div className="glass rounded-sm p-6">
        <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Intelligence Monitor</div>
        <div className="flex items-center gap-3 text-sm text-white/40">
          <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse-slow" />
          No active intelligences deployed yet. Build your first in the Exchange.
        </div>
      </div>
    </div>
  )
}
