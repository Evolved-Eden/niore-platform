import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { UserRole } from '@/types'

const NAV: Record<UserRole, { label: string; href: string }[]> = {
  client: [
    { label: 'Overview',     href: '/dashboard/client' },
    { label: 'My Twin',      href: '/dashboard/client/twin' },
    { label: 'Vault',        href: '/dashboard/client/vault' },
    { label: 'Zuri',         href: '/dashboard/client/zuri' },
    { label: 'Settings',     href: '/dashboard/client/settings' },
  ],
  creator: [
    { label: 'Overview',     href: '/dashboard/creator' },
    { label: 'Intelligences',href: '/dashboard/creator/intelligences' },
    { label: 'Analytics',    href: '/dashboard/creator/analytics' },
    { label: 'Payouts',      href: '/dashboard/creator/payouts' },
    { label: 'Settings',     href: '/dashboard/creator/settings' },
  ],
  admin: [
    { label: 'Overview',     href: '/dashboard/admin' },
    { label: 'Citizens',     href: '/dashboard/admin/users' },
    { label: 'Agents',       href: '/dashboard/admin/agents' },
    { label: 'Engines',      href: '/dashboard/admin/engines' },
    { label: 'Logs',         href: '/dashboard/admin/logs' },
  ],
}

const ROLE_COLOR: Record<UserRole, string> = {
  client:  '#c8ff00',
  creator: '#00d4ff',
  admin:   '#ff6b6b',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: citizen } = await supabase
    .from('ris_citizens')
    .select('role, display_name')
    .eq('supabase_user_id', user.id)
    .single()

  const role: UserRole = (citizen?.role as UserRole) ?? 'client'
  const name = citizen?.display_name ?? user.email?.split('@')[0] ?? 'User'
  const color = ROLE_COLOR[role]
  const nav = NAV[role]

  return (
    <div className="flex min-h-screen bg-[#080810]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-white/[0.06] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <Link href="/" className="font-display font-bold text-lg tracking-tight">
            H<span style={{ color }}>.</span>
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color }}>
            {role}
          </div>
          <div className="text-sm text-white/60 truncate">{name}</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm text-white/40 rounded-sm hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-6 py-4 border-t border-white/[0.06]">
          <form action="/api/auth/signout" method="post">
            <button className="text-xs text-white/20 hover:text-white/50 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="text-xs text-white/20 tracking-widest uppercase">
            Hoodacity / <span style={{ color }}>{role}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: color }} />
            <span className="text-xs text-white/30">RI Online</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
