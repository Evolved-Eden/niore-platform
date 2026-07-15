'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVerticals } from '@/lib/verticals';

export default function CreateSwarmPage() {
  const router = useRouter();
  const { verticals, loading: verticalsLoading } = useVerticals();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    key: '',
    name: '',
    description: '',
    vertical_key: '',
    member_agents: [] as string[],
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/swarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create swarm');
      router.push('/dashboard/admin/swarms');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Create New Swarm</h1>
        <p className="text-white/40 text-sm mt-1">Define a new swarm of agents for vertical workflows.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-sm p-6 space-y-6 border border-white/[0.06]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Swarm Key <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              placeholder="real_estate_intake_swarm"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              placeholder="Real Estate Intake Swarm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
          <textarea
            rows={3}
            placeholder="What does this swarm handle?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Vertical</label>
            <select
              value={form.vertical_key}
              onChange={(e) => setForm({ ...form, vertical_key: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
            >
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
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-white/70">Active</label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium bg-[#C6A664] text-black rounded-sm hover:bg-white transition-colors font-bold flex-1">
            {loading ? 'Creating...' : 'Create Swarm'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
