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

export default async function AdminOverview() {
  // ── Agent catalog (416 agents) ──
  const { data: agentCatalog } = await supabaseAdmin
    .from('agent_catalog')
    .select('role_type, category, agent_specialty, is_system_agent')

  const agentCount = agentCatalog?.length ?? 0

  // Role distribution
  const roleGroups: Record<string, number> = {}
  if (agentCatalog) {
    for (const row of agentCatalog) {
      const role = row.role_type || 'NULL'
      roleGroups[role] = (roleGroups[role] || 0) + 1
    }
  }
  const roleDistribution = Object.fromEntries(
    Object.entries(roleGroups).sort((a, b) => b[1] - a[1])
  )

  // Category distribution (mas_category from agents)
  const catGroups: Record<string, number> = {}
  if (agentCatalog) {
    for (const row of agentCatalog) {
      const cat = row.category || 'Uncategorized'
      catGroups[cat] = (catGroups[cat] || 0) + 1
    }
  }
  const categoryDistribution = Object.fromEntries(
    Object.entries(catGroups).sort((a, b) => b[1] - a[1])
  )

  const systemAgentCount = agentCatalog?.filter(a => a.is_system_agent).length ?? 0

  // ── Swarm catalog (64 swarm templates) ──
  const { count: swarmCount } = await supabaseAdmin
    .from('swarm_catalog')
    .select('*', { count: 'exact', head: true })

  // ── Core entity counts ──
  const [userCount, clientCount, orgCount, archetypeCount, generatorCount,
         essenceboardCount, essintelligenceCount, workflowCount, avatarCount, tierCount] = await Promise.all([
    count('users'), count('clients'), count('organizations'),
    count('archetypes'), count('agent_generators'),
    count('essenceboard_templates'), count('essintelligence_templates'), count('workflow_templates'),
    count('avatars'), count('tier_entitlements'),
  ])

  // ── Active tables (non-empty, from pg_stat_user_tables) ──
  const { data: activeTables } = await supabaseAdmin
    .from('active_tables')
    .select('table_name, row_estimate')
    .order('row_estimate', { ascending: false })

  const populatedTables = activeTables?.filter(t => (t.row_estimate ?? 0) > 0) ?? []
  const totalRowEstimate = populatedTables.reduce((a, t) => a + (t.row_estimate ?? 0), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">OmniGrid Control</h1>
          <p className="text-white/40 text-sm mt-1">
            {populatedTables.length} active tables · {totalRowEstimate.toLocaleString()} total rows · {agentCount} agents · {userCount} users · {orgCount} orgs
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full border border-[#7A2E32]/30 text-[#7A2E32] bg-[#7A2E32]/10 tracking-widest uppercase">
          Elevated Access
        </span>
      </div>

      {/* Personal Hub */}
      <div className="glass rounded-sm p-5 border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#7A2E32]" />
          <h2 className="text-xs text-white/30 tracking-widest uppercase">Personal Hub</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <HubLink href="/dashboard/admin/essence-profile" label="My Essence Profile" icon="◆" color="#7A2E32" />
          <HubLink href="/dashboard/admin/essence" label="Essence Intel" icon="⊙" color="#8B7AA8" />
          <HubLink href="/dashboard/admin/twin" label="My Twin" icon="⟐" color="#8B7AA8" />
          <HubLink href="/dashboard/chat" label="Chat / Prompt" icon="☆" color="#B5764A" />
          <HubLink href="/dashboard/admin/agents" label="My Agents" icon="⊕" color="#5E8B84" />
          <HubLink href="/dashboard/admin/swarms" label="My Swarms" icon="⊗" color="#5E8B84" />
        </div>
      </div>

      {/* Core Stats — sourced from agent_catalog + swarm_catalog views */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Agents" value={agentCount} color="#C6A664" icon="🤖" />
        <StatCard label="Swarms" value={swarmCount ?? 0} color="#5E8B84" icon="🐝" />
        <StatCard label="Generators" value={generatorCount} color="#8B7AA8" icon="⚙️" />
        <StatCard label="Templates" value={essenceboardCount + essintelligenceCount + workflowCount} color="#B5764A" icon="📋" detail={`${essenceboardCount}EB · ${essintelligenceCount}EI · ${workflowCount}W`} />
        <StatCard label="Users" value={userCount} color="#7A2E32" icon="👥" />
        <StatCard label="Clients" value={clientCount} color="#5E8B84" icon="📋" />
      </div>

      {/* Extended Stats Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="Archetypes" value={archetypeCount} color="#C6A664" />
        <MiniStat label="Avatars" value={avatarCount} color="#8B7AA8" />
        <MiniStat label="Tiers" value={tierCount} color="#C9974A" />
        <MiniStat label="System Agents" value={systemAgentCount} color="#C6A664" />
      </div>

      {/* Role Distribution + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-sm p-6">
          <h2 className="text-xs text-white/30 tracking-widest uppercase mb-4">Agent Role Distribution</h2>
          {Object.keys(roleDistribution).length > 0 ? (
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

        <div className="flex flex-col gap-4">
          <div className="glass rounded-sm p-6">
            <h2 className="text-xs text-white/30 tracking-widest uppercase mb-4">Agent Categories</h2>
            {Object.keys(categoryDistribution).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(categoryDistribution).slice(0, 5).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{cat}</span>
                    <span className="text-sm font-mono text-white/80">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/30 text-sm">No categories</p>
            )}
          </div>

          <div className="glass rounded-sm p-6">
            <h2 className="text-xs text-white/30 tracking-widest uppercase mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <AddButton href="/dashboard/admin/agents/new" label="New Agent" color="#C6A664" />
              <AddButton href="/dashboard/admin/swarms/new" label="New Swarm" color="#5E8B84" />
              <AddButton href="/dashboard/admin/zuri" label="Configure Zuri" color="#8B7AA8" />
              <AddButton href="/dashboard/admin/generators/new" label="New Generator" color="#8B7AA8" />
              <AddButton href="/dashboard/admin/users" label="Manage Users" color="#7A2E32" />
              <AddButton href="/dashboard/admin/workflows" label="Design Workflow" color="#B5764A" />
              <AddButton href="/dashboard/admin/templates" label="Templates" color="#5E8B84" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Tables Browser — sourced from active_tables view */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs text-white/30 tracking-widest uppercase">
            Active Tables · {populatedTables.length} with data · {totalRowEstimate.toLocaleString()} rows
          </h2>
          <span className="text-[10px] text-white/20">
            Live from pg_stat_user_tables
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {populatedTables.map((t) => {
            const rows = t.row_estimate ?? 0
            const intensity = Math.min(1, rows / 10000)
            return (
              <div
                key={t.table_name}
                className="px-3 py-2 rounded-sm text-xs font-mono border bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-[140px]" title={t.table_name}>{t.table_name}</span>
                  <span
                    className="tabular-nums shrink-0"
                    style={{
                      color: intensity > 0.5 ? '#C6A664' : intensity > 0.1 ? '#60a5fa' : '#94a3b8'
                    }}
                  >
                    {rows.toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-sm p-4 border border-white/[0.06] flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#5E8B84] animate-pulse-slow" />
          <div>
            <div className="text-xs text-white/30">Database</div>
            <div className="text-sm text-white/70">Connected · {populatedTables.length} active tables</div>
          </div>
        </div>
        <div className="glass rounded-sm p-4 border border-white/[0.06] flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#C6A664] animate-pulse-slow" />
          <div>
            <div className="text-xs text-white/30">Agents</div>
            <div className="text-sm text-white/70">{agentCount} catalogued · {systemAgentCount} system · {Object.keys(roleDistribution).length} role types</div>
          </div>
        </div>
        <div className="glass rounded-sm p-4 border border-white/[0.06] flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#5E8B84] animate-pulse-slow" />
          <div>
            <div className="text-xs text-white/30">Templates</div>
            <div className="text-sm text-white/70">{essenceboardCount + essintelligenceCount + workflowCount} active · {swarmCount ?? 0} swarms</div>
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

function HubLink({ href, label, icon, color }: { href: string; label: string; icon: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-sm border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03] transition-all group"
    >
      <span className="text-sm" style={{ color }}>{icon}</span>
      <span className="text-sm text-white/50 group-hover:text-white transition-colors">{label}</span>
    </Link>
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
