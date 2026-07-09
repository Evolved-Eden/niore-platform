import { createClient } from '@/lib/supabase/server'

export default async function CreatorPayoutsPage() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  // Guaranteed non-null by root middleware
  const user = _user!

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Payouts</h1>
        <p className="text-white/30 text-sm">View revenue summaries and payout history</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Total Revenue</div>
          <div className="text-2xl font-light text-[#c8ff00]">$—</div>
        </div>
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">This Month</div>
          <div className="text-2xl font-light text-[#00d4ff]">$—</div>
        </div>
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Pending</div>
          <div className="text-2xl font-light text-[#a78bfa]">$—</div>
        </div>
      </div>

      <div className="glass rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/30 tracking-widest uppercase">Payout History</span>
        </div>
        <div className="px-6 py-12 text-center text-white/20 text-sm">
          No payouts yet. Start monetizing your intelligence content to see earnings here.
        </div>
      </div>
    </div>
  )
}
