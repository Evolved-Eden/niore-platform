'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVerticals } from '@/lib/verticals';
import { useSelfClientKey } from '@/lib/client-view';

const ZURI_AGENT_ID = 'AGT-215';

export default function ZuriAdminPage() {
  const { prefix: clientPrefix } = useSelfClientKey();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [businessInfo, setBusinessInfo] = useState('');
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [autonomyLevel, setAutonomyLevel] = useState('supervised');
  const [authorityLevel, setAuthorityLevel] = useState('advisor');
  const [riskLevel, setRiskLevel] = useState('low');
  const [primaryTemplate, setPrimaryTemplate] = useState('');
  const [secondaryTemplate, setSecondaryTemplate] = useState('');
  const [vertical, setVertical] = useState('core');
  const [agentName, setAgentName] = useState('');
  const [tagline, setTagline] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const { verticals, loading: verticalsLoading } = useVerticals();

  useEffect(() => {
    async function load() {
      try {
        // Get Zuri agent
        const res = await fetch(`/api/admin/agents?filter=all&page=1&limit=500`);
        const data = await res.json();
        const agents = data.agents || [];
        const zuri = agents.find((a: any) => a.agent_id === ZURI_AGENT_ID);
        if (zuri) {
          setAgent(zuri);
          setAgentName(zuri.agent_name || '');
          setTagline(zuri.tagline || '');
          setVertical(zuri.vertical || 'core');
          setAutonomyLevel(zuri.autonomy_level || 'supervised');
          setAuthorityLevel(zuri.authority_level || 'advisor');
          setRiskLevel(zuri.risk_level || 'low');
          setPrimaryTemplate(zuri.primary_template || '');
          setSecondaryTemplate(zuri.secondary_template || '');

          // Load info from metadata
          const meta = zuri.metadata || {};
          setBusinessInfo(meta.business_info || '');
          setBrandGuidelines(meta.brand_guidelines || '');
        }

        // Get available templates
        const tplRes = await fetch('/api/admin/templates?type=all');
        const tplData = await tplRes.json();
        setTemplates(tplData.templates || []);
      } catch (e) {
        setError('Failed to load agent data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const payload = {
        agentId: ZURI_AGENT_ID,
        agentName,
        tagline,
        vertical,
        autonomyLevel,
        authorityLevel,
        riskLevel,
        primaryTemplate,
        secondaryTemplate,
        metadata: {
          business_info: businessInfo,
          brand_guidelines: brandGuidelines,
          last_configured: new Date().toISOString(),
        },
      };

      const res = await fetch('/api/admin/agents/zuri', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-white/30 text-sm">Loading Zuri configuration...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-white">Zuri Sovereign Agent</h1>
        <div className="glass rounded-sm p-8 text-center">
          <div className="text-4xl mb-4">🔮</div>
          <p className="text-white/50">Zuri (AGT-215) not found in the agent registry.</p>
          <p className="text-white/30 text-sm mt-2">Run the seed script to create the Zuri Sovereign Agent.</p>
        </div>
      </div>
    );
  }

  const templateOptions = templates.filter((t: any) =>
    ['essenceboard', 'essintelligence', 'workflow'].includes(t._template_type)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">Zuri Sovereign Agent</h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {ZURI_AGENT_ID}
            </span>
          </div>
          <p className="text-white/40 text-sm mt-1">
            Configure your primary intelligence concierge — business info, behavior, and template wiring
          </p>
        </div>
        <div className="flex items-center gap-3">
          {clientPrefix && (
            <Link
              href={`${clientPrefix}/zuri`}
              className="px-4 py-2 text-sm text-white/60 border border-white/10 rounded-sm hover:text-white transition-colors"
            >
              Preview Client View
            </Link>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Agent Identity */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-xs text-white/30 tracking-widest uppercase mb-4">Agent Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Vertical</label>
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white"
            >
              {verticalsLoading ? (
                <option value="" disabled>Loading...</option>
              ) : verticals.map(v => (
                <option key={v.key} value={v.key}>{v.name || v.key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-white/40 mb-1.5">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Your personal intelligence concierge..."
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20"
            />
          </div>
        </div>
      </div>

      {/* Business Info Upload */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-xs text-white/30 tracking-widest uppercase mb-1">Business Information Upload</h2>
        <p className="text-xs text-white/20 mb-4">Provide context so Zuri can represent your business intelligently</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Business Info / Company Profile</label>
            <textarea
              value={businessInfo}
              onChange={(e) => setBusinessInfo(e.target.value)}
              rows={4}
              placeholder="Describe your business — industry, size, location, target market, unique value proposition..."
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 resize-y"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Brand Guidelines / Voice</label>
            <textarea
              value={brandGuidelines}
              onChange={(e) => setBrandGuidelines(e.target.value)}
              rows={4}
              placeholder="Define your brand tone — formal, casual, luxury, technical? Key phrases to use or avoid? Any specific terminology?"
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 resize-y"
            />
          </div>
          <div className="bg-white/[0.02] rounded-sm p-3 border border-dashed border-white/10">
            <p className="text-xs text-white/30">
              <span className="text-[#C6A664]">💡</span> File upload coming soon — for now, paste your business context above.
              This will be embedded in Zuri&apos;s system prompt for personalized responses.
            </p>
          </div>
        </div>
      </div>

      {/* Behavior Configuration */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-xs text-white/30 tracking-widest uppercase mb-1">Business-Run Configuration</h2>
        <p className="text-xs text-white/20 mb-4">Control how Zuri operates and makes decisions</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Autonomy Level</label>
            <select
              value={autonomyLevel}
              onChange={(e) => setAutonomyLevel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white"
            >
              <option value="supervised">Supervised</option>
              <option value="semi_autonomous">Semi-Autonomous</option>
              <option value="fully_autonomous">Fully Autonomous</option>
            </select>
            <p className="text-[10px] text-white/20 mt-1">
              {autonomyLevel === 'supervised' && 'Requires approval for all actions'}
              {autonomyLevel === 'semi_autonomous' && 'Acts independently within defined boundaries'}
              {autonomyLevel === 'fully_autonomous' && 'Full independent decision-making'}
            </p>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Authority Level</label>
            <select
              value={authorityLevel}
              onChange={(e) => setAuthorityLevel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white"
            >
              <option value="observer">Observer</option>
              <option value="advisor">Advisor</option>
              <option value="operator">Operator</option>
              <option value="manager">Manager</option>
              <option value="director">Director</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Template Wiring */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-xs text-white/30 tracking-widest uppercase mb-1">Template Wiring</h2>
        <p className="text-xs text-white/20 mb-4">Connect Zuri to intelligence templates and workflows</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Primary Template</label>
            <select
              value={primaryTemplate}
              onChange={(e) => setPrimaryTemplate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white"
            >
              <option value="">— None —</option>
              {templateOptions.map((t: any) => (
                <option key={t.key} value={t.key}>{t.name || t.key}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Secondary Template</label>
            <select
              value={secondaryTemplate}
              onChange={(e) => setSecondaryTemplate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white"
            >
              <option value="">— None —</option>
              {templateOptions.map((t: any) => (
                <option key={t.key} value={t.key}>{t.name || t.key}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Agent Status */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-xs text-white/30 tracking-widest uppercase mb-4">Agent Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatusItem label="Health" value={agent.health_status || 'UNKNOWN'} color={agent.health_status === 'ACTIVE' ? '#5E8B84' : '#7A2E32'} />
          <StatusItem label="Config State" value={agent.config_state || '—'} color="#C6A664" />
          <StatusItem label="Operational State" value={agent.operational_state || '—'} color="#5E8B84" />
          <StatusItem label="MAS Score" value={agent.mas_score != null ? String(agent.mas_score) : '—'} color="#8B7AA8" />
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-white/30">
          <div>Role: <span className="text-white/50">{agent.role_type || '—'}</span></div>
          <div>MAS Priority: <span className="text-white/50">{agent.mas_priority || '—'}</span></div>
          <div>Client: <span className="text-white/50">{agent.client_id ? 'Linked' : 'Unlinked'}</span></div>
          <div>Autonomy: <span className="text-white/50">{agent.autonomy_level || '—'}</span></div>
        </div>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 glow-acid"
        >
          {saving ? 'Saving Configuration...' : saved ? '✓ Configuration Saved!' : 'Save All Configuration'}
        </button>
      </div>
    </div>
  );
}

function StatusItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/[0.03] rounded-sm p-3 border border-white/[0.06]">
      <div className="text-[10px] text-white/30 tracking-widest uppercase">{label}</div>
      <div className="text-lg font-medium mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}
