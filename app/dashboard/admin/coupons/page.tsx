'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type CouponEntry = {
  id: string
  code: string
  active: boolean
  coupon_id: string
  coupon: {
    id: string
    name: string | null
    percent_off: number | null
    amount_off: number | null
    currency: string | null
    duration: string
    duration_in_months: number | null
    max_redemptions: number | null
    times_redeemed: number
    created: number
  } | null
  expires_at: number | null
  max_redemptions: number | null
  times_redeemed: number
  created: number
}

export default function AdminCouponsPage() {
  const router = useRouter()
  const [coupons, setCoupons] = useState<CouponEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent')
  const [percentOff, setPercentOff] = useState(20)
  const [amountOff, setAmountOff] = useState(1000)
  const [duration, setDuration] = useState<'once' | 'forever' | 'repeating'>('once')
  const [durationMonths, setDurationMonths] = useState(3)
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadCoupons()
  }, [])

  async function loadCoupons() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json()
      if (data.coupons) setCoupons(data.coupons)
    } catch {}
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          percent_off: discountType === 'percent' ? percentOff : undefined,
          amount_off: discountType === 'amount' ? amountOff : undefined,
          duration,
          duration_in_months: duration === 'repeating' ? durationMonths : undefined,
          max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined,
          name: `Discount ${code}`,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(`Coupon "${code}" created successfully!`)
        setCode('')
        setShowForm(false)
        loadCoupons()
      }
    } catch {}
    setSaving(false)
  }

  async function handleDeactivate(id: string, code: string) {
    if (!confirm(`Deactivate coupon "${code}"? This cannot be undone.`)) return
    try {
      await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' })
      loadCoupons()
    } catch {}
  }

  function formatDuration(d: string, months?: number | null) {
    if (d === 'once') return 'One-time'
    if (d === 'forever') return 'Forever'
    return `${months || 3} months`
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
            Coupon <span className="text-[#C6A664]">Codes</span>
          </h1>
          <p className="text-white/30 text-sm">Create and manage Stripe promotion codes</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); setSuccess(null) }}
          className="px-5 py-2.5 rounded-sm text-sm font-medium bg-[#C6A664] text-black hover:bg-[#b8ee00] transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Coupon'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-8 p-6 rounded-sm border border-white/[0.06] bg-white/[0.02]">
          <h2 className="font-display text-lg font-semibold mb-4">Create New Coupon</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Promo Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCH20"
                  required
                  className="w-full px-3 py-2 rounded-sm bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#C6A664]/50"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-sm bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#C6A664]/50"
                >
                  <option value="once">One-time</option>
                  <option value="forever">Forever</option>
                  <option value="repeating">Repeating (months)</option>
                </select>
              </div>

              {/* Discount type */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Discount Type</label>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-sm bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#C6A664]/50"
                >
                  <option value="percent">Percentage off</option>
                  <option value="amount">Fixed amount off</option>
                </select>
              </div>

              {/* Discount value */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">
                  {discountType === 'percent' ? 'Percent Off' : 'Amount Off (cents)'}
                </label>
                <input
                  type="number"
                  value={discountType === 'percent' ? percentOff : amountOff}
                  onChange={e => discountType === 'percent' ? setPercentOff(parseInt(e.target.value) || 0) : setAmountOff(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full px-3 py-2 rounded-sm bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#C6A664]/50"
                />
                {discountType === 'amount' && <p className="text-[10px] text-white/30 mt-1">Amount in cents (e.g. 1000 = $10.00)</p>}
              </div>

              {/* Duration months (if repeating) */}
              {duration === 'repeating' && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Duration (months)</label>
                  <input
                    type="number"
                    value={durationMonths}
                    onChange={e => setDurationMonths(parseInt(e.target.value) || 3)}
                    min={1}
                    className="w-full px-3 py-2 rounded-sm bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#C6A664]/50"
                  />
                </div>
              )}

              {/* Max redemptions */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Max Redemptions (optional)</label>
                <input
                  type="number"
                  value={maxRedemptions}
                  onChange={e => setMaxRedemptions(e.target.value)}
                  placeholder="Unlimited"
                  min={1}
                  className="w-full px-3 py-2 rounded-sm bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#C6A664]/50"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-[#5E8B84] text-sm">{success}</p>}

            <button
              type="submit"
              disabled={saving || !code.trim()}
              className="px-5 py-2.5 rounded-sm text-sm font-medium bg-[#C6A664] text-black hover:bg-[#b8ee00] transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>
      )}

      {/* Coupons list */}
      {loading ? (
        <div className="text-white/20 text-sm py-8">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-3xl mb-4 opacity-20">%</div>
          <p className="text-white/30 text-sm mb-2">No promotion codes yet</p>
          <p className="text-white/20 text-xs">Create your first coupon to offer discounts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => (
            <div
              key={c.id}
              className={`p-4 rounded-sm border ${c.active ? 'border-white/[0.06]' : 'border-white/[0.03]'} bg-white/[0.02] flex items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`font-mono text-sm font-bold px-3 py-1 rounded-sm ${c.active ? 'bg-[#C6A664]/10 text-[#C6A664]' : 'bg-white/[0.04] text-white/30'}`}>
                  {c.code}
                </div>
                <div className="text-sm">
                  {c.coupon?.percent_off ? (
                    <span className="text-white/70">{c.coupon.percent_off}% off</span>
                  ) : c.coupon?.amount_off ? (
                    <span className="text-white/70">${(c.coupon.amount_off / 100).toFixed(2)} off</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                  <span className="text-white/30 mx-2">·</span>
                  <span className="text-white/40 text-xs">{formatDuration(c.coupon?.duration || 'once', c.coupon?.duration_in_months)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-xs text-white/30 text-right">
                  <div>{c.times_redeemed}{c.max_redemptions ? `/${c.max_redemptions}` : ''} redeemed</div>
                </div>
                {c.active && (
                  <button
                    onClick={() => handleDeactivate(c.id, c.code)}
                    className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
                  >
                    Deactivate
                  </button>
                )}
                {!c.active && <span className="text-xs text-white/20">Inactive</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
