'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SidebarNav from '@/app/dashboard/_components/SidebarNav'

interface SidebarWrapperProps {
  nav: any[]
  color: string
  role: string
  name: string
  children: React.ReactNode
}

export default function SidebarWrapper({ nav, color, role, name, children }: SidebarWrapperProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0A0A0B] relative">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 border-r border-white/[0.06] flex flex-col transition-all duration-300 relative z-20 bg-[#0A0A0B] ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#1A1A1C] border border-white/10 text-white/60 hover:text-white flex items-center justify-center text-xs shadow-lg transition-transform z-30"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>

        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/[0.06] flex items-center justify-between overflow-hidden">
          <Link href="/">
            <Image
              src="/logo.JPG"
              alt="Evolved Eden"
              width={collapsed ? 30 : 100}
              height={24}
              className="object-contain transition-all"
            />
          </Link>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-6 py-4 border-b border-white/[0.06] overflow-hidden whitespace-nowrap">
            <div className="text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color }}>
              {role}
            </div>
            <div className="text-sm text-white/60 truncate">{name}</div>
          </div>
        )}

        {/* Nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav nav={nav} color={color} collapsed={collapsed} />
        </div>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <form action="/api/auth/signout" method="post">
            <button className="text-xs text-white/20 hover:text-white/50 transition-colors truncate">
              {collapsed ? '⇥' : 'Sign out'}
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-white/40 hover:text-white text-sm md:hidden"
            >
              ☰
            </button>
            <div className="text-xs text-white/20 tracking-widest uppercase">
              <Image src="/logo.JPG" alt="" width={60} height={14} className="object-contain inline-block -mt-0.5 opacity-60" /> / <span style={{ color }}>{role}</span>
            </div>
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
