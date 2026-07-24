'use client'

import { useState } from 'react'
import SwarmsTab from './SwarmsTab'
import AdminMySwarmsPage from '../my-swarms/page'
import AdminDepartmentsTab from './DepartmentsTab'

type Tab = 'swarms' | 'my_swarms' | 'departments'

const TABS: { key: Tab; label: string }[] = [
  { key: 'swarms', label: 'Swarms' },
  { key: 'my_swarms', label: 'My Deployments' },
  { key: 'departments', label: 'Departments' },
]

/**
 * Consolidated Swarms & Departments page -- folds the previously-separate
 * Swarms and My Swarms admin pages together with a new Departments tab
 * (departments had no admin UI at all before this). The old standalone
 * /dashboard/admin/my-swarms route still exists and works if linked
 * directly, it's just no longer a separate nav entry.
 */
export default function AdminSwarmsConsolidatedPage() {
  const [tab, setTab] = useState<Tab>('swarms')

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Swarms &amp; Departments</h1>
        <p className="text-white/40 text-sm mt-1">Swarm templates, your own deployments, and cross-client department oversight</p>
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

      <div className={tab === 'swarms' ? '' : 'hidden'}>
        <SwarmsTab />
      </div>
      <div className={tab === 'my_swarms' ? '' : 'hidden'}>
        <AdminMySwarmsPage />
      </div>
      <div className={tab === 'departments' ? '' : 'hidden'}>
        <AdminDepartmentsTab />
      </div>
    </div>
  )
}
