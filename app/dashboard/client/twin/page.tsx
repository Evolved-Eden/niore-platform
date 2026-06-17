import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EssenceBoard from '@/components/EssenceBoard'

export default async function ClientTwinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: twin } = await supabase
    .from('client_twins')
    .select('*')
    .eq('client_id', user.id)
    .single()

  const { data: identity } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const name = identity?.full_name ?? user.email?.split('@')[0] ?? 'User'
  const engagementScore = twin?.engagement_score ?? 78
  const confidenceScore = twin?.confidence_score ?? 85
  const version = twin?.version ?? 1
  const twinStatus = twin?.twin_status ?? 'active'

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          My <span className="text-[#c8ff00]">Twin</span>
        </h1>
        <p className="text-white/30 text-sm">Your AI-synthesized digital intelligence</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Twin card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity card */}
          <div className="glass rounded-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-[#c8ff00]/10 border-2 border-[#c8ff00]/30 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-[#c8ff00]">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Twin of {name}</h2>
                <p className="text-sm text-white/40">Registered Intelligence v{version}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse-slow" />
                  <span className="text-xs text-white/30 capitalize">{twinStatus} &bull; Learning</span>
                </div>
              </div>
            </div>

            {/* Intelligence Profile */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Intelligence Profile</div>
              <div className="space-y-3">
                {[
                  { label: 'Engagement', value: engagementScore, color: '#c8ff00' },
                  { label: 'Confidence', value: confidenceScore, color: '#00d4ff' },
                  { label: 'Loyalty', value: twin?.loyalty_score ?? 70, color: '#a78bfa' },
                ].map((trait) => (
                  <div key={trait.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-white/60">{trait.label}</span>
                      <span className="text-xs" style={{ color: trait.color }}>{trait.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${trait.value}%`, backgroundColor: trait.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="px-6 py-5">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Intelligence Metrics</div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Engagement', value: `${engagementScore}%`, color: '#c8ff00' },
                  { label: 'Confidence', value: `${confidenceScore}%`, color: '#00d4ff' },
                  { label: 'Version', value: `v${version}`, color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.03] rounded-sm p-4 border border-white/[0.06]">
                    <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">{s.label}</div>
                    <div className="text-lg font-semibold" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {twin?.personality_summary && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="text-[10px] text-white/30 tracking-widest uppercase mb-2">Summary</div>
                  <p className="text-sm text-white/50">{twin.personality_summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/dashboard/chat"
              className="glass rounded-sm p-5 border border-white/[0.06] hover:border-[#c8ff00]/30 transition-all group"
            >
              <div className="text-xs text-[#c8ff00] tracking-widest uppercase mb-2 group-hover:opacity-80">Chat with Twin</div>
              <p className="text-sm text-white/40">Ask anything, get intelligence-driven answers</p>
            </Link>
            <Link
              href="/dashboard/client/blueprint"
              className="glass rounded-sm p-5 border border-white/[0.06] hover:border-[#c8ff00]/30 transition-all group"
            >
              <div className="text-xs text-[#c8ff00] tracking-widest uppercase mb-2 group-hover:opacity-80">Blueprint</div>
              <p className="text-sm text-white/40">View full blueprint and expansion modules</p>
            </Link>
            <Link
              href="/dashboard/client/blueprint/assess"
              className="glass rounded-sm p-5 border border-white/[0.06] hover:border-[#c8ff00]/30 transition-all group"
            >
              <div className="text-xs text-[#c8ff00] tracking-widest uppercase mb-2 group-hover:opacity-80">Recalibrate</div>
              <p className="text-sm text-white/40">Update your blueprint to refine your twin</p>
            </Link>
          </div>
        </div>

        {/* Essence Board */}
        <div className="lg:col-span-1">
          <EssenceBoard userId={user.id} userRole={identity?.role ?? 'client'} />
        </div>
      </div>
    </div>
  )
}
