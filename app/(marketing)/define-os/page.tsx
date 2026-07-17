'use client'

import Link from 'next/link'

export default function DefineOSPage() {
  const osTypes = [
    {
      title: 'Personal OS',
      forWhom: 'For your own life',
      result: 'Clearer decisions, less mental load, every day.',
      features: ['Identity Profile', 'Decision Support', 'Daily Planning', 'Personal Assistant'],
      color: '#8B7AA8',
    },
    {
      title: 'Founder OS',
      forWhom: 'For building companies',
      result: 'Go from idea to running organization, fast.',
      features: ['Company Formation', 'Operating Structure', 'Executive Team', 'Growth Systems'],
      color: '#C6A664',
    },
    {
      title: 'Creator OS',
      forWhom: 'For building an audience',
      result: 'Turn what you know into products that sell.',
      features: ['Content Engine', 'Course Builder', 'Brand Voice', 'Sales Funnel'],
      color: '#8B7AA8',
    },
    {
      title: 'Business OS',
      forWhom: 'For running what you already have',
      result: 'Every department covered, without new headcount.',
      features: ['Sales Team', 'Marketing Team', 'Operations Team', 'Finance Team'],
      color: '#5E8B84',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <main>
        {/* Hero */}
        <section className="px-6 py-20 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full text-xs text-white/40 mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A664] animate-pulse-slow" />
            The Intelligence Operating System™
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
            Your Operating System Is <span className="text-[#C6A664]">How You Run</span>
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Intelligence is what you need to know. Your Operating System is how you execute.
            Together, they form the infrastructure that your business, creativity, and life run on.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/define-intelligence" className="px-8 py-3.5 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all">
              Choose Your Intelligence First →
            </Link>
            <Link href="#os-types" className="px-8 py-3.5 border border-[#C6A664] text-white font-bold text-sm rounded-sm hover:bg-white/10 transition-all">
              Explore OS Types
            </Link>
          </div>
        </section>

        {/* What is an OS */}
        <section className="px-6 py-20 border-y border-white/5 bg-[#0b0b14]">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/35 mb-4">What It Is</p>
              <h2 className="font-display text-3xl font-bold mb-4">Your Intelligence Operating System</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                An Operating System is the layer that runs everything — your agents, workflows, automations,
                and decision systems. It is the engine beneath your intelligence.
              </p>
            </div>
            <div className="space-y-6">
              <div className="rounded-lg border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-[#C6A664] mb-2">Intelligence</h3>
                <p className="text-sm text-white/40">The knowledge, data, and context your system needs to make decisions.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-[#C6A664] mb-2">Operating System</h3>
                <p className="text-sm text-white/40">The structure, agents, workflows, and automations that execute on that knowledge.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-[#C6A664] mb-2">Together</h3>
                <p className="text-sm text-white/40">They form a complete intelligence ecosystem — you decide what to build, Zuri coordinates the execution.</p>
              </div>
            </div>
          </div>
        </section>

        {/* OS Types */}
        <section id="os-types" className="px-6 py-20 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-white/35 mb-3">Choose Your OS</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
              One Operating System, Four Expressions
            </h2>
            <p className="text-white/40 text-sm max-w-xl mx-auto">
              Every Intelligence needs an Operating System. Pick the one that matches your world.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {osTypes.map((os, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/[0.025] p-8 hover:border-white/20 transition-all">
                <h3 className="font-display text-2xl font-bold mb-1" style={{ color: os.color }}>{os.title}</h3>
                <p className="text-xs uppercase tracking-wider text-white/40 mb-3">{os.forWhom}</p>
                <p className="text-white/60 text-sm mb-5">{os.result}</p>
                <div className="flex flex-wrap gap-2">
                  {os.features.map((f, j) => (
                    <span key={j} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: `${os.color}30`, color: os.color }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 border-t border-white/5 bg-[#0b0b14] text-center">
          <h2 className="font-display text-4xl font-bold mb-4">Ready to define your intelligence?</h2>
          <p className="text-white/40 text-sm max-w-lg mx-auto mb-8">
            Choose your path first — your Operating System follows naturally.
          </p>
          <Link href="/define-intelligence" className="inline-block px-10 py-4 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all">
            Define Your Intelligence →
          </Link>
        </section>
      </main>
    </div>
  )
}
