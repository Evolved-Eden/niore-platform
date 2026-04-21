import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CreatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: citizen } = await supabase
    .from('ris_citizens')
    .select('*')
    .eq('supabase_user_id', user.id)
    .single()

  const { data: intelligences } = await supabase
    .from('intelligences')
    .select('id, name, status, vertical, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const stats = [
    { label: 'Intelligences', value: intelligences?.length ?? 0,  color: '#00d4ff' },
    { label: 'AXIS Earned',   value: citizen?.axis_balance ?? '—', color: '#c8ff00' },
    { label: 'OmniScore',     value: citizen?.omni_score   ?? '—', color: '#a78bfa' },
    { label: 'Rank',          value: citizen?.rank         ?? '—', color: '#fb923c' },
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
        <p className="text-white/30 text-sm">Build, deploy, and monetize your intelligences</p>
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

      {/* Intelligences table */}
      <div className="glass rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/30 tracking-widest uppercase">Your Intelligences</span>
          <button className="text-xs text-[#00d4ff] hover:text-white transition-colors">
            + New Intelligence
          </button>
        </div>

        {intelligences && intelligences.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Name', 'Vertical', 'Status', 'Created'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs text-white/20 font-normal tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {intelligences.map(intel => (
                <tr key={intel.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white/80 font-medium">{intel.name}</td>
                  <td className="px-6 py-4">
                    {intel.vertical && (
                      <span className="text-xs px-2 py-1 rounded-full border"
                        style={{
                          color: VERTICAL_COLOR[intel.vertical] ?? '#fff',
                          borderColor: `${VERTICAL_COLOR[intel.vertical]}30` ?? 'rgba(255,255,255,0.1)',
                          background: `${VERTICAL_COLOR[intel.vertical]}10` ?? 'transparent',
                        }}>
                        {intel.vertical.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      intel.status === 'active'
                        ? 'bg-[#c8ff00]/10 text-[#c8ff00]'
                        : 'bg-white/5 text-white/30'
                    }`}>
                      {intel.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/30 text-xs">
                    {new Date(intel.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-white/20 text-sm">
            No intelligences yet.{' '}
            <span className="text-[#00d4ff] cursor-pointer hover:underline">
              Create your first one →
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
