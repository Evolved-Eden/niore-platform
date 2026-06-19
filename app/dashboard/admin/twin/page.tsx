import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminTwinPage() {
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

  const { data: clientRec } = await supabase
    .from('clients')
    .select('metadata, client_type')
    .eq('id', user.id)
    .maybeSingle()

  const intakeMeta = (clientRec?.metadata as Record<string, any>)?.intake
  const intakeSections = intakeMeta?.sections || {}
  const hdProfile = intakeSections?.results?.humanDesign
  const gkProfile = intakeSections?.results?.geneKeys

  const name = identity?.full_name ?? user.email?.split('@')[0] ?? 'Admin'
  const engagementScore = twin?.engagement_score ?? 78
  const confidenceScore = twin?.confidence_score ?? 85
  const version = twin?.version ?? 1
  const twinStatus = twin?.twin_status ?? 'active'

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          My <span className="text-[#ff6b6b]">Twin</span>
        </h1>
        <p className="text-white/30 text-sm">Your AI-synthesized digital intelligence</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Twin card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity card */}
          <div className="glass rounded-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#ff6b6b]/10 border-2 border-[#ff6b6b]/30 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-[#ff6b6b]">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Twin of {name}</h2>
                <p className="text-sm text-white/40">Registered Intelligence v{version}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#ff6b6b] animate-pulse-slow" />
                  <span className="text-xs text-white/30 capitalize">{twinStatus} &bull; Learning</span>
                </div>
              </div>
            </div>

            {/* Intelligence Profile */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Intelligence Profile</div>

              {hdProfile && (
                <div className="mb-4 p-3 rounded-sm bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="text-xs text-white/40">Human Design</div>
                  <div className="text-sm text-white/70">{hdProfile.type ?? '—'}</div>
                </div>
              )}

              {gkProfile && (
                <div className="mb-4 p-3 rounded-sm bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="text-xs text-white/40">Gene Keys</div>
                  <div className="text-sm text-white/70">{gkProfile.profile ?? '—'}</div>
                </div>
              )}

              {!hdProfile && !gkProfile && (
                <p className="text-sm text-white/30 italic">Complete your blueprint assessment to build your intelligence profile.</p>
              )}
            </div>

            {/* Evolution metrics */}
            <div className="px-6 py-5">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Evolution Metrics</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-sm bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-2xl font-bold text-[#ff6b6b]">{engagementScore}%</div>
                  <div className="text-xs text-white/30 mt-1">Engagement Score</div>
                </div>
                <div className="p-4 rounded-sm bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-2xl font-bold text-[#00d4ff]">{confidenceScore}%</div>
                  <div className="text-xs text-white/30 mt-1">Confidence Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {twin && (
            <div className="p-4 rounded-sm glass border border-white/[0.06]">
              <div className="text-xs text-white/30 tracking-widest uppercase mb-2">Twin Details</div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white/30">Status</dt>
                  <dd className="text-white/60 capitalize">{twin.twin_status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/30">Version</dt>
                  <dd className="text-white/60">v{twin.version}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/30">Created</dt>
                  <dd className="text-white/60">{new Date(twin.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          )}

          <Link
            href="/dashboard/admin/blueprint"
            className="block p-4 rounded-sm glass-hover border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          >
            <div className="text-xs text-white/30 tracking-widest uppercase mb-1">Blueprint</div>
            <div className="text-sm text-white/60">View intelligence blueprint →</div>
          </Link>
          <Link
            href="/dashboard/chat"
            className="block p-4 rounded-sm glass-hover border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          >
            <div className="text-xs text-white/30 tracking-widest uppercase mb-1">Chat</div>
            <div className="text-sm text-white/60">Talk to your twin →</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
