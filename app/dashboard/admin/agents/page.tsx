'use client'

import { useState } from 'react'
import AgentsTab from './AgentsTab'
import AgentRegistryPage from '../agent-registry/page'
import AdminMyAgentsPage from '../my-agents/page'

type Tab = 'all' | 'registry' | 'my_agents'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Essential Employees' },
  { key: 'registry', label: 'Registry' },
  { key: 'my_agents', label: 'My Deployments' },
]

/**
 * Consolidated Agents page -- folds the previously-separate Agents,
 * Agent Registry, and My Agents admin pages into one page with tabs.
 * The old standalone routes (/dashboard/admin/agent-registry,
 * /dashboard/admin/my-agents) still exist and work if linked directly,
 * they're just no longer separate nav entries.
 */
export default function AdminAgentsConsolidatedPage() {
  const [tab, setTab] = useState<Tab>('all')

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Essential Employees</h1>
        <p className="text-white/40 text-sm mt-1">Full catalog, registry, and your own deployments</p>
      </div>

      <div className="flex gap-1 mb-8 border-b border-white/[0.06]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-medium tracking-wide transition-all border-b-2 -mb-px ${
              tab === t.key
                ? 'border-[#C6A664] text-white'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={tab === 'all' ? '' : 'hidden'}>
        <AgentsTab />
      </div>
      <div className={tab === 'registry' ? '' : 'hidden'}>
        <AgentRegistryPage />
      </div>
      <div className={tab === 'my_agents' ? '' : 'hidden'}>
        <AdminMyAgentsPage />
      </div>
    </div>
  )
}
