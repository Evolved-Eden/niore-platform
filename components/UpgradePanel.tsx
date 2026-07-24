'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type UpgradeOption = {
  key: string
  name: string
  price: string
  desc: string
  action: 'checkout' | 'consultation'
}

/**
 * Shared Upgrades panel -- embedded on every role dashboard (Business,
 * Collective, Creator, Personal, Affiliate) so "full system access and
 * upgrades built in" lives on the dash itself, not buried in a plan page.
 *
 * Shows the Editions/packs the person does NOT yet own as expansion paths,
 * plus the always-available Custom option that routes to the consultation
 * flow (form + admin-approved booking) rather than checkout.
 */
export default function UpgradePanel({ currentRole }: { currentRole: string }) {
  const [ownedTier, setOwnedTier] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/client/entitlements')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOwnedTier(d?.entitlements?.plan_key ?? null))
      .catch(() => {})
  }, [])

  const ALL_OPTIONS: UpgradeOption[] = [
    { key: 'client', name: 'Business Essintelligence', price: '$1,997/mo', desc: 'Full department-level AI workforce for your organization', action: 'checkout' },
    { key: 'collective', name: 'Collective Essintelligence', price: 'from $799/mo', desc: 'Shared intelligence for groups -- family, board, mastermind, community', action: 'checkout' },
    { key: 'creator', name: 'Creator Essintelligence', price: 'from $149/mo', desc: 'Products, courses, AI Twin publishing, and marketplace', action: 'checkout' },
    { key: 'personal', name: 'Personal Essintelligence', price: 'from $129/mo', desc: 'Your personal operating system -- goals, planner, AI coach', action: 'checkout' },
    { key: 'affiliate', name: 'Affiliate Essintelligence', price: 'from $97/mo', desc: 'Referrals, commissions, and partner tools', action: 'checkout' },
    { key: 'connector_pack', name: 'Connector Pack', price: '$79/mo', desc: '+100 DMs and +200 emails per month, stacks per pack', action: 'checkout' },
    { key: 'custom', name: 'Custom Build', price: 'Custom', desc: 'Enterprise scale, white label, or something that does not fit a tier -- scoped 1:1', action: 'consultation' },
  ]

  // Hide the Edition matching the role they're already in; everything else
  // (including Connector Pack and Custom) is a valid expansion.
  const options = ALL_OPTIONS.filter((o) => o.key !== currentRole)

  return (
    <div className="glass rounded-sm border border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-white text-sm">Expand Your System</h2>
          <p className="text-[11px] text-white/30 mt-0.5">Editions are additive -- add capabilities without switching products</p>
        </div>
        <Link href="/dashboard/client/plan" className="text-[11px] text-[#C6A664] hover:text-white transition-colors">
          View full plan →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {options.map((opt) => (
          <Link
            key={opt.key}
            href={opt.action === 'consultation'
              ? '/consultation?type=strategy&source=upgrade_panel'
              : `/dashboard/client/plan?add=${opt.key}`}
            className="rounded-sm border border-white/[0.06] hover:border-[#C6A664]/30 p-4 transition-all group"
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-white group-hover:text-[#C6A664] transition-colors">{opt.name}</span>
              <span className="text-[10px] text-white/40 shrink-0">{opt.price}</span>
            </div>
            <p className="text-[11px] text-white/30 leading-relaxed">{opt.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
