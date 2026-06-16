'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TYPES = ['TEMPLATE', 'SCORING', 'ROUTING', 'SWARM'];

export default function EditGeneratorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    generator_id: '',
    generator_name: '',
    generator_type: 'TEMPLATE',
    config: {},
    is_active: true,
  });

  useEffect(() => {
    (async () => {
      const { id } = await params;
      const res = await fetch(`/api/admin/generators`);
      const data = await res.json();
      const gen = (data.generators || []).find((g: any) => g.generator_id === id);
      if (gen) {
        setForm({
          generator_id: gen.generator_id || '',
          generator_name: gen.generator_name || '',
          generator_type: gen.generator_type || 'TEMPLATE',
          config: gen.config || {},
          is_active: gen.is_active ?? true,
        });
      }
      setLoading(false);
    })();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id } = await params;
      const res = await fetch(`/api/admin/generators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push('/dashboard/admin/generators');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-white/30 text-sm">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Edit Generator: {form.generator_id}</h1>
          <p className="text-white/40 text-sm mt-1">Update generator configuration and activation state.</p>
        </div>
        <button onClick={() => router.push('/dashboard/admin/generators')} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">
          Back to Generators
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-sm p-6 space-y-6 border border-white/[0.06]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Generator ID</label>
            <input type="text" value={form.generator_id} disabled className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/40 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
            <input type="text" required value={form.generator_name} onChange={(e) => setForm({ ...form, generator_name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Type</label>
          <select value={form.generator_type} onChange={(e) => setForm({ ...form, generator_type: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70">
            {TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
          <label htmlFor="is_active" className="text-sm font-medium text-white/70">Active</label>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-[#c8ff00] text-black rounded-sm hover:bg-white transition-colors font-bold flex-1">{saving ? 'Saving...' : 'Save Generator'}</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
