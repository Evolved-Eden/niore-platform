'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ADDONS, BASE_PLANS, type PathType } from './vertical-data'

type PlanBuilderProps = {
  path: PathType
  defaultPlan?: string
  verticalColor?: string
  /** Optional vertical slug (passed from demo pages) */
  vertical?: string
  /** Optional agent IDs selected in the demo */
  agentIds?: string[]
}

export default function PlanBuilder({ path, defaultPlan, verticalColor = '#C6A664', vertical, agentIds }: PlanBuilderProps) {
  const router = useRouter()
  const plans: Record<string, { name: string; price: number; period: string; tagline: string; popular?: boolean }> = BASE_PLANS[path]
  const planEntries = Object.entries(plans)

  const [selectedPlan, setSelectedPlan] = useState<string>(defaultPlan || planEntries[0][0])
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  // Find the selected plan data
  const activePlan = planEntries.find(([key]) => key === selectedPlan)?.[1]
  const basePrice = activePlan?.price ?? 0
  const addonTotal = ADDONS.filter(a => selectedAddons.has(a.id)).reduce((sum, a) => sum + a.price, 0)
  const total = basePrice + addonTotal

  function toggleAddon(id: string) {
    setSelectedAddons(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCheckout() {
    setCheckoutLoading(true)
    setCheckoutError('')

    try {
      const tier = `${path}_${selectedPlan}`
      const res = await fetch('/api/stripe/checkout-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          path,
          addons: ADDONS.filter(a => selectedAddons.has(a.id)).map(a => ({ id: a.id, name: a.name })),
          agent_ids: agentIds || [],
          vertical: vertical || '',
        }),
      })

      const d = await res.json()

      if (d.requiresAuth && d.redirectUrl) {
        // Not logged in — redirect to register
        router.push(d.redirectUrl)
        return
      }

      if (d.url) {
        // Redirect to Stripe checkout
        window.location.href = d.url
        return
      }

      if (d.error) {
        setCheckoutError(d.error)
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Base Plan Selection */}
      <div className="mb-6">
        <p className="text-xs text-white/30 tracking-widest uppercase mb-3">Choose Your Base Plan</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {planEntries.map(([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key)}
              className={`relative rounded-sm p-4 border text-left transition-all ${
                selectedPlan === key
                  ? 'border-[#C6A664] bg-[#C6A664]/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'
              }`}
            >
              {(plan as any).popular && (
                <div className="absolute -top-2 left-3 px-2 py-0.5 bg-[#C6A664] text-black text-[9px] font-bold rounded-full uppercase tracking-wider">
                  Popular
                </div>
              )}
              <h4 className="text-sm font-semibold text-white/90 mb-0.5">{plan.name}</h4>
              <p className="text-xs text-white/40 mb-2">{plan.tagline}</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold text-white">
                  ${plan.price.toLocaleString()}
                </span>
                <span className="text-xs text-white/30">{plan.period}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div className="mb-6">
        <p className="text-xs text-white/30 tracking-widest uppercase mb-3">Add-Ons</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ADDONS.map((addon) => (
            <button
              key={addon.id}
              onClick={() => toggleAddon(addon.id)}
              className={`flex items-center justify-between rounded-sm p-3 border text-left transition-all ${
                selectedAddons.has(addon.id)
                  ? 'border-[#C6A664]/40 bg-[#C6A664]/8'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-white/80 truncate">{addon.name}</h4>
                <p className="text-[10px] text-white/40 truncate">{addon.desc}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-xs font-mono whitespace-nowrap" style={{ color: verticalColor }}>
                  +${addon.price}{addon.period}
                </span>
                <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
                  selectedAddons.has(addon.id)
                    ? 'bg-[#C6A664] border-[#C6A664]'
                    : 'border-white/20'
                }`}>
                  {selectedAddons.has(addon.id) && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Total Breakdown */}
      <div className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-4 mb-6">
        <p className="text-xs text-white/30 tracking-widest uppercase mb-3">Price Breakdown</p>
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">{activePlan?.name || 'Plan'} (base)</span>
            <span className="text-white/80">${basePrice.toLocaleString()}{activePlan?.period}</span>
          </div>
          {ADDONS.filter(a => selectedAddons.has(a.id)).map((addon) => (
            <div key={addon.id} className="flex justify-between text-sm">
              <span className="text-white/40">{addon.name}</span>
              <span className="text-white/60">+${addon.price}{addon.period}</span>
            </div>
          ))}
          {addonTotal === 0 && (
            <div className="text-xs text-white/20 italic">No add-ons selected</div>
          )}
        </div>
        <div className="border-t border-white/[0.06] pt-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold text-white/80">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold" style={{ color: verticalColor }}>
                ${total.toLocaleString()}
              </span>
              <span className="text-xs text-white/30 ml-1">
                {activePlan?.period || ''}
              </span>
              {path === 'personal' && selectedPlan === 'verified' && (
                <span className="text-xs text-white/30 ml-1">one-time payment</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {checkoutError && (
        <p className="text-red-400 text-xs text-center mb-3">{checkoutError}</p>
      )}

      {/* CTA — Subscribe / Checkout */}
      <button
        onClick={handleCheckout}
        disabled={checkoutLoading}
        className="block w-full py-3.5 text-center text-sm font-bold rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: verticalColor,
          color: '#000',
        }}
        onMouseOver={(e) => { if (!checkoutLoading) e.currentTarget.style.opacity = '0.9' }}
        onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        {checkoutLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          `Subscribe — $${total.toLocaleString()}${activePlan?.period || ''}`
        )}
      </button>
      <p className="text-[10px] text-white/20 text-center mt-2">
        Secure checkout via Stripe. Cancel anytime.
      </p>
    </div>
  )
}
