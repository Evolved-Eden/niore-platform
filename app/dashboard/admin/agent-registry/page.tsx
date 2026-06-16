'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RegistryAgent {
  id: string;
  agent_id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  long_description: string | null;
  icon: string | null;
  color: string | null;
  capabilities: string[] | null;
  triggers: string[] | null;
  data_sources: string[] | null;
  outputs: string[] | null;
  workflow_ids: string[] | null;
  agent_type: string | null;
  category: string | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  concierge:  'border-l-[#00d4ff]',
  sales:      'border-l-[#c8ff00]',
  marketing:  'border-l-[#a78bfa]',
  retention:  'border-l-[#ff6b6b]',
  operations: 'border-l-[#fb923c]',
  real_estate:'border-l-[#00d4ff]',
  wealth:     'border-l-[#c8ff00]',
  creator:    'border-l-[#a78bfa]',
  commerce:   'border-l-[#ff6b6b]',
  automation: 'border-l-[#fb923c]',
  ai:         'border-l-[#00d4ff]',
  wellness:   'border-l-[#c8ff00]',
  analytics:  'border-l-[#a78bfa]',
  compliance: 'border-l-[#ff6b6b]',
};

export default function AgentRegistryPage() {
  const [agents, setAgents] = useState<RegistryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deploying, setDeploying] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/agent-registry?active=true')
      .then(res => res.json())
      .then(data => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(agents.map(a => a.category).filter(Boolean))] as string[];
  const filtered = agents.filter(a => {
    if (search && !a.name?.toLowerCase().includes(search.toLowerCase()) && !a.agent_id?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    return true;
  });

  const handleDeploy = async (agent: RegistryAgent) => {
    setDeploying(agent.agent_id);
    // Navigate to new agent page with the agent_id pre-selected
    window.location.href = `/dashboard/admin/agents/new?from_registry=${agent.agent_id}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Agent Registry</h1>
          <p className="text-white/40 text-sm mt-1">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} available in the catalog
          </p>
        </div>
        <Link
          href="/dashboard/admin/agents/new"
          className="px-4 py-2 text-sm font-medium bg-[#c8ff00] text-black rounded-sm hover:bg-white transition-colors font-bold"
        >
          + Deploy New
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents..."
          className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30 w-64"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
        >
          <option value="all">All Categories</option>
          {categories.sort().map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <span className="text-xs text-white/30 ml-auto">{filtered.length} of {agents.length}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-white/30 text-sm">Loading catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">
          {search || filterCategory !== 'all' ? 'No agents match your filters' : 'No agents in registry yet'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className={`glass rounded-sm p-5 border border-white/[0.06] border-l-4 ${
                CATEGORY_COLORS[agent.category || ''] || 'border-l-white/20'
              } hover:bg-white/[0.05] transition-all group`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{agent.icon || '🤖'}</span>
                    <h3 className="font-bold text-white/90 truncate">{agent.name}</h3>
                  </div>
                  {agent.tagline && (
                    <p className="text-xs text-white/50 mt-1">{agent.tagline}</p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${
                  agent.is_active
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {agent.agent_type || agent.category || 'general'}
                </span>
              </div>

              {/* Capabilities */}
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {agent.capabilities.slice(0, 4).map((cap) => (
                    <span key={cap} className="px-1.5 py-0.5 bg-white/5 text-white/50 border border-white/10 rounded text-[10px]">
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 4 && (
                    <span className="px-1.5 py-0.5 text-white/30 text-[10px]">+{agent.capabilities.length - 4}</span>
                  )}
                </div>
              )}

              {/* Description */}
              {agent.description && (
                <p className="text-xs text-white/40 leading-relaxed mb-3 line-clamp-2">{agent.description}</p>
              )}

              {/* Data flow */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/30 mb-4">
                {agent.triggers && agent.triggers.length > 0 && (
                  <span>⚡ {agent.triggers.slice(0, 2).join(', ')}</span>
                )}
                {agent.outputs && agent.outputs.length > 0 && (
                  <span>→ {agent.outputs.slice(0, 2).join(', ')}</span>
                )}
              </div>

              {/* Deploy button */}
              <button
                onClick={() => handleDeploy(agent)}
                disabled={deploying === agent.agent_id}
                className="w-full py-2 text-xs font-bold bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20 rounded-sm hover:bg-[#c8ff00]/20 transition-colors disabled:opacity-50"
              >
                {deploying === agent.agent_id ? 'Redirecting...' : 'Deploy to My Organization'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
