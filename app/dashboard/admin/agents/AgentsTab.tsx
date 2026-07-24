'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

const ROLES = ['CORE', 'VERTICAL', 'BRIDGE', 'CROSS_SYSTEM', 'UTILITY', 'CRISIS', 'SWARM', 'RESERVED'];

const ROLE_COLORS: Record<string, string> = {
  CORE:         'bg-purple-500/10 text-purple-400 border-purple-500/20',
  VERTICAL:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  BRIDGE:       'bg-green-500/10 text-green-400 border-green-500/20',
  CROSS_SYSTEM: 'bg-red-500/10 text-red-400 border-red-500/20',
  UTILITY:      'bg-white/5 text-white/50 border-white/10',
  CRISIS:       'bg-red-500 text-white border-red-500',
  SWARM:        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  RESERVED:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

function AgentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get('filter') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [agents, setAgents] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/agents?page=${page}&filter=${filter}`)
      .then(res => res.json())
      .then(data => {
        setAgents(data.agents || []);
        setCount(data.count || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Agents</h1>
          <p className="text-white/40 text-sm mt-1">
            {count} agent{count !== 1 ? 's' : ''} — <span className="text-white/30">{filter === 'all' ? 'All roles' : filter}</span>
          </p>
        </div>
        <Link
          href="/dashboard/admin/agents/new"
          className="px-4 py-2 text-sm font-medium bg-[#C6A664] text-black rounded-sm hover:bg-white transition-colors font-bold"
        >
          + New Agent
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filter}
          onChange={(e) => router.push(`/dashboard/admin/agents?filter=${e.target.value}`)}
          className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
        >
          <option value="all">All Roles ({count})</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
          <option value="null_role">NULL Role</option>
        </select>
      </div>

      {filter === 'null_role' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-sm p-4">
          <p className="text-sm text-yellow-300">
            ⚠️ Agents with NULL role_type need to be mapped.
            <Link href="/dashboard/admin/agents/bulk-import" className="underline ml-2 text-yellow-200">
              Bulk map roles →
            </Link>
          </p>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-sm overflow-hidden border border-white/[0.06]">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Agent ID</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Name</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Role</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Vertical</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Status</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Published</th>
              <th className="px-6 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-white/30 text-sm">Loading...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-white/30 text-sm">No agents found</td></tr>
            ) : agents.map((agent: any) => (
              <tr key={agent.agent_id || agent.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-white/50">{agent.agent_id || agent.id || '—'}</td>
                <td className="px-6 py-4 text-sm font-medium text-white/80">{agent.agent_name || agent.name || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${ROLE_COLORS[agent.role_type] || 'bg-white/5 text-white/40 border-white/10'}`}>
                    {agent.role_type || 'NULL'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white/50">{agent.vertical || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    agent.health_status === 'ACTIVE'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    {agent.health_status || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {agent.is_published ? (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Yes</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-white/30 border border-white/10">No</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/dashboard/admin/agents/${agent.agent_id || agent.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/30">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/dashboard/admin/agents?page=${page - 1}&filter=${filter}`} className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-sm text-white/60 hover:text-white">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/dashboard/admin/agents?page=${page + 1}&filter=${filter}`} className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-sm text-white/60 hover:text-white">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentsTab() {
  return (
    <Suspense fallback={<div className="p-6 text-white/30 text-sm">Loading agents...</div>}>
      <AgentsContent />
    </Suspense>
  );
}
