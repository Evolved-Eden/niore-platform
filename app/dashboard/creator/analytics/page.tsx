import { createClient } from '@/lib/supabase/server'

export default async function CreatorAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  // Guaranteed non-null by root middleware
  const user = _user!

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Analytics</h1>
        <p className="text-white/30 text-sm">Review audience, engagement, and performance metrics</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Impressions</div>
          <div className="text-2xl font-light text-[#00d4ff]">—</div>
        </div>
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Engagement</div>
          <div className="text-2xl font-light text-[#c8ff00]">—</div>
        </div>
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Followers</div>
          <div className="text-2xl font-light text-[#a78bfa]">—</div>
        </div>
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Conversion</div>
          <div className="text-2xl font-light text-[#fb923c]">—</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass rounded-sm p-6">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Audience Growth</div>
          <div className="h-48 flex items-center justify-center text-white/10 text-sm">
            Chart placeholder — connect to analytics provider
          </div>
        </div>
        <div className="glass rounded-sm p-6">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Top Content</div>
          <div className="h-48 flex items-center justify-center text-white/10 text-sm">
            No data yet — publish content to see performance
          </div>
        </div>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse-slow" />
          Analytics data refreshes every 24 hours
        </div>
      </div>
    </div>
  )
}
