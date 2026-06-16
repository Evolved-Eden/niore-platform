import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CreatorIntelligencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Content Studio</h1>
        <p className="text-white/30 text-sm">Build, schedule, and publish your intelligence content</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Published</div>
          <div className="text-2xl font-light text-[#00d4ff]">—</div>
        </div>
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Drafts</div>
          <div className="text-2xl font-light text-[#c8ff00]">—</div>
        </div>
        <div className="glass rounded-sm p-5">
          <div className="text-xs text-white/30 tracking-widest uppercase mb-3">Scheduled</div>
          <div className="text-2xl font-light text-[#a78bfa]">—</div>
        </div>
      </div>

      <div className="glass rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/30 tracking-widest uppercase">Recent Content</span>
        </div>
        <div className="px-6 py-12 text-center text-white/20 text-sm">
          No content created yet.{' '}
          <span className="text-[#00d4ff] cursor-pointer hover:underline">Create your first piece →</span>
        </div>
      </div>
    </div>
  )
}
