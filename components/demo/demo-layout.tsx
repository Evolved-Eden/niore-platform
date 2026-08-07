'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { SPECIALTY_LIST, getSpecialtyBySlug, type SpecialtyData } from './specialty-data'
import PlanBuilder from './plan-builder'
import AgentModal from './agent-modal'
import WorkflowPreview from './workflow-preview'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function DemoSpecialtyPage({ slug }: { slug: string }) {
  const specialtyData = getSpecialtyBySlug(slug)
  const [showChat, setShowChat] = useState(false)
  const [showPlanBuilder, setShowPlanBuilder] = useState(false)
  const [showAgents, setShowAgents] = useState(false)
  const [showSwarm, setShowSwarm] = useState(false)
  const [showEssence, setShowEssence] = useState(false)
  const [showWorkflows, setShowWorkflows] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  // Map agent IDs from specialty-data to the DB agent_id for the modal
  // (they're the same in specialty-data.ts)
  const agentIdMap: Record<string, string> = {
    client_concierge: 'client_concierge',
    treatment_intelligence: 'treatment_intelligence',
    retention_sentinel: 'retention_sentinel',
    marketing_intelligence: 'marketing_intelligence',
    operations_orchestrator: 'operations_orchestrator',
    guest_experience: 'guest_experience_ai',
    concierge_ai: 'concierge_ai',
    revenue_optimizer: 'revenue_optimizer',
    operations_sentinel: 'operations_sentinel',
    guest_insights: 'guest_insights_engine',
    lead_nurture: 'lead_nurture',
    property_match: 'property_match',
    market_intelligence: 'market_intelligence',
    transaction_coordinator: 'transaction_coordinator',
    client_relations: 'client_relations',
    talent_acquisition: 'talent_acquisition',
    onboarding_automator: 'onboarding_automator',
    employee_intelligence: 'employee_intelligence',
    compliance_sentinel: 'compliance_sentinel',
    workforce_planner: 'workforce_planner',
    client_intake: 'client_intake_legal',
    document_intelligence: 'document_intelligence',
    case_coordinator: 'case_coordinator',
    billing_automation: 'billing_automation',
    research_associate: 'research_associate',
  }

  function handleAgentClick(agentId: string) {
    const dbId = agentIdMap[agentId]
    if (dbId) setSelectedAgent(dbId)
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [isLoading])

  if (!specialtyData) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Specialty not found</h1>
          <Link href="/demo" className="text-[#C6A664] hover:underline">← Back to demos</Link>
        </div>
      </div>
    )
  }

  const specialty = specialtyData

  // Sections animated in
  const sections = [
    { key: 'agents', label: 'Your Agents', show: showAgents, set: setShowAgents },
    { key: 'swarm', label: 'The Swarm', show: showSwarm, set: setShowSwarm },
    { key: 'workflows', label: 'Workflows', show: showWorkflows, set: setShowWorkflows },
    { key: 'essence', label: 'Essence Board', show: showEssence, set: setShowEssence },
    { key: 'chat', label: 'Zuri Walkthrough', show: showChat, set: setShowChat },
    { key: 'plan', label: 'Build Your Plan', show: showPlanBuilder, set: setShowPlanBuilder },
  ]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat/front-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          context: `You are walking through the ${specialty.title} demo. The user has seen the agents, swarm, and essence board for this specialty. Answer questions about pricing, capabilities, or customization. Keep responses concise and warm. If asked about pricing, explain the plans and offer to build their plan.`,
        }),
      })

      if (!res.ok) throw new Error('Failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = { role: 'assistant', content: accumulated }
            return copy
          })
        }
      }

      if (accumulated.toLowerCase().includes('pricing') || accumulated.toLowerCase().includes('plan')) {
        setShowPlanBuilder(true)
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting. You can build your plan below or explore another specialty.",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0A0A0B]/90 backdrop-blur-xl">
        <Link href="/" className="font-display text-sm font-semibold tracking-wide">
          EVOLVED <span className="text-[#C6A664]">EDEN</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/define-intelligence" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Define Your Intelligence
          </Link>
          <Link
            href="/demo"
            className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-white/30 transition-all"
          >
            All Specialties
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${specialty.gradient} pointer-events-none`} />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl" style={{ color: specialty.color }}>{specialty.emoji}</span>
            <div>
              <p className="text-xs text-white/30 tracking-widest uppercase">Specialty Demo</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">{specialty.title}</h1>
            </div>
          </div>
          <p className="text-lg text-white/50 max-w-2xl mb-8">{specialty.tagline}</p>
          <p className="text-sm text-white/40 max-w-xl leading-relaxed mb-8">{specialty.description}</p>

          {/* Section nav */}
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => s.set(!s.show)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  s.show
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {s.show ? '−' : '+'} {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-12">
        {/* Agent Modal */}
        <AgentModal
          agentId={selectedAgent}
          accentColor={specialty.color}
          onClose={() => setSelectedAgent(null)}
        />

        {/* ── AGENTS ── */}
        {showAgents && (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-6">
              Your <span style={{ color: specialty.color }}>Agents</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialty.agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentClick(agent.id)}
                  className="rounded-sm border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/15 hover:bg-white/[0.04] transition-all group text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${specialty.color}15`, color: specialty.color }}
                    >
                      {agent.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white/90">{agent.name}</h3>
                      <p className="text-[10px] text-white/40">{agent.tagline}</p>
                    </div>
                    <svg className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed mb-3">{agent.description}</p>
                  <div className="space-y-1">
                    {agent.capabilities.slice(0, 3).map((cap) => (
                      <div key={cap} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: specialty.color }} />
                        <span className="text-[10px] text-white/40">{cap}</span>
                      </div>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <p className="text-[9px] text-white/20 mt-1">+{agent.capabilities.length - 3} more</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── SWARM ── */}
        {showSwarm && (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-2">
              The <span style={{ color: specialty.color }}>Swarm</span>
            </h2>
            <p className="text-sm text-white/40 mb-6">{specialty.swarm.description}</p>
            <div className="rounded-sm border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: `${specialty.color}20`, color: specialty.color }}
                >
                  ⊕
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/80">{specialty.swarm.name}</h3>
                  <p className="text-[10px] text-white/40">{specialty.swarm.agents.length} agents connected</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialty.swarm.agents.map((agentName) => (
                  <span
                    key={agentName}
                    className="text-xs px-2.5 py-1 rounded-full border"
                    style={{ borderColor: `${specialty.color}30`, color: specialty.color }}
                  >
                    {agentName}
                  </span>
                ))}
              </div>
              {/* Visual connection lines */}
              <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-white/20">
                <span>real-time context sharing</span>
                <span className="mx-1">•</span>
                <span>cross-agent orchestration</span>
                <span className="mx-1">•</span>
                <span>unified memory</span>
              </div>
            </div>
          </section>
        )}

        {/* ── ESSENCE BOARD ── */}
        {showEssence && (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-2">
              Daily <span style={{ color: specialty.color }}>Essence Board</span>
            </h2>
            <p className="text-sm text-white/40 mb-6">
              Every morning, your intelligence system delivers a personalized command center.
            </p>
            <div
              className="rounded-sm border p-6"
              style={{ borderColor: `${specialty.color}20`, backgroundColor: `${specialty.color}05` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-2 h-2 rounded-full animate-pulse-slow"
                  style={{ backgroundColor: specialty.color }}
                />
                <span className="text-xs font-semibold" style={{ color: specialty.color }}>
                  {specialty.essenceBoard.title}
                </span>
              </div>
              <div className="space-y-3">
                {specialty.essenceBoard.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="text-xs font-mono mt-0.5 shrink-0"
                      style={{ color: specialty.color }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-white/60">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── WORKFLOWS ── */}
        {showWorkflows && (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-2">
              Intelligence <span style={{ color: specialty.color }}>Workflows</span>
            </h2>
            <p className="text-sm text-white/40 mb-6">
              Each agent is powered by automated workflows that handle events, schedules, and real-time data.
              Click any workflow to see how it operates.
            </p>
            <div
              className="rounded-sm border p-6"
              style={{ borderColor: `${specialty.color}20`, backgroundColor: `${specialty.color}03` }}
            >
              <WorkflowPreview
                accentColor={specialty.color}
                workflowIds={['wf1', 'wf2', 'wf3', 'wf4', 'wf5']}
              />
            </div>
          </section>
        )}

        {/* ── ZURI CHAT ── */}
        {showChat && (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-6">
              Walkthrough with <span style={{ color: specialty.color }}>Zuri</span>
            </h2>

            {/* Static walkthrough first */}
            {messages.length === 0 && (
              <div
                className="rounded-sm p-6 mb-6 border"
                style={{ borderColor: `${specialty.color}20`, backgroundColor: `${specialty.color}08` }}
              >
                <p className="text-sm text-white/70 whitespace-pre-line leading-relaxed">
                  {specialty.walkthrough}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setMessages([
                        { role: 'assistant', content: `Welcome to the ${specialty.title} Intelligence demo. I'm Zuri, your private architect.\n\nYou've seen the agents, the swarm, and the Essence Board. What questions do you have? Would you like to dive deeper into a specific agent, see how pricing works, or explore how this integrates with your existing tools?` },
                      ])
                    }}
                    className="px-5 py-2.5 text-xs font-bold rounded-sm transition-all"
                    style={{ backgroundColor: specialty.color, color: '#000' }}
                  >
                    Start Chatting with Zuri →
                  </button>
                  <Link
                    href="/dashboard/client/zuri"
                    className="px-5 py-2.5 text-xs font-bold rounded-sm border transition-all"
                    style={{ borderColor: `${specialty.color}40`, color: specialty.color }}
                  >
                    Open Full Zuri Chat ↗
                  </Link>
                </div>
              </div>
            )}

            {/* Chat messages */}
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#C6A664] text-black'
                      : 'bg-white/[0.04] text-white/80 border border-white/[0.06]'
                  }`}>
                    {msg.content || (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" />
                        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Chat input */}
            {messages.length > 0 && (
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isLoading ? 'Zuri is thinking...' : 'Ask Zuri about this specialty...'}
                  disabled={isLoading}
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="px-5 py-3 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            )}
          </section>
        )}

        {/* ── PLAN BUILDER ── */}
        {showPlanBuilder && (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-2">
              Build Your <span style={{ color: specialty.color }}>Plan</span>
            </h2>
            <p className="text-sm text-white/40 mb-6">
              Customize your intelligence system. Add agents, swarms, and capabilities as you grow.
            </p>
            <div
              className="rounded-sm border p-6"
              style={{ borderColor: `${specialty.color}20`, backgroundColor: `${specialty.color}03` }}
            >
              <PlanBuilder
                path={(specialty.defaultPlan?.split('_')[0] as any) || 'client'}
                defaultPlan={specialty.defaultPlan}
                accentColor={specialty.color}
                specialty={specialty.slug}
                agentIds={specialty.agents.map(a => a.id)}
              />
            </div>
          </section>
        )}
      </div>

      {/* Footer nav */}
      <div className="border-t border-white/5 px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            {SPECIALTY_LIST.filter(v => v.slug !== slug).slice(0, 3).map((v) => (
              <Link
                key={v.slug}
                href={`/demo/${v.slug}`}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                {v.emoji} {v.title}
              </Link>
            ))}
          </div>
          <Link
            href="/define-intelligence"
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Define Your Own Intelligence →
          </Link>
        </div>
      </div>
    </div>
  )
}
