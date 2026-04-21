import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ENGINES = [
  'Money','Entitlement','Governance','Exposure','CU','Rank',
  'OmniScore','Treasury','Auction','Insurance','Asset Registry','Bridge',
  'Wallet','Decay','Contraction','Audit','Risk Monitor',
  'Ownership Graph','Valuation','Compliance',
]

export default async function AdminDashboard() {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: self } = await supabase
    .from('ris_citizens')
    .select('role')
    .eq('supabase_user_id', user.id)
    .single()

  if (self?.role !== 'admin') redirect('/dashboard/client')

  const [
    { count: totalCitizens },
    { count: totalIntelligences },
    { data: recentCitizens },
  ] = await Promise.all([
    admin.from('ris_citizens').select('*', { count: 'exact', head: true }),
    admin.from('intelligences').select('*', { count: 'exact', head: true }),
    admin.from('ris_citizens')
      .select('display_name, role, omni_score, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const stats = [
    { label: 'Total Citizens',     value: totalCitizens      ?? 0,    color: '#ff6b6b' },
    { label: 'Intelligences',      value: totalIntelligences ?? 0,    color: '#c8ff00' },
    { label: 'Active Engines',     value: 20,                          color: '#00d4ff' },
    { label: 'Platform Status',    value: 'LIVE',                      color: '#a78bfa' },
  ]

  const ROLE_COLOR: Record<string, string> = {
    admin: '#ff6b6b', creator: '#00d4ff', client: 'rgba(255,255,255,0.3)'
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-10 flex items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight mb-1">OmniGrid Control</h1>
          <p className="text-white/30 text-sm">Full platform visibility — Zuri admin interface</p>
        </div>
        <span className="ml-auto text-xs px-3 py-1.5 rounded-full border border-[#ff6b6b]/30 text-[#ff6b6b] bg-[#ff6b6b]/10 tracking-widest uppercase">
          Elevated Access
        </span>
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

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Recent citizens */}
        <div className="col-span-2 glass rounded-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <span className="text-xs text-white/30 tracking-widest uppercase">Recent Citizens</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Name','Role','Score','Joined'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-white/20 font-normal tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentCitizens ?? []).map((c, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white/70">{c.display_name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs" style={{ color: ROLE_COLOR[c.role] ?? '#fff' }}>
                      {c.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#c8ff00] text-xs">{c.omni_score ?? '—'}</td>
                  <td className="px-5 py-3 text-white/30 text-xs">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Engine status */}
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-4">20 Active Engines</div>
          <div className="space-y-1.5">
            {ENGINES.map(e => (
              <div key={e} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] flex-shrink-0" />
                <span className="text-xs text-white/40">{e}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
