import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// ─── Plan tier definitions ──────────────────────────────────────
interface PlanCategory {
  label: string
  color: string
  tiers: { key: string; name: string; description: string }[]
}

const PLAN_CATEGORIES: PlanCategory[] = [
  {
    label: 'Client',
    color: '#c8ff00',
    tiers: [
      { key: 'client_founder', name: 'Founder', description: 'Solo intelligence foundation — core blueprint, essence, and twin' },
      { key: 'client_team', name: 'Team', description: 'Small team collaboration — shared intelligence, agents, vault access' },
      { key: 'client_enterprise', name: 'Enterprise', description: 'Full org intelligence — swarms, deployments, analytics' },
    ],
  },
  {
    label: 'Creator',
    color: '#00d4ff',
    tiers: [
      { key: 'creator_studio', name: 'Studio', description: 'Content creator intelligence — brand monitoring, audience insights' },
      { key: 'creator_premium', name: 'Premium Creator', description: 'Advanced creator tools — multi-platform essence, scheduling' },
      { key: 'creator_concierge', name: 'Concierge', description: 'White-glove creator intelligence — managed swarm, dedicated twin' },
    ],
  },
  {
    label: 'Personal',
    color: '#fb923c',
    tiers: [
      { key: 'personal_free', name: 'Free Personal', description: 'Basic personal intelligence — daily essence, vault (limited)' },
      { key: 'personal_plus', name: 'Personal Plus', description: 'Enhanced personal — full essence, unlimited vault, twin access' },
      { key: 'personal_premium', name: 'Premium Personal', description: 'Full personal intelligence — all features, priority support' },
    ],
  },
  {
    label: 'Affiliate',
    color: '#a78bfa',
    tiers: [
      { key: 'affiliate_starter', name: 'Affiliate Starter', description: 'Entry-level affiliate intelligence — basic tracking, vault' },
      { key: 'affiliate_pro', name: 'Affiliate Pro', description: 'Professional affiliate — campaign intelligence, essence' },
      { key: 'affiliate_enterprise', name: 'Affiliate Enterprise', description: 'Full affiliate org — swarms, multi-platform intelligence' },
    ],
  },
  {
    label: 'Service',
    color: '#34d399',
    tiers: [
      { key: 'service_free', name: 'Free Service', description: 'Basic service intelligence — intake, vault (limited)' },
      { key: 'service_basic', name: 'Basic Service', description: 'Essential service tools — essence, vault, twin' },
      { key: 'service_premium', name: 'Premium Service', description: 'Full service intelligence — all features, agents, priority' },
    ],
  },
  {
    label: 'Employee',
    color: '#f472b6',
    tiers: [
      { key: 'employee_starter', name: 'Employee Starter', description: 'Core employee intelligence — vault, daily essence' },
      { key: 'employee_growth', name: 'Employee Growth', description: 'Growth tools — twin, insights, collaboration' },
      { key: 'employee_pro', name: 'Employee Pro', description: 'Professional tier — full essence, agents, reporting' },
      { key: 'employee_enterprise', name: 'Employee Enterprise', description: 'Enterprise employee — all features, multi-org capable' },
    ],
  },
  {
    label: 'Department',
    color: '#22d3ee',
    tiers: [
      { key: 'department_starter', name: 'Department Starter', description: 'Basic department intelligence — coordination, vault' },
      { key: 'department_premium', name: 'Department Premium', description: 'Full department — swarms, essence, analytics' },
    ],
  },
  {
    label: 'Organization System',
    color: '#e879f9',
    tiers: [
      { key: 'os_creator', name: 'OS Creator', description: 'Org-level creator intelligence — brand, content, audience' },
      { key: 'os_founder', name: 'OS Founder', description: 'Founder intelligence suite — full org oversight, strategy' },
      { key: 'os_business', name: 'OS Business', description: 'Business intelligence — operations, growth, analytics' },
      { key: 'os_agency', name: 'OS Agency', description: 'Agency intelligence — multi-client, campaign management' },
      { key: 'os_family', name: 'OS Family', description: 'Family intelligence — household coordination, shared essence' },
      { key: 'os_wellness', name: 'OS Wellness', description: 'Wellness intelligence — health tracking, habit essence' },
    ],
  },
  {
    label: 'Enterprise',
    color: '#ff6b6b',
    tiers: [
      { key: 'enterprise_concierge', name: 'Enterprise Concierge', description: 'Dedicated concierge intelligence — managed services' },
      { key: 'enterprise_eden_force', name: 'Eden Force', description: 'Elite intelligence operations — full spectrum deployment' },
      { key: 'enterprise_omnigrid', name: 'Omnigrid', description: 'Universal intelligence grid — all systems, unlimited scale' },
    ],
  },
]

const ADDON_DEFS: Record<string, { name: string; desc: string }> = {
  additional_intelligence: { name: 'Additional Intelligence', desc: 'Extra intelligence profile slots' },
  additional_agent: { name: 'Additional Agent', desc: 'Deploy more AI agents' },
  additional_swarm: { name: 'Additional Swarm', desc: 'Create additional swarms' },
  additional_memory: { name: 'Additional Memory', desc: 'Extended twin memory capacity' },
  additional_workflow: { name: 'Additional Workflow', desc: 'More automated workflows' },
  twin_expansion: { name: 'Twin Expansion', desc: 'Enhanced twin capabilities' },
  premium_essence: { name: 'Premium Essence', desc: 'Advanced essence intelligence' },
  sdk_api: { name: 'SDK / API Access', desc: 'Programmatic access to intelligence' },
  white_label: { name: 'White Label', desc: 'Branded intelligence interface' },
  voice_systems: { name: 'Voice Systems', desc: 'Voice-enabled intelligence' },
}

function planLabel(key: string | null | undefined): string {
  if (!key || key === 'none' || key === 'free') return 'Free / Starter'
  for (const cat of PLAN_CATEGORIES) {
    const found = cat.tiers.find(t => t.key === key)
    if (found) return found.name
  }
  return key.replace(/^[a-z]+_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Component ──────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wider uppercase px-2.5 py-1 rounded-sm"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-xs text-white/30 tracking-widest uppercase mb-4">{title}</div>
  )
}

// ================================================================
// PAGE
// ================================================================
export default async function ClientPlanPage() {
  const supabase = await createClient()
  const { data: { user: _user } } = await supabase.auth.getUser()
  const user = _user!

  // Fetch client data + organization + membership
  const [clientRes, userRes, orgMembershipsRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('organization_memberships')
      .select('organization_id, role, status, organizations(name, subscription_plan)')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const client = (clientRes.data ?? {}) as Record<string, any>
  const identity = (userRes.data ?? {}) as Record<string, any>
  const membership = orgMembershipsRes.data as Record<string, any> | null

  const planTier = (client?.plan_tier_key as string) || 'none'
  const additionalPlans = (client?.additional_plans as string[]) || []
  const addons = (client?.addons as string[]) || []
  const clientType = (client?.client_type as string) || 'individual'
  const orgName = (membership as any)?.organizations?.name || null
  const orgPlan = (membership as any)?.organizations?.subscription_plan || null
  const memRole = membership?.role || null
  const memStatus = membership?.status || null

  const isOrgManaged = !!orgName

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* ═══ Header ═══ */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          Plan & <span className="text-[#c8ff00]">Billing</span>
        </h1>
        <p className="text-white/30 text-sm">Your subscription, organization membership, and available upgrades</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ MAIN ═══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ─── Current Plan ──────────────────────────────────── */}
          <div className="glass rounded-sm p-6 border border-white/[0.06]">
            <SectionHeader title="Current Subscription" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/[0.03] rounded-sm p-4 border border-white/[0.06]">
                <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Base Plan</div>
                <Badge
                  label={planLabel(planTier)}
                  color={planTier === 'none' ? '#6b7280' : '#c8ff00'}
                />
                <div className="text-[10px] text-white/20 mt-1.5 font-mono">{planTier}</div>
              </div>
              <div className="bg-white/[0.03] rounded-sm p-4 border border-white/[0.06]">
                <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Account Type</div>
                <span className="text-sm text-white/70 capitalize">{clientType}</span>
                <div className="text-[10px] text-white/20 mt-1.5">{identity?.role || 'client'}</div>
              </div>
              <div className="bg-white/[0.03] rounded-sm p-4 border border-white/[0.06]">
                <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Client ID</div>
                <code className="text-xs text-white/40 font-mono break-all">{user.id.slice(0, 16)}...</code>
              </div>
            </div>

            {additionalPlans.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] text-white/30 tracking-widest uppercase mb-2">Additional Plans</div>
                <div className="flex flex-wrap gap-2">
                  {additionalPlans.map(p => (
                    <Badge key={p} label={planLabel(p)} color="#a78bfa" />
                  ))}
                </div>
              </div>
            )}

            {addons.length > 0 && (
              <div>
                <div className="text-[10px] text-white/30 tracking-widest uppercase mb-2">Add-ons</div>
                <div className="flex flex-wrap gap-2">
                  {addons.map(a => (
                    <Badge key={a} label={ADDON_DEFS[a]?.name || a} color="#22d3ee" />
                  ))}
                </div>
              </div>
            )}

            {(additionalPlans.length === 0 && addons.length === 0) && (
              <p className="text-xs text-white/20 italic">No additional plans or add-ons</p>
            )}
          </div>

          {/* ─── Organization Membership ───────────────────────── */}
          {isOrgManaged && (
            <div className="glass rounded-sm p-6 border border-white/[0.06] border-l-4" style={{ borderLeftColor: '#00d4ff' }}>
              <SectionHeader title="Organization" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0 border border-white/[0.06]">
                  <span className="text-lg text-[#00d4ff]">◆</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white/80 mb-1">{orgName}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/40 mb-2">
                    <span>Role: <span className="text-white/60 capitalize">{memRole || 'member'}</span></span>
                    <span>Status: <span className="text-white/60 capitalize">{memStatus || 'active'}</span></span>
                    {orgPlan && <span>Org Plan: <span className="text-white/60">{planLabel(orgPlan)}</span></span>}
                  </div>
                  <p className="text-xs text-white/30 leading-relaxed">
                    Your organization manages your base subscription. If you leave or are removed from the organization,
                    you can continue using your account with your own plan. Contact your org admin for plan changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isOrgManaged && (
            <div className="glass rounded-sm p-6 border border-white/[0.06] border-l-4" style={{ borderLeftColor: '#6b7280' }}>
              <SectionHeader title="Organization" />
              <p className="text-sm text-white/50">
                You are not currently part of an organization. Organizations provide shared intelligence, swarms,
                and centralized plan management. Speak to an admin about joining an org, or continue managing your
                own subscription independently.
              </p>
            </div>
          )}

          {/* ─── Available Plans ───────────────────────────────── */}
          <div className="glass rounded-sm p-6 border border-white/[0.06]">
            <SectionHeader title="Available Plans" />
            <p className="text-xs text-white/40 mb-5">
              Browse available plans below. Current plan is highlighted. Plan changes must be applied by an
              administrator — contact support or your org admin to switch.
            </p>

            <div className="space-y-6">
              {PLAN_CATEGORIES.map(cat => {
                const hasCurrent = cat.tiers.some(t => t.key === planTier)
                return (
                  <div key={cat.label}>
                    <h3 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: cat.color }}>
                      {cat.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {cat.tiers.map(tier => {
                        const isCurrent = tier.key === planTier
                        const isActive = additionalPlans.includes(tier.key)
                        return (
                          <div
                            key={tier.key}
                            className={`rounded-sm p-3 border transition-all ${
                              isCurrent
                                ? 'border-[#c8ff00]/40 bg-[#c8ff00]/5'
                                : isActive
                                ? 'border-[#a78bfa]/30 bg-[#a78bfa]/5'
                                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-sm font-medium ${isCurrent ? 'text-[#c8ff00]' : isActive ? 'text-[#a78bfa]' : 'text-white/60'}`}>
                                {tier.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[8px] uppercase tracking-widest text-[#c8ff00] bg-[#c8ff00]/10 px-1.5 py-0.5 rounded-sm">Active</span>
                              )}
                              {isActive && !isCurrent && (
                                <span className="text-[8px] uppercase tracking-widest text-[#a78bfa] bg-[#a78bfa]/10 px-1.5 py-0.5 rounded-sm">+Plan</span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/30 leading-relaxed">{tier.description}</p>
                            <div className="text-[9px] text-white/15 font-mono mt-1">{tier.key}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ═══ SIDEBAR ═══ */}
        <div className="lg:col-span-1 space-y-6">

          {/* ─── Plan Summary ──────────────────────────────────── */}
          <div className="glass rounded-sm p-5 border border-white/[0.06]">
            <SectionHeader title="Plan Summary" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Base Plan</span>
                <Badge label={planLabel(planTier)} color={planTier === 'none' ? '#6b7280' : '#c8ff00'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">+ Plans</span>
                <span className="text-xs text-white/60">{additionalPlans.length || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Add-ons</span>
                <span className="text-xs text-white/60">{addons.length || '0'}</span>
              </div>
            </div>
          </div>

          {/* ─── Add-ons ───────────────────────────────────────── */}
          <div className="glass rounded-sm p-5 border border-white/[0.06]">
            <SectionHeader title="Available Add-ons" />
            <div className="space-y-2.5">
              {Object.entries(ADDON_DEFS).map(([key, def]) => {
                const enabled = addons.includes(key)
                return (
                  <div key={key} className={`text-xs p-2.5 rounded-sm border ${
                    enabled
                      ? 'border-[#22d3ee]/30 bg-[#22d3ee]/5'
                      : 'border-white/[0.04] bg-white/[0.01]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={enabled ? 'text-[#22d3ee]' : 'text-white/50'}>{def.name}</span>
                      {enabled && <span className="text-[8px] uppercase text-[#22d3ee]">Enabled</span>}
                    </div>
                    <p className="text-[9px] text-white/25 mt-0.5">{def.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── Manage ────────────────────────────────────────── */}
          <div className="glass rounded-sm p-5 border border-white/[0.06] space-y-3">
            <SectionHeader title="Need Changes?" />
            <p className="text-xs text-white/40 leading-relaxed">
              Plan changes, add-on adjustments, and upgrades are managed by your administrator.
            </p>
            <Link
              href="/dashboard/client/profile"
              className="block text-center w-full px-4 py-2.5 bg-[#c8ff00]/10 border border-[#c8ff00]/25 text-[#c8ff00] text-xs font-semibold rounded-sm hover:bg-[#c8ff00]/20 transition-all"
            >
              View Profile →
            </Link>
            <Link
              href="/dashboard/client/settings"
              className="block text-center w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs rounded-sm hover:bg-white/[0.08] transition-all"
            >
              Account Settings →
            </Link>
          </div>

          {/* ─── Org Note ──────────────────────────────────────── */}
          {isOrgManaged && (
            <div className="glass rounded-sm p-5 border border-white/[0.06]" style={{ borderLeftColor: '#00d4ff', borderLeftWidth: 2 }}>
              <SectionHeader title="Org-Managed" />
              <p className="text-xs text-white/40 leading-relaxed">
                Your subscription is managed by <strong className="text-white/60">{orgName}</strong>.
                If you leave the organization, you can retain access by switching to an individual plan.
                Contact your org admin or support to make changes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
