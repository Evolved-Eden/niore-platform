import React from 'react'

export function BrandKitSelector({ currentBrandKitId, onSelect }: { currentBrandKitId?: string; onSelect: (id: string) => void }) {
  const brandKits = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Evolved Gold', primary: '#C6A664', bg: '#0A0A0B' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Muted Teal', primary: '#5E8B84', bg: '#0F172A' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Deep Wine', primary: '#7A2E32', bg: '#120808' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Terracotta Earth', primary: '#B5764A', bg: '#14100D' },
  ]

  return (
    <div className="glass rounded-sm p-6 border border-white/[0.08] mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Brand Kit & Identity</h3>
          <p className="text-xs text-white/40">Select your active aesthetic palette for your intelligent interface</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C6A664]/10 text-[#C6A664] border border-[#C6A664]/20">
          Client & Creator Concierge Exclusive
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {brandKits.map((kit) => {
          const isSelected = currentBrandKitId === kit.id
          return (
            <button
              key={kit.id}
              onClick={() => onSelect(kit.id)}
              className={`p-4 rounded-sm border text-left transition-all ${isSelected ? 'border-[#C6A664] bg-[#C6A664]/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: kit.primary }} />
                <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: kit.bg }} />
              </div>
              <p className="text-sm font-medium text-white">{kit.name}</p>
              <p className="text-[10px] text-white/40 mt-1">{isSelected ? 'Active Palette' : 'Click to Apply'}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
