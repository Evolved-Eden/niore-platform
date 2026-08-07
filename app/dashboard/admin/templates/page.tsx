'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/templates?type=${filterType}`);
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (e) {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filterType]);

  const essenceboardCount = templates.filter((t: any) => t._template_type === 'essenceboard').length;
  const essintelligenceCount = templates.filter((t: any) => t._template_type === 'essintelligence').length;
  const workflowCount = templates.filter((t: any) => t._template_type === 'workflow').length;

  return (
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Templates</h1>
          <p className="text-white/40 text-sm mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
            <span className="text-white/20"> — </span>
            <span className="text-amber-400">{essenceboardCount} essenceboard</span>
            <span className="text-white/20"> · </span>
            <span className="text-blue-400">{essintelligenceCount} essintelligence</span>
            <span className="text-white/20"> · </span>
            <span className="text-green-400">{workflowCount} workflow</span>
          </p>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'essenceboard', label: 'Essenceboards' },
          { key: 'essintelligence', label: 'Essintelligences' },
          { key: 'workflow', label: 'Workflows' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
              filterType === f.key
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/50 border border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/30 text-sm">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No templates found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl: any) => (
            <div key={tpl.key} className="glass rounded-sm p-6 border border-white/[0.06]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white/80">{tpl.name || tpl.key}</h3>
                  <p className="text-xs text-white/40 mt-1 font-mono">{tpl.key}</p>
                </div>
                  <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    tpl._template_type === 'essintelligence'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : tpl._template_type === 'workflow'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {tpl._template_type === 'essintelligence' ? 'Essintelligence' : tpl._template_type === 'workflow' ? 'Workflow' : 'Essenceboard'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    tpl.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    {tpl.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {tpl.description && <p className="text-sm text-white/50 mt-3">{tpl.description}</p>}
              {(tpl.specialty_key || tpl.workflow_type) && (
                <div className="mt-3 flex gap-2">
                  {tpl.specialty_key && <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs">{tpl.specialty_key}</span>}
                  {tpl.workflow_type && <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-xs">{tpl.workflow_type}</span>}
                </div>
              )}
              <div className="mt-4 flex gap-3">
                {tpl._template_type === 'workflow' ? (
                  <Link href={`/dashboard/admin/workflows`} className="text-blue-400 hover:text-blue-300 text-sm">Open Designer</Link>
                ) : (
                  <Link href={`/dashboard/admin/templates/${tpl.key}`} className="text-blue-400 hover:text-blue-300 text-sm">Manage</Link>
                )}
                <span className="text-white/20 text-sm">
                  {(tpl.sections_json?.length || 0)} sections
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
