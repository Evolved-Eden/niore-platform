'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavItem {
  label: string
  href: string
}

const NAV_ICONS: Record<string, string> = {
  Overview:       '◈',
  Profile:        '✦',
  Blueprint:      '◆',
  'My Blueprint': '◆',
  Assessment:     '◇',
  'Essence Intel':'⊙',
  'My Agents':    '⊕',
  'My Swarms':    '⊗',
  'My Twin':      '⟐',
  Vault:          '▣',
  Connectors:     '⊡',
  Concierge:      '✦',
  Zuri:           '◈',
  'Chat / Prompt':'☆',
  'Zuri Config':  '⊚',
  Settings:       '⚙',
  '── System ──': '',
}

/** Groups nav items into sections separated by dividers */
const NAV_SECTION: Record<string, number> = {
  Overview: 1,
  Profile: 1,
  Blueprint: 1,
  Assessment: 1,
  'Essence Intel': 2,
  'My Agents': 2,
  'My Swarms': 2,
  'My Twin': 2,
  Vault: 3,
  Connectors: 3,
  Concierge: 3,
  Zuri: 3,
  Settings: 3,
}

export default function SidebarNav({ nav, color }: { nav: NavItem[]; color: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {nav.map((item, index) => {
        const isSeparator = item.label.startsWith('──')
        const isActive = pathname === item.href
        const icon = NAV_ICONS[item.label] ?? '◈'
        const section = NAV_SECTION[item.label] ?? 0
        const prevSection = index > 0 ? NAV_SECTION[nav[index - 1]?.label] ?? 0 : 0
        const showDivider = index > 0 && section !== prevSection

        if (isSeparator) {
          return (
            <div key={item.href} className="flex items-center gap-2 px-3 py-2">
              <div className="flex-1 border-t border-white/[0.06]" />
              <span className="text-[10px] tracking-[0.2em] text-white/15 uppercase">{item.label.replace(/─/g, '').trim()}</span>
              <div className="flex-1 border-t border-white/[0.06]" />
            </div>
          )
        }

        return (
          <div key={item.href}>
            {showDivider && <div className="my-3 mx-3 border-t border-white/[0.06]" />}
            <Link
              href={item.href}
              className={`
                group flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-all duration-200 relative overflow-hidden
                ${isActive
                  ? 'text-white bg-white/[0.06]'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.04]'}
              `}
              style={{
                borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
                paddingLeft: isActive ? '10px' : '12px',
              }}
            >
              {/* Active indicator glow */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-sm pointer-events-none"
                  style={{ background: `linear-gradient(90deg, ${color}15, transparent)` }}
                />
              )}

              {/* Icon */}
              <span
                className="text-xs w-4 text-center relative z-10 transition-colors duration-200"
                style={{ color: isActive ? color : undefined }}
              >
                {icon}
              </span>

              {/* Label */}
              <span className="tracking-wide relative z-10">{item.label}</span>

              {/* Hover glow */}
              <span
                className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 50%, ${color}08 0%, transparent 70%)`,
                }}
              />
            </Link>
          </div>
        )
      })}
    </nav>
  )
}
