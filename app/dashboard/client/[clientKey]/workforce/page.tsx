'use client'

import { useState } from 'react'
import ClientAgentsPage from '../agents/page'
import ClientSwarmsPage from '../swarms/page'
import ClientDepartmentsTab from './DeptsTab'

type Tab = 'employees' | 'teams' | 'depts'

const TABS: { key: Tab; label: string }[] = [
  { key: 'employees', label: 'Employees' },
  { key: 'teams', label: 'Teams' },
  { key: 'depts', label: 'Depts' },
]

/**
 * Consolidated Workforce page -- one nav link, three tabs, matching the
 * platform's customer-facing vocabulary: Agents -> Employees, Swarms ->
 * Teams, department-of-teams -> Depts.
 *
 * The Employees and Teams tabs reuse the existing, already-solid
 * ClientAgentsPage/ClientSwarmsPage components as-is rather than a full
 * rewrite -- their internal copy still says "Agent"/"Swarm" in places,
 * which is a separate, larger terminology sweep (same category as the
 * standing Vertical->Specialty and Blueprint->Essence Engine renames) --
 * not redone here. The tab labels and nav are the customer-facing framing;
 * a full internal-copy pass is still open.
 */
export default function ClientWorkforcePage() {
  const [tab, setTab] = useState<Tab>('employees')

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Workforce</h1>
        <p className="text-white/40 text-sm mt-1">Your Employees, Teams, and Depts -- all in one place</p>
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

      <div className={tab === 'employees' ? '' : 'hidden'}>
        <ClientAgentsPage />
      </div>
      <div className={tab === 'teams' ? '' : 'hidden'}>
        <ClientSwarmsPage />
      </div>
      <div className={tab === 'depts' ? '' : 'hidden'}>
        <ClientDepartmentsTab />
      </div>
    </div>
  )
}
