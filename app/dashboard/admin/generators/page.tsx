'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const GENERATOR_TYPES = ['TEMPLATE', 'SCORING', 'ROUTING', 'SWARM'];

export default function GeneratorsPage() {
  const [generators, setGenerators] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/generators')
      .then(res => res.json())
      .then(data => {
        setGenerators(data.generators || []);
        setCount(data.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Generators</h1>
          <p className="text-white/40 text-sm mt-1">Manage {count || 0} Evolved Eden generators</p>
        </div>
        <Link
          href="/dashboard/admin/generators/new"
          className="px-4 py-2 text-sm font-medium bg-[#C6A664] text-black rounded-sm hover:bg-white transition-colors font-bold"
        >
          + New Generator
        </Link>
      </div>

      {/* Type Summary */}
      <div className="grid grid-cols-4 gap-4">
        {GENERATOR_TYPES.map((type) => {
          const typeCount = generators?.filter((g: any) => g.generator_type === type).length || 0;
          return (
            <div key={type} className="glass rounded-sm p-4 border border-white/[0.06]">
              <div className="text-sm text-white/40">{type}</div>
              <div className="text-2xl font-bold text-white mt-1">{typeCount}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass rounded-sm overflow-hidden border border-white/[0.06]">
        <table className="min-w-full">
          <thead className="bg-white/[0.03]">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">ID</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Name</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Type</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Config</th>
              <th className="px-6 py-3 text-left text-xs text-white/30 tracking-widest uppercase font-normal">Status</th>
              <th className="px-6 py-3 text-right text-xs text-white/30 tracking-widest uppercase font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30 text-sm">Loading...</td></tr>
            ) : generators.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30 text-sm">No generators found</td></tr>
            ) : generators.map((gen: any) => (
              <tr key={gen.generator_id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-white/50">{gen.generator_id}</td>
                <td className="px-6 py-4 text-sm font-medium text-white/80">{gen.generator_name}</td>
                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{gen.generator_type}</span></td>
                <td className="px-6 py-4 text-sm">
                  <pre className="text-xs text-white/40 bg-white/5 p-2 rounded-sm overflow-auto max-w-md">
                    {typeof gen.config === 'string' ? gen.config : JSON.stringify(gen.config, null, 2)}
                  </pre>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${gen.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                    {gen.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <Link href={`/dashboard/admin/generators/${gen.generator_id}`} className="text-blue-400 hover:text-blue-300">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
