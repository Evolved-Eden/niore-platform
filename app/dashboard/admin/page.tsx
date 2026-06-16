import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function count(table: string): Promise<number> {
  try {
    const { count: c, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })
    if (error) return 0
    return c ?? 0
  } catch { return 0 }
}

const TABLE_CATEGORIES: { label: string; color: string; tables: string[] }[] = [
  { label: 'Core Infrastructure', color: '#ff6b6b', tables: [
    'agents', 'agent_types', 'agent_memory', 'agent_capabilities', 'agent_forms', 'agent_metrics',
    'agent_schedules', 'agent_tags', 'agent_tag_map', 'agent_activity_log', 'agent_responses',
    'agent_tools', 'agent_webhooks',
  ]},
  { label: 'Swarm & MAS', color: '#00d4ff', tables: [
    'agent_swarms', 'swarm_templates', 'swarm_mas_snapshots', 'swarm_mas_config',
    'swarm_agents', 'agent_swarm_members', 'agent_mas_history',
  ]},
  { label: 'Templates & Workflows', color: '#c8ff00', tables: [
    'blueprint_templates', 'essence_templates', 'workflow_templates', 'agent_generators',
    'execution_templates', 'workflow_states', 'workflow_jobs', 'workflow_logs',
    'workflow_schedules', 'workflow_triggers',
  ]},
  { label: 'Identity & Access', color: '#a78bfa', tables: [
    'users', 'organizations', 'organization_members', 'roles', 'permissions', 'role_permissions',
    'user_roles', 'user_sessions', 'sessions', 'api_keys', 'invitations',
  ]},
  { label: 'Clients & Business', color: '#34d399', tables: [
    'clients', 'client_settings', 'client_essences', 'client_notes', 'client_tags',
    'integrations', 'integrations_auth', 'integration_endpoints',
  ]},
  { label: 'Content & Assets', color: '#fb923c', tables: [
    'blueprints', 'essences', 'assessments', 'assessment_answers', 'archetypes',
    'avatars', 'documents', 'files', 'images', 'notes',
  ]},
  { label: 'Communications', color: '#f472b6', tables: [
    'messages', 'message_templates', 'notifications', 'notification_log',
    'email_logs', 'announcements', 'chat_sessions',
  ]},
  { label: 'Commerce & Billing', color: '#e879f9', tables: [
    'membership_tiers', 'tier_entitlements', 'memberships', 'entitlements',
    'payments', 'payouts', 'coupons',
  ]},
  { label: 'State & Observability', color: '#22d3ee', tables: [
    'state_transitions', 'routing_rules', 'sla_policies', 'approval_matrix',
    'model_configs', 'webhook_endpoints', 'prompt_versions', 'events', 'audit_logs',
  ]},
  { label: 'Vertical Data', color: '#fbbf24', tables: [
    'verticals', 'vertical_subs', 'specialties', 'industries', 'tags',
    'categories', 'locations',
  ]},
  { label: 'Social & Marketing', color: '#60a5fa', tables: [
    'social_posts', 'social_accounts', 'social_analytics', 'social_campaigns',
    'testimonials', 'reviews',
  ]},
  { label: 'System & Config', color: '#94a3b8', tables: [
    'app_settings', 'feature_flags', 'system_config', 'migrations',
    'import_logs', 'export_logs', 'cache', 'search_index',
  ]},
]

export default async function AdminOverview() {
  const [agentCount, swarmCount, generatorCount, archetypeCount, userCount, clientCount, 
         templateCount, workflowCount, blueprintCount, essenceCount, 
         capCount, memoryCount, orgCount, tierCount, membershipCount] = await Promise.all([
    count('agents'), count('swarm_templates'), count('agent_generators'), count('archetypes'),
    count('users'), count('clients'), count('blueprint_templates'), count('workflow_templates'),
    count('blueprint_templates'), count('essence_templates'), count('agent_capabilities'),
    count('agent_memory'), count('organizations'), count('membership_tiers'), count('memberships'),
  ])

  let roleDistribution: Record<string, number> | undefined
  try {
    const { data } = await supabaseAdmin
      .from('agents')
      .select('role_type')
    if (data && data.length > 0) {
      const groups: Record<string, number> = {}
      for (const row of data) {
        const role = (row as any).role_type || 'NULL'
        groups[role] = (groups[role] || 0) + 1
      }
      roleDistribution = Object.fromEntries(
        Object.entries(groups).sort((a, b) => b[1] - a[1])
      )
    }
  } catch {}

  const catCounts: Record<string, { table: string; count: number }[]> = {}
  for (const cat of TABLE_CATEGORIES) {
    const counts = await Promise.all(cat.tables.map(async (t) => {
      const c = await count(t)
      return { table: t, count: c }
    }))
    catCounts[cat.label] = counts
  }

  const totalTables = TABLE_CATEGORIES.reduce((a, c) => a + c.tables.length, 0)
  const totalRows = Object.values(catCounts).flat().reduce((a, t) => a + t.count, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">OmniGrid Control</h1>
          <p className="text-white/40 text-sm mt-1">
            {totalTables} tables · {totalRows.toLocaleString()} total rows · {agentCount} agents · {userCount} users
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full border border-[#ff6b6b]/30 text-[#ff6b6b] bg-[#ff6b6b]/10 tracking-widest uppercase">
          Elevated Access
        </span>
      </div>

      {/* Core Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Agents" value={agentCount} color="#c8ff00" icon="🤖" />
        <StatCard label="Swarms" value={swarmCount} color="#00d4ff" icon="🐝" />
        <StatCard label="Generators" value={generatorCount} color="#a78bfa" icon="⚙️" />
        <StatCard label="Templates" value={templateCount + essenceCount + workflowCount} color="#fb923c" icon="📋" detail={`${blueprintCount}B · ${essenceCount}E · ${workflowCount}W`} />
        <StatCard label="Users" value={userCount} color="#ff6b6b" icon="👥" />
        <StatCard label="Clients" value={clientCount} color="#34d399" icon="📋" />
      </div>

      {/* Extended Stats Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="Archetypes" value={archetypeCount} color="#f472b6" />
        <MiniStat label="Capabilities" value={capCount} color="#22d3ee" />
        <MiniStat label="Tiers" value={tierCount} color="#e879f9" />
        <MiniStat label="Memberships" value={membershipCount} color="#fbbf24" />
      </div>

      {/* Role Distribution + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-sm p-6">
          <h2 className="text-xs text-white/30 tracking-widest uppercase mb-4">Agent Role Distribution</h2>
          {roleDistribution && Object.keys(roleDistribution).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(roleDistribution).map(([role, count]) => (
                <div key={role} className="bg-white/5 rounded-sm p-4 border border-white/5">
                  <div className="text-xs text-white/40">{role}</div>
                  <div className="text-2xl font-bold text-white mt-1">{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm">No agents found with role_type set</p>
          )}
        </div>

        <div className="glass rounded-sm p-6">
          <h2 className="text-xs text-white/30 tracking-widest uppercase mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <AddButton href="/dashboard/admin/agents/new" label="New Agent" color="#c8ff00" />
            <AddButton href="/dashboard/admin/swarms/new" label="New Swarm" color="#00d4ff" />
            <AddButton href="/dashboard/admin/zuri" label="Configure Zuri" color="#a78bfa" />
            <AddButton href="/dashboard/admin/generators/new" label="New Generator" color="#a78bfa" />
            <AddButton href="/dashboard/admin/users" label="Manage Users" color="#ff6b6b" />
            <AddButton href="/dashboard/admin/workflows" label="Design Workflow" color="#fb923c" />
            <AddButton href="/dashboard/admin/templates" label="Templates" color="#34d399" />
          </div>
        </div>
      </div>

      {/* Full Table Browser */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs text-white/30 tracking-widest uppercase">
            Database Tables · {totalTables} total · {totalRows.toLocaleString()} rows
          </h2>
          <span className="text-[10px] text-white/20">
            Live from Supabase
          </span>
        </div>

        <div className="space-y-6">
          {TABLE_CATEGORIES.map((cat) => {
            const counts = catCounts[cat.label] || []
            const catTotal = counts.reduce((a, t) => a + t.count, 0)
            const filled = counts.filter(t => t.count > 0).length

            return (
              <div key={cat.label}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-medium text-white/50 tracking-wider">{cat.label}</span>
                  <span className="text-[10px] text-white/20">
                    {filled}/{counts.length} tables · {catTotal.toLocaleString()} rows
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {counts.map((t) => (
                    <div
                      key={t.table}
                      className={`px-2.5 py-1.5 rounded-sm text-xs font-mono border ${
                        t.count > 0
                          ? 'bg-white/[0.03] border-white/[0.06] text-white/60'
                          : 'bg-white/[0.01] border-white/[0.03] text-white/20'
                      }`}
                    >
                      <div className="truncate" title={t.table}>{t.table}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: t.count > 0 ? cat.color : undefined, opacity: t.count > 0 ? 1 : 0.3 }}>
                        {t.count.toLocaleString()} rows
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-sm p-4 border border-white/[0.06] flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse-slow" />
          <div>
            <div className="text-xs text-white/30">Database</div>
            <div className="text-sm text-white/70">Connected · {totalTables} tables</div>
          </div>
        </div>
        <div className="glass rounded-sm p-4 border border-white/[0.06] flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse-slow" />
          <div>
            <div className="text-xs text-white/30">Agents</div>
            <div className="text-sm text-white/70">{agentCount} deployed · {Object.values(roleDistribution || {}).reduce((a, b) => a + b, 0)} roles</div>
          </div>
        </div>
        <div className="glass rounded-sm p-4 border border-white/[0.06] flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse-slow" />
          <div>
            <div className="text-xs text-white/30">Templates</div>
            <div className="text-sm text-white/70">{blueprintCount + essenceCount + workflowCount} active · {swarmCount} swarms</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon, detail }: { label: string; value: number; color: string; icon: string; detail?: string }) {
  return (
    <div className="glass rounded-sm p-5 border border-white/[0.06]">
      <div className="text-lg mb-2">{icon}</div>
      <div className="text-2xl font-light" style={{ color }}>{value}</div>
      <div className="text-xs text-white/30 tracking-widest uppercase mt-1">{label}</div>
      {detail && <div className="text-[10px] text-white/20 mt-0.5">{detail}</div>}
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass rounded-sm p-4 border border-white/[0.06] flex items-center justify-between">
      <div className="text-xs text-white/30 tracking-wider">{label}</div>
      <div className="text-lg font-light" style={{ color }}>{value}</div>
    </div>
  )
}

function AddButton({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 rounded-sm border border-white/[0.06] hover:border-white/[0.15] transition-all group"
    >
      <span className="text-sm text-white/60 group-hover:text-white transition-colors">{label}</span>
      <span className="text-lg" style={{ color }}>+</span>
    </Link>
  )
}
