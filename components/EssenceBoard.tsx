'use client'

import { useEffect, useState } from 'react'

type EssenceItem = {
  type: 'focus' | 'optimization' | 'timing' | 'opportunity' | 'growth' | 'brand' | 'habit' | 'action'
  content: string
  priority: 'high' | 'medium' | 'low'
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  focus:        { label: 'Focus Priority',  icon: '🎯', color: '#c8ff00' },
  optimization: { label: 'Optimization',    icon: '⚡', color: '#00d4ff' },
  timing:       { label: 'Timing',          icon: '🕐', color: '#a78bfa' },
  opportunity:  { label: 'Opportunity',     icon: '💡', color: '#34d399' },
  growth:       { label: 'Growth',          icon: '📈', color: '#fb923c' },
  brand:        { label: 'Brand',           icon: '✨', color: '#f472b6' },
  habit:        { label: 'Habit',           icon: '🔄', color: '#22d3ee' },
  action:       { label: 'Action',          icon: '✓', color: '#e879f9' },
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ff6b6b',
  medium: '#fb923c',
  low: '#22d3ee',
}

const DEFAULT_ITEMS: EssenceItem[] = [
  { type: 'focus',    content: 'Review your intelligence blueprint alignment', priority: 'high' },
  { type: 'action',   content: 'Complete one high-impact task before noon', priority: 'high' },
  { type: 'timing',   content: 'Optimal engagement window: 10 AM - 2 PM', priority: 'medium' },
  { type: 'habit',    content: 'Schedule recovery time between intensive sessions', priority: 'medium' },
  { type: 'growth',   content: 'Reach out to 2 strategic connections today', priority: 'low' },
  { type: 'brand',    content: 'Your brand voice is strongest in direct conversation', priority: 'low' },
]

export default function EssenceBoard({ userId, userRole }: { userId?: string; userRole?: string }) {
  const [items, setItems] = useState<EssenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const now = new Date()
    setCurrentDate(now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }))

    // Load from API or use defaults
    async function load() {
      try {
        const res = await fetch('/api/zuri/essence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userRole }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.items?.length) {
            setItems(data.items)
            setLoading(false)
            return
          }
        }
      } catch {
        // Fallback to defaults
      }
      setItems(DEFAULT_ITEMS)
      setLoading(false)
    }
    load()
  }, [userId, userRole])

  const displayed = expanded ? items : items.slice(0, 3)

  return (
    <div className="glass rounded-sm border border-[#c8ff00]/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse-slow" />
            <span className="text-xs text-[#c8ff00] tracking-widest uppercase font-medium">
              Today&apos;s Essence Board
            </span>
          </div>
          <p className="text-[10px] text-white/20 mt-1">{currentDate}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          {expanded ? 'Show less' : `View all (${items.length})`}
        </button>
      </div>

      {/* Items */}
      {loading ? (
        <div className="px-5 py-8 text-center">
          <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-white/30">Calibrating your essence...</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {displayed.map((item, i) => {
            const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.action
            return (
              <div
                key={i}
                className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  {/* Priority indicator */}
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: PRIORITY_COLORS[item.priority] ?? '#22d3ee' }}
                  />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <span
                        className="text-[9px] uppercase tracking-widest"
                        style={{ color: PRIORITY_COLORS[item.priority] ?? '#22d3ee' }}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-white/70">{item.content}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Daily question */}
      <div className="px-5 py-4 bg-white/[0.02] border-t border-white/[0.06]">
        <div className="flex items-start gap-3">
          <span className="text-sm shrink-0 mt-0.5">💭</span>
          <div>
            <p className="text-xs text-white/30 mb-1">Daily Intelligence Question</p>
            <p className="text-sm text-white/60 italic">
              &ldquo;What&rsquo;s one decision you made today that your future self would thank you for?&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
