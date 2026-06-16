import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EssenceBoard from '@/components/EssenceBoard'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: twin } = await supabase
    .from('client_twins')
    .select('*')
    .eq('client_id', user.id)
    .maybeSingle()

  const { data: identity } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  const { count: agentCount } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', user.id)

  const name = client?.full_name ?? identity?.full_name ?? 'Client'
  const bpScore = typeof twin?.blueprint_score === 'number' ? twin.blueprint_score : null
  const blueprintScore = bpScore !== null ? `${bpScore}%` : twin ? 'Processing' : '—'
  const engagementScore = twin?.engagement_score ?? '—'

  const stats = [
    { label: 'Intelligence Score', value: engagementScore, color: '#c8ff00', icon: '◈' },
    { label: 'Twins Active',       value: twin ? '1' : '0',                color: '#00d4ff', icon: '⟐' },
    { label: 'Blueprint Score',    value: blueprintScore,                   color: '#a78bfa', icon: '◆' },
    { label: 'Lifetime Value',     value: client?.lifetime_value ? `$${client.lifetime_value}` : '—', color: '#fb923c', icon: '✦' },
  ]

  const quickActions = [
    { label: 'Open Zuri', href: '/dashboard/client/zuri', icon: '◈', desc: 'Personal concierge' },
    { label: 'Essence Intel', href: '/dashboard/client/essence', icon: '⊙', desc: 'Daily briefings' },
    { label: 'My Agents', href: '/dashboard/client/agents', icon: '⊕', desc: 'Deploy & manage' },
    { label: 'My Swarms', href: '/dashboard/client/swarms', icon: '⊗', desc: 'Swarm intelligence' },
  ]

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* ── Welcome ── */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1 bg-gradient-to-r from-[#c8ff00] via-white to-[#c8ff00] bg-clip-text text-transparent bg-[length:200%] animate-gradient">
          Welcome back, {name}
        </h1>
        <p className="text-white/30 text-sm">Your intelligence ecosystem</p>
      </div>

      {/* ── Stats Bar — 4 KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass rounded-sm border-l-2 p-5 transition-all duration-300 hover:translate-y-[-2px]"
            style={{ borderLeftColor: s.color }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs" style={{ color: s.color }}>{s.icon}</span>
              <div className="text-[10px] text-white/30 tracking-widest uppercase">{s.label}</div>
            </div>
            <div className="text-2xl font-light" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── 3-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Intelligence Activity Feed */}
          <div className="glass rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-white/30 tracking-widest uppercase flex items-center gap-2">
                <span className="text-[#c8ff00]">⊙</span> Intelligence Activity Feed
              </span>
              <span className="text-[10px] text-white/20">Live</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/70">
                    {twin
                      ? 'Your AI twin is active and learning from your interactions.'
                      : 'No AI twin deployed yet. Run your blueprint to configure your first one.'}
                  </div>
                </div>
                {!twin && (
                  <Link
                    href="/dashboard/client/blueprint/assess"
                    className="px-5 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all shrink-0 glow-acid"
                  >
                    Run Blueprint →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Deployed Agent Summary */}
          <div className="glass rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-white/30 tracking-widest uppercase flex items-center gap-2">
                <span className="text-[#c8ff00]">⊕</span> Deployed Agents
              </div>
              <Link
                href="/dashboard/client/agents"
                className="text-[10px] text-white/20 hover:text-white/50 transition-colors tracking-wider uppercase"
              >
                Manage →
              </Link>
            </div>
            <div className="text-sm text-white/50">
              <span className="text-white/80 font-medium">{agentCount ?? 0}</span> agent{(agentCount ?? 0) !== 1 ? 's' : ''} currently deployed.
              {' '}Unlock autonomous intelligence agents through your blueprint.
            </div>
            <Link
              href="/dashboard/client/blueprint"
              className="inline-block mt-3 text-xs text-[#c8ff00] hover:text-white transition-colors"
            >
              Deploy new agent →
            </Link>
          </div>

          {/* Essence Board Mini */}
          <div className="glass rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <span className="text-xs text-white/30 tracking-widest uppercase flex items-center gap-2">
                <span>◈</span> Essence Board
              </span>
            </div>
            <div className="p-6">
              <EssenceBoard userId={user.id} userRole={identity?.role ?? 'client'} />
            </div>
          </div>

          {/* Blueprint Progress */}
          <div className="glass rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-white/30 tracking-widest uppercase flex items-center gap-2">
                <span className="text-[#a78bfa]">◆</span> Blueprint Progress
              </div>
              <Link
                href="/dashboard/client/blueprint"
                className="text-[10px] text-white/20 hover:text-white/50 transition-colors tracking-wider uppercase"
              >
                View full →
              </Link>
            </div>
            {bpScore !== null ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Completion</span>
                  <span className="text-xs text-white/60">{bpScore}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${bpScore}%`,
                      background: 'linear-gradient(90deg, #c8ff00, #00d4ff)',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/50">
                {twin
                  ? 'Blueprint assessment submitted. Results are being processed.'
                  : 'Complete the blueprint assessment to unlock your full intelligence ecosystem.'}
              </div>
            )}
            {!twin && (
              <Link
                href="/dashboard/client/blueprint/assess"
                className="inline-block mt-4 px-5 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all glow-acid"
              >
                Start Assessment →
              </Link>
            )}
          </div>
        </div>

        {/* ── Sidebar (1/3) ── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Quick Actions */}
          <div className="glass rounded-sm p-5">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="text-[#c8ff00]">✦</span> Quick Actions
            </div>
            <div className="space-y-2">
              {quickActions.map((qa) => (
                <Link
                  key={qa.href}
                  href={qa.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-white hover:bg-white/[0.04] rounded-sm transition-all duration-200 group"
                >
                  <span className="text-xs w-4 text-center group-hover:text-[#c8ff00] transition-colors">
                    {qa.icon}
                  </span>
                  <div>
                    <div className="text-sm">{qa.label}</div>
                    <div className="text-[10px] text-white/20">{qa.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Consultation */}
          <div className="glass rounded-sm p-5 border-l-2" style={{ borderLeftColor: '#fb923c' }}>
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3 flex items-center gap-2">
              <span className="text-[#fb923c]">✦</span> Consultation
            </div>
            <p className="text-sm text-white/50">
              No consultations scheduled. Book a 30-min strategy session with your intelligence concierge.
            </p>
            <Link
              href="/dashboard/client/consulting"
              className="inline-block mt-3 text-xs text-[#fb923c] hover:text-white transition-colors"
            >
              Book session →
            </Link>
          </div>

          {/* Zuri Status */}
          <div className="glass rounded-sm p-5 border-l-2" style={{ borderLeftColor: '#c8ff00' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-white/30 tracking-widest uppercase flex items-center gap-2">
                <span className="text-[#c8ff00]">◈</span> Zuri
              </div>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-pulse-slow" />
                <span className="text-[10px] text-white/30">Online</span>
              </span>
            </div>
            <p className="text-sm text-white/50">
              Your personal intelligence concierge is ready to assist.
            </p>
            <Link
              href="/dashboard/client/zuri"
              className="inline-block mt-3 text-xs text-[#c8ff00] hover:text-white transition-colors"
            >
              Open Zuri →
            </Link>
          </div>

          {/* Daily Reflection */}
          <div className="glass rounded-sm p-5 border border-white/[0.06]">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Daily Reflection</div>
            <p className="text-sm text-white/50 italic leading-relaxed">
              &ldquo;Intelligence is the ability to adapt to change. What&rsquo;s one pattern you&rsquo;ll break today?&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
