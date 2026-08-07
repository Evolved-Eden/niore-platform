'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSpecialties } from '@/lib/specialties';

function SwarmsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get('search') || '';
  const specialty = searchParams.get('specialty') || '';

  const { specialties, loading: specialtiesLoading } = useSpecialties();
  const [swarms, setSwarms] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (specialty) params.set('specialty', specialty);

    fetch(`/api/admin/swarms?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setSwarms(data.swarms || []);
        setCount(data.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, specialty]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Swarms</h1>
          <p className="text-white/40 text-sm mt-1">Manage {count || 0} agent swarms</p>
        </div>
        <Link
          href="/dashboard/admin/swarms/new"
          className="px-4 py-2 text-sm font-medium bg-[#C6A664] text-black rounded-sm hover:bg-white transition-colors font-bold"
        >
          + New Swarm
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          defaultValue={search}
          placeholder="Search swarms..."
          className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const params = new URLSearchParams();
              if (e.currentTarget.value) params.set('search', e.currentTarget.value);
              if (specialty) params.set('specialty', specialty);
              router.push(`/dashboard/admin/swarms?${params.toString()}`);
            }
          }}
        />
        <select
          value={specialty}
          onChange={(e) => {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (e.target.value) params.set('specialty', e.target.value);
            router.push(`/dashboard/admin/swarms?${params.toString()}`);
          }}
          className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
        >
          <option value="">All Specialties</option>
          {specialtiesLoading ? (
            <option value="" disabled>Loading...</option>
          ) : (
            specialties.map((v) => (
              <option key={v.key || v.id} value={v.key || v.id}>{v.name}</option>
            ))
          )}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/30 text-sm">Loading...</div>
      ) : swarms.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No swarms found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {swarms.map((swarm: any) => (
            <div key={swarm.key} className="glass rounded-sm p-6 border border-white/[0.06]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white/80">{swarm.name}</h3>
                  <p className="text-sm text-white/40 mt-1 font-mono">{swarm.key}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  swarm.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {swarm.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-sm text-white/50 mb-2">Agent Members ({swarm.member_agents?.length || 0})</div>
                <div className="flex flex-wrap gap-1">
                  {swarm.member_agents?.slice(0, 5).map((agent: string) => (
                    <span key={agent} className="px-2 py-0.5 bg-white/5 text-white/60 border border-white/10 rounded text-xs font-mono">{agent}</span>
                  ))}
                  {swarm.member_agents?.length > 5 && (
                    <span className="px-2 py-0.5 bg-white/5 text-white/30 border border-white/10 rounded text-xs">+{swarm.member_agents.length - 5} more</span>
                  )}
                </div>
              </div>

              {swarm.agent_specialty_key && (
                <div className="mt-3">
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs">{swarm.agent_specialty_key}</span>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Link href={`/dashboard/admin/swarms/${swarm.key}`} className="text-sm text-blue-400 hover:text-blue-300">Edit</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SwarmsTab() {
  return (
    <Suspense fallback={<div className="p-6 text-white/30 text-sm">Loading swarms...</div>}>
      <SwarmsContent />
    </Suspense>
  );
}
