'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVerticals } from '@/lib/verticals';

export default function EditSwarmPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { verticals, loading: verticalsLoading } = useVerticals();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    key: '',
    name: '',
    description: '',
    vertical_key: '',
    member_agents: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    (async () => {
      const { id } = await params;
      const res = await fetch(`/api/admin/swarms?search=${id}`);
      const data = await res.json();
      const swarm = data.swarms?.[0];
      if (swarm) {
        setForm({
          key: swarm.key || '',
          name: swarm.name || '',
          description: swarm.description || '',
          vertical_key: swarm.vertical_key || '',
          member_agents: swarm.member_agents || [],
          is_active: swarm.is_active ?? true,
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
      const res = await fetch(`/api/admin/swarms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push('/dashboard/admin/swarms');
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
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Edit Swarm: {form.key}</h1>
          <p className="text-white/40 text-sm mt-1">Update swarm metadata, members, and vertical configuration.</p>
        </div>
        <button onClick={() => router.push('/dashboard/admin/swarms')} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">
          Back to Swarms
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-sm p-6 space-y-6 border border-white/[0.06]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Swarm Key</label>
            <input type="text" value={form.key} disabled className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/40 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Vertical</label>
            <select value={form.vertical_key} onChange={(e) => setForm({ ...form, vertical_key: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70">
              <option value="">None (Universal)</option>
              {verticalsLoading ? (
                <option value="" disabled>Loading...</option>
              ) : (
                verticals.map((v) => (
                  <option key={v.key || v.id} value={v.key || v.id}>{v.name}</option>
                ))
              )}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="is_active" className="text-sm font-medium text-white/70">Active</label>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-[#c8ff00] text-black rounded-sm hover:bg-white transition-colors font-bold flex-1">{saving ? 'Saving...' : 'Save Swarm'}</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
