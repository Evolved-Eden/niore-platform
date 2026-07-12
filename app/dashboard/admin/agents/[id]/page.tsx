'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({
    capability: 50,
    trust: 50,
    synergy: 50,
    activation: 50,
    evolution: 50,
    risk: 10,
  });
  const [masScore, setMasScore] = useState(0);
  const [masPriority, setMasPriority] = useState('Stable');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSaveMsg, setContentSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { id } = await params;
      const res = await fetch(`/api/admin/agents/${id}`);
      const json = await res.json();
      setAgent(json.agent || null);
      setIsPublished(json.agent?.is_published ?? false);
      setTagline(json.agent?.tagline ?? '');
      setDescription(json.agent?.description ?? '');
      setSystemPrompt(json.agent?.system_prompt ?? '');
      if (json.mas_scores) {
        setScores({
          capability: json.mas_scores.capability ?? 50,
          trust: json.mas_scores.trust ?? 50,
          synergy: json.mas_scores.synergy ?? 50,
          activation: json.mas_scores.activation ?? 50,
          evolution: json.mas_scores.evolution ?? 50,
          risk: json.mas_scores.risk ?? 10,
        });
      }
      setLoading(false);
    })();
  }, [params]);

  const updateScore = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const saveContent = async () => {
    const { id } = await params;
    setContentSaving(true);
    setContentSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagline, description, system_prompt: systemPrompt }),
      });
      const json = await res.json();
      if (json.error) {
        setContentSaveMsg(`Error: ${json.error}`);
      } else {
        setContentSaveMsg('Saved ✓');
        setTimeout(() => setContentSaveMsg(null), 3000);
      }
    } catch {
      setContentSaveMsg('Save failed');
    }
    setContentSaving(false);
  };

  const saveScores = async () => {
    const { id } = await params;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scores, is_published: isPublished }),
      });
      const json = await res.json();
      if (json.error) {
        setSaveMsg(`Error: ${json.error}`);
      } else {
        setSaveMsg('Saved ✓');
        setTimeout(() => setSaveMsg(null), 3000);
      }
    } catch {
      setSaveMsg('Save failed');
    }
    setSaving(false);
  };

  useEffect(() => {
    const mas =
      0.25 * scores.capability +
      0.2 * scores.trust +
      0.2 * scores.synergy +
      0.15 * scores.activation +
      0.1 * scores.evolution -
      0.1 * scores.risk;

    setMasScore(Math.round(mas * 100) / 100);
    if (mas >= 95) setMasPriority('Elite');
    else if (mas >= 85) setMasPriority('High');
    else if (mas >= 70) setMasPriority('Stable');
    else if (mas >= 55) setMasPriority('Monitor');
    else if (mas >= 40) setMasPriority('Degraded');
    else setMasPriority('Critical');
  }, [scores]);

  if (loading) return <div className="p-12 text-center text-white/30 text-sm">Loading...</div>;
  if (!agent) return <div className="p-12 text-center text-white/30 text-sm">Agent not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Edit Agent: {agent.agent_id}</h1>
          <p className="text-white/40 text-sm mt-1">{agent.agent_name}</p>
        </div>
        <button onClick={() => router.push('/dashboard/admin/agents')} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">
          Back to Agents
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Details */}
        <div className="glass rounded-sm p-6 border border-white/[0.06] space-y-4">
          <h2 className="text-lg font-bold text-white/80">Agent Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Agent ID</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/50 font-mono">{agent.agent_id}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Role Type</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/50">{agent.role_type || 'NULL'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Archetype</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/50">{agent.archetype_id || '—'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Vertical</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/50">{agent.vertical || '—'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Health Status</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  agent.health_status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'
                }`}>{agent.health_status || 'UNKNOWN'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Evolution Status</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/50">{agent.evolution_status || '—'}</div>
            </div>
          </div>

          {/* Editable content: tagline / description / system prompt.
              These were auto-generated from each agent's name/tagline/
              vertical/role_type as a reviewable starting point -- edit
              and save here. */}
          <div className="pt-4 border-t border-white/[0.06] space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Tagline</label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#c8ff00]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/80 resize-none focus:outline-none focus:border-[#c8ff00]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={8}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-xs text-white/80 font-mono resize-y focus:outline-none focus:border-[#c8ff00]/40"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveContent}
                disabled={contentSaving}
                className="px-5 py-2 bg-[#c8ff00] text-[#080810] text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
              >
                {contentSaving ? 'Saving...' : 'Save Content'}
              </button>
              {contentSaveMsg && (
                <span className={`text-sm font-medium ${contentSaveMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {contentSaveMsg}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MAS Scoring */}
        <div className="bg-black/30 border border-white/[0.06] rounded-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-white/80">MAS Scoring</h2>
          <div className={`text-center p-6 rounded-sm ${
            masPriority === 'Elite' ? 'bg-amber-500' :
            masPriority === 'High' ? 'bg-emerald-600' :
            masPriority === 'Stable' ? 'bg-sky-600' :
            masPriority === 'Monitor' ? 'bg-yellow-500' :
            masPriority === 'Degraded' ? 'bg-orange-600' : 'bg-red-600'
          }`}>
            <div className="text-5xl font-bold text-white">{masScore}</div>
            <div className="text-lg mt-2 text-white/90">MAS Score</div>
            <div className="text-sm opacity-80 text-white/70 mt-1">
              {masPriority === 'Elite' && 'Elite — Primary orchestration authority'}
              {masPriority === 'High' && 'High — Preferred routing'}
              {masPriority === 'Stable' && 'Stable — Standard routing'}
              {masPriority === 'Monitor' && 'Monitor — Reduced priority'}
              {masPriority === 'Degraded' && 'Degraded — Restrict responsibilities'}
              {masPriority === 'Critical' && 'Critical — Escalate or deactivate'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/[0.06] p-4 rounded-sm text-xs">
            <div className="font-mono text-white/50">MAS = 0.25&times;Capability + 0.20&times;Trust + 0.20&times;Synergy + 0.15&times;Activation + 0.10&times;Evolution - 0.10&times;Risk</div>
            <div className="mt-2 font-bold text-white/80">= {masScore}</div>
          </div>

          <div className="space-y-4">
            <ScoreSlider label="Capability" value={scores.capability} onChange={(v) => updateScore('capability', v)} />
            <ScoreSlider label="Trust" value={scores.trust} onChange={(v) => updateScore('trust', v)} />
            <ScoreSlider label="Synergy" value={scores.synergy} onChange={(v) => updateScore('synergy', v)} />
            <ScoreSlider label="Activation" value={scores.activation} onChange={(v) => updateScore('activation', v)} />
            <ScoreSlider label="Evolution" value={scores.evolution} onChange={(v) => updateScore('evolution', v)} />
            <ScoreSlider label="Risk (Higher = Worse)" value={scores.risk} onChange={(v) => updateScore('risk', v)} inverted />
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <div>
              <div className="text-sm font-medium text-white/80">Published</div>
              <p className="text-xs text-white/40 mt-0.5">Make this agent visible to clients in the catalog</p>
            </div>
            <button
              onClick={() => setIsPublished(!isPublished)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isPublished ? 'bg-[#c8ff00]' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isPublished ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveScores}
              disabled={saving}
              className="flex-1 px-5 py-2.5 bg-[#c8ff00] text-[#080810] text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save MAS Scores'}
            </button>
            {saveMsg && (
              <span className={`text-sm font-medium ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreSlider({ label, value, onChange, inverted }: { label: string; value: number; onChange: (v: number) => void; inverted?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <label className="text-white/70">{label}</label>
        <span className="font-bold text-white/80">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-white"
      />
    </div>
  );
}
