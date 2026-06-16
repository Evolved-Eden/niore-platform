'use client'

import { useState } from 'react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const today = now.toDateString()

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Calendar</h1>
        <p className="text-white/40 text-sm mt-1">Your schedule and events</p>
      </div>

      <div className="glass rounded-sm border border-white/[0.06] p-6 max-w-xl">
        {/* Month header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-white/40 hover:text-white transition-colors text-lg px-2">◀</button>
          <h2 className="text-lg font-semibold text-white">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="text-white/40 hover:text-white transition-colors text-lg px-2">▶</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-white/30 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e-${i}`} />
            const dateStr = new Date(year, month, d).toDateString()
            const isToday = dateStr === today
            return (
              <div
                key={d}
                className={`text-center py-2 text-sm rounded-sm cursor-pointer transition-colors
                  ${isToday ? 'bg-[#c8ff00] text-black font-bold' : 'text-white/60 hover:bg-white/[0.05]'}`}
              >
                {d}
              </div>
            )
          })}
        </div>
      </div>

      {/* Events placeholder */}
      <div className="glass rounded-sm border border-white/[0.06] p-6 max-w-xl">
        <h3 className="text-sm font-medium text-white/70 mb-3">Upcoming Events</h3>
        <p className="text-xs text-white/30">No events scheduled. Events from your intelligence system will appear here.</p>
      </div>
    </div>
  )
}
