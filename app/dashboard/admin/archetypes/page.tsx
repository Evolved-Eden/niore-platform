'use client';

import { useState, useEffect } from 'react';

interface Archetype {
  archetype_id: string;
  archetype_name: string;
  description: string | null;
  base_capability: number | null;
  base_trust: number | null;
  base_synergy: number | null;
  base_activation: number | null;
  base_evolution: number | null;
  base_risk: number | null;
  category: string | null;
  default_avatar: string | null;
  default_decision_mode: string | null;
  agent_count: number;
  sample_agents: string[];
}

export default function ArchetypesPage() {
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAgents, setTotalAgents] = useState(0);

  useEffect(() => {
    fetch('/api/admin/archetypes')
      .then(res => res.json())
      .then(data => {
        setArchetypes(data.archetypes || []);
        setTotalAgents(data.total_agents || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Stats
  const mapped = archetypes.filter(a => a.agent_count > 0).length;
  const unmapped = archetypes.reduce((sum, a) => a.archetype_id === 'UNMAPPED' ? sum + a.agent_count : sum, 0);

  return (
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Archetypes</h1>
          <p className="text-white/40 text-sm mt-1">
            {archetypes.length} archetypes · {totalAgents} agents deployed
            {unmapped > 0 && <span className="text-amber-400/60"> · {unmapped} unmapped</span>}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Archetypes', value: archetypes.length, color: 'text-white' },
          { label: 'Archetypes In Use', value: mapped, color: 'text-green-400' },
          { label: 'Total Agents Deployed', value: totalAgents, color: 'text-blue-400' },
          { label: 'Avg Agents/Arch', value: mapped > 0 ? (totalAgents / mapped).toFixed(1) : '0', color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-sm p-4 border border-white/[0.06]">
            <div className="text-xs text-white/40">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/30 text-sm">Loading archetypes...</div>
      ) : archetypes.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No archetypes found in database</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archetypes
            .filter(a => a.archetype_id !== 'UNMAPPED')
            .sort((a, b) => (b.agent_count || 0) - (a.agent_count || 0))
            .map((arc) => (
            <div key={arc.archetype_id} className={`glass rounded-sm p-5 border border-white/[0.06] border-l-4 ${
              arc.agent_count > 0 ? 'border-l-[#C6A664]' : 'border-l-white/10'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white/90">{arc.archetype_name}</h3>
                  <p className="text-xs text-white/40 font-mono mt-0.5">{arc.archetype_id}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${
                  arc.agent_count > 0
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {arc.agent_count} agent{arc.agent_count !== 1 ? 's' : ''}
                </span>
              </div>

              {arc.description && (
                <p className="text-xs text-white/40 mb-3">{arc.description}</p>
              )}

              {/* Base stats row */}
              <div className="flex gap-3 text-[10px] mb-3">
                {arc.base_capability != null && <span className="text-blue-400/70">Cap {arc.base_capability}</span>}
                {arc.base_trust != null && <span className="text-green-400/70">Trust {arc.base_trust}</span>}
                {arc.base_synergy != null && <span className="text-purple-400/70">Syn {arc.base_synergy}</span>}
                {arc.base_risk != null && <span className="text-red-400/70">Risk {arc.base_risk}</span>}
              </div>

              {/* Sample agents */}
              {arc.sample_agents && arc.sample_agents.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {arc.sample_agents.slice(0, 4).map((name: string) => (
                    <span key={name} className="px-1.5 py-0.5 bg-white/5 text-white/50 border border-white/10 rounded text-[10px]">
                      {name}
                    </span>
                  ))}
                  {arc.agent_count > 4 && (
                    <span className="px-1.5 py-0.5 text-white/30 text-[10px]">+{arc.agent_count - 4}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Unmapped agents */}
      {unmapped > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm p-4">
          <p className="text-sm text-amber-300">
            ⚠️ {unmapped} agent{unmapped !== 1 ? 's' : ''} {unmapped !== 1 ? 'are' : 'is'} not assigned to any archetype
            (archetype_id is NULL).
          </p>
        </div>
      )}
    </div>
  );
}
