import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, redirect to role-based dashboard
  if (user) {
    const { data: citizen } = await supabase
      .from('ris_citizens')
      .select('role')
      .eq('supabase_user_id', user.id)
      .single()

    const role = citizen?.role ?? 'client'
    redirect(`/dashboard/${role}`)
  }

  // Public landing
  return (
    <main className="min-h-screen bg-[#080810] text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl">
        <span className="font-display font-bold tracking-tight text-lg">
          H<span className="text-[#c8ff00]">.</span>
        </span>
        <div className="flex items-center gap-6 text-sm text-white/50">
          <a href="#services" className="hover:text-white transition-colors">Services</a>
          <a href="#exchange" className="hover:text-white transition-colors">Exchange</a>
          <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full text-xs text-white/40 mb-8 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-pulse-slow" />
          Registered Intelligence Systems
        </div>

        <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter mb-6 max-w-4xl leading-none">
          Audacity in Every{' '}
          <span className="text-[#c8ff00]">Algorithm</span>
        </h1>

        <p className="text-white/40 text-lg max-w-xl mb-12 leading-relaxed">
          Build, deploy, and monetize AI twins. Full business automation
          across Real Estate, Healthcare, and Social Services.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-[#c8ff00] text-black font-bold text-sm rounded-sm hover:bg-white transition-colors"
          >
            Design Your Intelligence
          </Link>
          <Link
            href="/chat/demo-frontdesk"
            className="px-8 py-3.5 border border-white/15 text-white/70 text-sm rounded-sm hover:border-white/30 hover:text-white transition-colors"
          >
            Try Demo
          </Link>
        </div>

        {/* Role tags */}
        <div className="flex items-center gap-3 mt-16 text-xs text-white/20 tracking-widest uppercase">
          <span>Affiliates</span>
          <span className="text-white/10">•</span>
          <span>Clients</span>
          <span className="text-white/10">•</span>
          <span>Creators</span>
          <span className="text-white/10">•</span>
          <span>Exchange</span>
        </div>
      </section>
    </main>
  )
}
