'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RegistryAgent {
  id: string;
  agent_id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  capabilities: string[] | null;
  agent_type: string | null;
  category: string | null;
  vertical_ids: string[] | null;
  triggers: string[] | null;
  data_sources: string[] | null;
  outputs: string[] | null;
}

interface LookupItem {
  role_type_id?: string;
  display_name?: string;
  avatar_id?: string;
  name?: string;
  mode_id?: string;
  status_id?: string;
  priority?: number;
  key?: string;
  description?: string;
  archetype_id?: string;
  archetype_name?: string;
}

interface LookupData {
  role_types: LookupItem[];
  avatars: LookupItem[];
  decision_modes: LookupItem[];
  health_statuses: LookupItem[];
  evolution_statuses: LookupItem[];
  agent_types: LookupItem[];
  archetypes: LookupItem[];
  _errors?: string[];
}

export default function CreateAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registryAgents, setRegistryAgents] = useState<RegistryAgent[]>([]);
  const [registryLoading, setRegistryLoading] = useState(true);
  const [lookups, setLookups] = useState<LookupData | null>(null);
  const [selectedRegistryAgent, setSelectedRegistryAgent] = useState<RegistryAgent | null>(null);
  const [formData, setFormData] = useState({
    agent_id: '',
    agent_name: '',
    vertical: '',
    vertical_subs: [] as string[],
    role_type: '',
    archetype_id: 'ARC-001',
    avatar: 'EDEN',
    primary_template: '',
    secondary_template: '',
    primary_system: '',
    secondary_system: '',
    tertiary_system: '',
    autonomy_level: 1,
    authority_level: 1,
    risk_level: 1,
    decision_mode: 'WEIGHTED',
    health_status: 'ACTIVE',
    evolution_status: 'STABLE',
    reserved_metadata: {} as Record<string, unknown>,
  });

  // Fetch registry + lookups in parallel
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/agent-registry?active=true').then(r => r.json()),
      fetch('/api/admin/lookups').then(r => r.json()),
    ]).then(([regData, lookupData]) => {
      const agents = regData.agents || [];
      setRegistryAgents(agents);
      setLookups(lookupData);
      setRegistryLoading(false);

      // Auto-select if navigated from Agent Registry page
      const params = new URLSearchParams(window.location.search);
      const fromRegistry = params.get('from_registry');
      if (fromRegistry && agents.length > 0) {
        const match = agents.find((a: RegistryAgent) => a.agent_id === fromRegistry);
        if (match) {
          setSelectedRegistryAgent(match);
          setFormData(prev => ({
            ...prev,
            agent_id: match.agent_id,
            agent_name: match.name,
          }));
        }
      }
    }).catch(() => setRegistryLoading(false));
  }, []);

  const handleRegistrySelect = (agentId: string) => {
    const reg = registryAgents.find(a => a.agent_id === agentId) || null;
    setSelectedRegistryAgent(reg);
    setFormData(prev => ({
      ...prev,
      agent_id: agentId,
      agent_name: reg?.name || prev.agent_name,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create agent');
      }
      router.push('/dashboard/admin/agents');
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">New Agent</h1>
          <p className="text-white/40 text-sm mt-1">
            Deploy an agent from the <span className="text-[#c8ff00]">registry</span> or create a custom one
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">

        {/* ── Registry Select ── */}
        <div className="glass rounded-sm p-5 border border-white/[0.06]">
          <label className="block text-sm font-medium text-white/70 mb-2">
            Agent from Registry <span className="text-white/30 font-normal">(or type ID manually below)</span>
          </label>
          <select
            value={formData.agent_id}
            onChange={(e) => handleRegistrySelect(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white/70"
          >
            <option value="">— Select a registry agent —</option>
            {registryAgents.map((reg) => (
              <option key={reg.id} value={reg.agent_id}>
                {reg.name} ({reg.agent_id}) — {reg.agent_type || reg.category || 'general'}
              </option>
            ))}
          </select>
          {selectedRegistryAgent && (
            <div className="mt-3 p-3 bg-white/[0.03] border border-white/10 rounded-sm text-sm space-y-2">
              <p className="text-white/80 font-medium">{selectedRegistryAgent.tagline || ''}</p>
              {selectedRegistryAgent.description && (
                <p className="text-white/50 text-xs">{selectedRegistryAgent.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs">
                {selectedRegistryAgent.capabilities && selectedRegistryAgent.capabilities.length > 0 && (
                  <span className="text-cyan-400/70">
                    Capabilities: {selectedRegistryAgent.capabilities.join(', ')}
                  </span>
                )}
                {selectedRegistryAgent.triggers && selectedRegistryAgent.triggers.length > 0 && (
                  <span className="text-amber-400/70">Triggers: {selectedRegistryAgent.triggers.join(', ')}</span>
                )}
                {selectedRegistryAgent.outputs && selectedRegistryAgent.outputs.length > 0 && (
                  <span className="text-green-400/70">Outputs: {selectedRegistryAgent.outputs.join(', ')}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Identity Section ── */}
        <div className="glass rounded-sm p-5 border border-white/[0.06] space-y-4">
          <h2 className="text-sm font-semibold text-white/60 tracking-wider uppercase">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Agent ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.agent_id}
                onChange={(e) => { setFormData({ ...formData, agent_id: e.target.value }); setSelectedRegistryAgent(null); }}
                placeholder="e.g. sales_qualifier"
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Agent Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.agent_name}
                onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                placeholder="Lead Sales Agent"
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Role Type <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.role_type}
                onChange={(e) => setFormData({ ...formData, role_type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
              >
                <option value="">Select Role Type</option>
                {(lookups?.role_types || []).map((r) => (
                  <option key={r.role_type_id} value={r.role_type_id!}>
                    {r.display_name || r.role_type_id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-white/40 mt-1">Loaded from DB — edit role_types table to update</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Archetype <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.archetype_id}
                onChange={(e) => setFormData({ ...formData, archetype_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
              >
                {(lookups?.archetypes || []).map((a) => (
                  <option key={a.archetype_id} value={a.archetype_id!}>
                    {a.archetype_name || a.archetype_id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Avatar <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(lookups?.avatars || []).length > 0 ? (
                (lookups!.avatars).map((av) => (
                  <button
                    key={av.avatar_id || av.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: av.avatar_id || av.name || '' })}
                    className={`p-3 border rounded-sm text-center ${
                      formData.avatar === (av.avatar_id || av.name)
                        ? 'border-blue-400 bg-blue-500/10'
                        : 'border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-lg text-white/80 mb-1">◈</div>
                    <div className="text-xs font-medium text-white/60">{av.name || av.avatar_id}</div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-white/30 col-span-4">No avatars loaded from DB</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Systems Section ── */}
        <div className="glass rounded-sm p-5 border border-white/[0.06] space-y-4">
          <h2 className="text-sm font-semibold text-white/60 tracking-wider uppercase">Systems & Templates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Vertical</label>
              <input
                type="text"
                placeholder="real_estate, hospitality, medspa"
                value={formData.vertical}
                onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Primary Template</label>
              <input
                type="text"
                placeholder="standard_intake_blueprint"
                value={formData.primary_template}
                onChange={(e) => setFormData({ ...formData, primary_template: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Decision Mode</label>
              <select
                value={formData.decision_mode}
                onChange={(e) => setFormData({ ...formData, decision_mode: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
              >
                {(lookups?.decision_modes || []).map((m) => (
                  <option key={m.mode_id} value={m.mode_id!}>{m.mode_id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Health Status</label>
              <select
                value={formData.health_status}
                onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
              >
                {(lookups?.health_statuses || []).map((s) => (
                  <option key={s.status_id} value={s.status_id!}>{s.status_id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Evolution Status</label>
              <select
                value={formData.evolution_status}
                onChange={(e) => setFormData({ ...formData, evolution_status: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
              >
                {(lookups?.evolution_statuses || []).map((s) => (
                  <option key={s.status_id} value={s.status_id!}>{s.status_id}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Autonomy Section ── */}
        <div className="glass rounded-sm p-5 border border-white/[0.06] space-y-4">
          <h2 className="text-sm font-semibold text-white/60 tracking-wider uppercase">Autonomy & Risk</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['autonomy_level', 'authority_level', 'risk_level'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-white/70 mb-1 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: parseInt(e.target.value, 10) })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !formData.agent_id || !formData.agent_name || !formData.role_type}
            className="px-6 py-2.5 bg-[#c8ff00] text-black font-bold text-sm rounded-sm hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Deploying...</>
            ) : 'Deploy Agent'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-white/5 border border-white/10 text-white/60 text-sm rounded-sm hover:bg-white/10 hover:text-white/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
