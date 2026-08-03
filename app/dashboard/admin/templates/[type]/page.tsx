'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplateManager({ params }: { params: Promise<{ type: string }> }) {
  const router = useRouter();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionsJson, setSectionsJson] = useState('');

  useEffect(() => {
    (async () => {
      const { type } = await params;
      try {
        // Fetch from both template types
        const [blueRes, essenceRes] = await Promise.all([
          fetch('/api/admin/templates?type=blueprint'),
          fetch('/api/admin/templates?type=essence'),
        ]);
        const blueData = await blueRes.json();
        const essenceData = await essenceRes.json();
        const all = [...(blueData.templates || []), ...(essenceData.templates || [])];
        const tpl = all.find((t: any) => t.key === type);
        if (tpl) {
          setTemplate(tpl);
          setSectionsJson(JSON.stringify(tpl.sections_json || tpl.template_json || tpl.essence_json || {}, null, 2));
        }
      } catch (e) { console.error('Failed to load template', e); }
      setLoading(false);
    })();
  }, [params]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsed;
      try { parsed = JSON.parse(sectionsJson); } catch { throw new Error('Invalid JSON'); }

      const endpoint = template._template_type === 'essence' ? 'essence_templates' : 'essence_engines'; // this var is only used to pick _template_type in the POST body below, not a real table name

      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          _template_type: template._template_type || 'blueprint',
          sections_json: parsed,
          template_json: parsed,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('Template updated!');
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-white/30 text-sm">Loading...</div>;
  if (!template) return <div className="p-12 text-center text-white/30 text-sm">Template not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Template: {template.name || template.key}</h1>
          <p className="text-white/40 text-sm mt-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
              template._template_type === 'blueprint'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {template._template_type === 'blueprint' ? 'Assessment' : 'Essence'}
            </span>
          </p>
        </div>
        <button onClick={() => router.push('/dashboard/admin/templates')} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">
          Back to Templates
        </button>
      </div>

      <div className="glass rounded-sm p-6 space-y-4 border border-white/[0.06]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Key</label>
            <input type="text" value={template.key} disabled className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/40 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
            <input type="text" value={template.name || ''} onChange={(e) => setTemplate({ ...template, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
          <textarea rows={2} value={template.description || ''} onChange={(e) => setTemplate({ ...template, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30" />
        </div>

        {template.vertical_key && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Vertical</label>
            <input type="text" value={template.vertical_key} disabled className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/40" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Sections / Template JSON</label>
          <textarea
            rows={15}
            value={sectionsJson}
            onChange={(e) => setSectionsJson(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 font-mono text-xs"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium bg-[#C6A664] text-black rounded-sm hover:bg-white transition-colors font-bold flex-1">
            {saving ? 'Saving...' : 'Save Template'}
          </button>
          <button onClick={() => router.back()} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
