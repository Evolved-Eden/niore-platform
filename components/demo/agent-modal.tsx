'use client'

import { useEffect, useState } from 'react'

type AgentData = {
  agent_id: string
  name: string
  tagline: string
  description: string
  long_description: string
  icon: string
  color: string
  capabilities: string[]
  vertical_ids: string[]
  triggers: string[]
  data_sources: string[]
  outputs: string[]
  workflow_ids: string[]
  agent_type: string
  category: string
}

type AgentModalProps = {
  agentId: string | null
  verticalColor: string
  onClose: () => void
}

const WORKFLOW_LABELS: Record<string, string> = {
  wf1: 'Queue Poller — Lead capture & routing',
  wf2: 'Scheduler — Time-based intelligence & reports',
  wf3: 'Webhook Bridge — Real-time event processing',
  wf4: 'Memory Sync — Cross-platform data sync',
  wf5: 'Reply Recovery — Re-engagement & follow-up',
}

const VERTICAL_LABELS: Record<string, string> = {
  med_spa: 'Luxury Med Spa',
  hotel: 'Luxury Hotel',
  real_estate: 'Luxury Real Estate',
  hr: 'Corporate HR',
  legal: 'Legal Practice',
}

export default function AgentModal({ agentId, verticalColor, onClose }: AgentModalProps) {
  const [agent, setAgent] = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!agentId) return
    setLoading(true)
    setError(null)
    fetch(`/api/agents/${agentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setAgent(data.agent)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [agentId])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!agentId) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-sm border border-white/[0.08] bg-[#0A0A0B] shadow-2xl animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/70 hover:border-white/30 transition-all z-10"
        >
          ✕
        </button>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-6 text-sm text-red-400">
            Failed to load agent: {error}
          </div>
        )}

        {agent && !loading && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${verticalColor}15`, color: verticalColor }}
              >
                {agent.icon}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{agent.name}</h2>
                <p className="text-sm text-white/50">{agent.tagline}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ borderColor: `${verticalColor}30`, color: agent.color || verticalColor }}>
                    {agent.agent_type}
                  </span>
                  <span className="text-[10px] text-white/30">{agent.category}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-white/60 leading-relaxed mb-6">{agent.long_description || agent.description}</p>

            {/* Capabilities */}
            <div className="mb-6">
              <h3 className="text-xs text-white/30 tracking-widest uppercase mb-3">Capabilities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {agent.capabilities.map((cap) => (
                  <div key={cap} className="flex items-center gap-2 text-xs text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: verticalColor }} />
                    {cap}
                  </div>
                ))}
              </div>
            </div>

            {/* Triggers */}
            <div className="mb-6">
              <h3 className="text-xs text-white/30 tracking-widest uppercase mb-3">Triggers</h3>
              <div className="flex flex-wrap gap-1.5">
                {agent.triggers.map((trigger) => (
                  <span key={trigger} className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40">
                    {trigger}
                  </span>
                ))}
              </div>
            </div>

            {/* Data Sources + Outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-xs text-white/30 tracking-widest uppercase mb-3">Data Sources</h3>
                <div className="space-y-1.5">
                  {agent.data_sources.map((src) => (
                    <div key={src} className="flex items-center gap-2 text-xs text-white/50">
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      {src}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs text-white/30 tracking-widest uppercase mb-3">Outputs</h3>
                <div className="space-y-1.5">
                  {agent.outputs.map((out) => (
                    <div key={out} className="flex items-center gap-2 text-xs text-white/50">
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      {out}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Connected Workflows */}
            {agent.workflow_ids.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs text-white/30 tracking-widest uppercase mb-3">Connected Workflows</h3>
                <div className="space-y-1.5">
                  {agent.workflow_ids.map((wf) => (
                    <div key={wf} className="flex items-center gap-2 text-xs">
                      <span className="text-[#C6A664]">⚡</span>
                      <span className="text-white/60">{WORKFLOW_LABELS[wf] || wf}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verticals */}
            {agent.vertical_ids.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs text-white/30 tracking-widest uppercase mb-3">Available In</h3>
                <div className="flex flex-wrap gap-1.5">
                  {agent.vertical_ids.map((v) => (
                    <span key={v} className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: `${verticalColor}12`, color: verticalColor }}>
                      {VERTICAL_LABELS[v] || v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activate CTA */}
            <div className="border-t border-white/5 pt-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40">Ready to deploy this agent?</p>
                <p className="text-[10px] text-white/20">Part of every plan. No additional setup required.</p>
              </div>
              <button
                className="px-5 py-2.5 text-xs font-bold rounded-sm transition-all"
                style={{ backgroundColor: verticalColor, color: '#000' }}
                onClick={() => window.location.href = '/pricing'}
              >
                Activate Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
