'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  vertical: string;
  category: string;
  run_status: string;
  is_active: boolean;
  assigned_client_id: string | null;
  assigned_agent_id: string | null;
  n8n_webhook_url: string | null;
  tags: string[];
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ['general', 'intake', 'assessment', 'essence', 'agent', 'swarm', 'consulting', 'automation'];
const STATUSES = ['draft', 'active', 'running', 'paused', 'completed', 'failed'];

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-white/10 text-white/70',
  intake: 'bg-blue-500/20 text-blue-300',
  assessment: 'bg-purple-500/20 text-purple-300',
  essence: 'bg-pink-500/20 text-pink-300',
  agent: 'bg-cyan-500/20 text-cyan-300',
  swarm: 'bg-orange-500/20 text-orange-300',
  consulting: 'bg-emerald-500/20 text-emerald-300',
  automation: 'bg-yellow-500/20 text-yellow-300',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  active: 'bg-green-500/20 text-green-300',
  running: 'bg-yellow-500/20 text-yellow-300 animate-pulse',
  paused: 'bg-amber-500/20 text-amber-300',
  completed: 'bg-blue-500/20 text-blue-300',
  failed: 'bg-red-500/20 text-red-300',
};

export default function WorkflowListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/workflows?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (err: any) {
      console.error('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const handleRun = async (id: string) => {
    try {
      const res = await fetch('/api/admin/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: id, triggeredBy: 'manual' }),
      });
      if (!res.ok) throw new Error('Failed to run workflow');
      alert('Workflow triggered!');
      fetchWorkflows();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      const res = await fetch(`/api/admin/workflows?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchWorkflows();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getAssignedText = (wf: Workflow) => {
    if (wf.assigned_client_id && wf.assigned_agent_id) return 'Client + Agent';
    if (wf.assigned_client_id) return 'Client';
    if (wf.assigned_agent_id) return 'Agent';
    return '—';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Workflows</h1>
          <p className="text-white/40 text-sm mt-1">Manage all workflow templates</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/admin/workflows')}
            className="px-4 py-2 text-sm font-medium bg-[#c8ff00] text-black rounded-sm hover:bg-white transition-colors font-bold"
          >
            + New Workflow
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-sm p-4 border border-white/[0.06] flex gap-4 items-center">
        <div>
          <label className="text-xs text-white/40 block mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-sm text-white/70"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-sm text-white/70"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-sm border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Vertical</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium">Last Run</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/40">Loading...</td>
                </tr>
              ) : workflows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/40">
                    No workflows found. Create one to get started.
                  </td>
                </tr>
              ) : (
                workflows.map((wf) => (
                  <tr
                    key={wf.id}
                    className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/admin/workflows?id=${wf.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-white/80 font-medium">{wf.name}</div>
                      <div className="flex gap-1.5 mt-1">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[wf.category] || CATEGORY_COLORS.general}`}>
                          {wf.category}
                        </span>
                        {wf.vertical && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-white/40 border border-white/10">
                            {wf.vertical}
                          </span>
                        )}
                      </div>
                      {wf.description && (
                        <div className="text-white/30 text-xs mt-1.5 leading-relaxed">{wf.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-xs font-medium ${CATEGORY_COLORS[wf.category] || CATEGORY_COLORS.general}`}>
                        {wf.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{wf.vertical}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-xs font-medium ${STATUS_COLORS[wf.run_status] || STATUS_COLORS.draft}`}>
                        {wf.run_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{getAssignedText(wf)}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {wf.last_run_at ? new Date(wf.last_run_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRun(wf.id); }}
                          disabled={wf.run_status === 'running'}
                          className="px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-sm hover:bg-blue-500/30 transition-colors disabled:opacity-40"
                        >
                          Run
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/admin/workflows?id=${wf.id}`); }}
                          className="px-3 py-1 text-xs font-medium bg-white/10 text-white/60 rounded-sm hover:bg-white/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(wf.id); }}
                          className="px-3 py-1 text-xs font-medium bg-red-500/20 text-red-300 rounded-sm hover:bg-red-500/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
