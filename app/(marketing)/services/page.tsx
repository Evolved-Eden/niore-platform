'use client'

import Link from 'next/link'

const CONSULTING_TIERS = [
  {
    title: 'Intelligence Strategy & Design',
    tagline: 'Your vision, architected into an intelligence system',
    price: 'From $5,000',
    description: 'A deep-dive engagement for leaders who know what they want but need the intelligence. We map your organization, design your intelligence ecosystem, and deliver a ready-to-build roadmap — including agent architecture, data strategy, and deployment plan.',
    audience: 'Founders, CEOs, and leaders building their first or next-generation intelligence system.',
    deliverables: [
      'Organizational intelligence audit',
      'Custom agent architecture design',
      'Data & integration strategy',
      'Deployment roadmap with milestones',
      '2-week sprint delivery',
    ],
    color: '#C6A664',
    cta: 'Book a Strategy Session',
    ctaHref: '/define-intelligence/client',
  },
  {
    title: 'Agent Deployment & Integration',
    tagline: 'Intelligence, installed and working in your stack',
    price: 'From $15,000',
    description: 'We deploy, configure, and integrate AI agents into your existing workflows, tools, and data sources. Your team gets a fully operational intelligence system — not a proof of concept. We handle the technical integration so your agents start producing from day one.',
    audience: 'Teams with existing infrastructure who need AI agents deployed into production.',
    deliverables: [
      'Full agent deployment & configuration',
      'Integration with existing tools & APIs',
      'Custom workflow automation setup',
      'Team training & documentation',
      '30-day deployment timeline',
    ],
    color: '#5E8B84',
    cta: 'Start a Deployment',
    ctaHref: '/define-intelligence/client',
  },
  {
    title: 'Managed Intelligence Operations',
    tagline: 'Your entire AI ecosystem, run for you',
    price: 'From $25,000/mo',
    description: 'A dedicated intelligence operations service. We design, deploy, and continuously manage your complete AI ecosystem — including Zuri, your Workforce, Intelligence Exchange integrations, and ongoing optimization. This is white-glove intelligence for organizations that want the full power of Evolved Eden without building the team to run it.',
    audience: 'Enterprises and high-scale organizations that want a fully managed intelligence operation.',
    deliverables: [
      'Dedicated intelligence operations team',
      'Full ecosystem design & deployment',
      'Continuous monitoring & optimization',
      'Priority support & custom development',
      'Monthly intelligence performance review',
    ],
    color: '#8B7AA8',
    cta: 'Request Concierge Access',
    ctaHref: '/pricing',
    popular: true,
  },
]

const SERVICES_LIST = [
  {
    title: 'Essence Review',
    description: 'A deep-dive analysis of your current intelligence profile — strengths, gaps, and opportunities. You get a complete assessment and a prioritized action plan.',
    icon: '◈',
  },
  {
    title: 'Workforce Design',
    description: 'We design the ideal Workforce for your organization — which agents, teams, and departments you need, how they connect, and what they handle.',
    icon: '▣',
  },
  {
    title: 'Custom Agent Building',
    description: 'Need something we don\'t ship yet? We build custom agents tailored to your unique workflows, data sources, and industry requirements.',
    icon: '◇',
  },
  {
    title: 'Integration Setup',
    description: 'Connect Evolved Eden to your existing tools — CRM, calendar, email, Slack, analytics, and any API. We handle the technical setup end to end.',
    icon: '◎',
  },
  {
    title: 'Team Training',
    description: 'Hands-on training for your team so they can operate, customize, and extend your intelligence ecosystem without depending on us.',
    icon: '✦',
  },
  {
    title: 'Ongoing Optimization',
    description: 'Continuous improvement of your intelligence system — agent tuning, workflow refinement, and capability expansion as your organization evolves.',
    icon: '⊙',
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <main>
        {/* Hero */}
        <section className="px-6 py-20 md:py-28 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full text-xs text-white/40 mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A664] animate-pulse-slow" />
            Services
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
            Intelligence <span className="text-[#C6A664]">Consulting</span> & Deployment
          </h1>
          <p className="text-white/40 text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Not every organization needs the same intelligence system. We offer three tiers of
            consulting services — from strategic design to fully managed operations — so you get
            exactly the intelligence your organization needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#tiers" className="px-8 py-3.5 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all">
              View Consulting Tiers →
            </Link>
            <Link href="/intelligence-exchange" className="px-8 py-3.5 border border-white/20 text-white font-bold text-sm rounded-sm hover:bg-white/10 transition-all">
              Browse Intelligence Exchange
            </Link>
          </div>
        </section>

        {/* Consulting Tiers */}
        <section id="tiers" className="px-6 py-16 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-white/35 mb-3">Consulting Tiers</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Three Ways to Build
            </h2>
            <p className="text-white/40 text-sm max-w-xl mx-auto">
              From strategy to full operations — pick the engagement that matches your ambition.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {CONSULTING_TIERS.map((tier, i) => (
              <div
                key={i}
                className={`relative rounded-lg border p-8 flex flex-col ${
                  tier.popular
                    ? 'border-[#C6A664] bg-white/[0.03]'
                    : 'border-white/10 bg-white/[0.02]'
                } hover:border-white/20 transition-all`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold bg-[#C6A664] text-black">
                    Most Comprehensive
                  </div>
                )}
                <div className="mb-2">
                  <span className="text-xs uppercase tracking-widest" style={{ color: tier.color }}>
                    {tier.popular ? 'Managed Operations' : i === 0 ? 'Strategic' : 'Tactical'}
                  </span>
                  <h3 className="font-display text-2xl font-bold mt-1">{tier.title}</h3>
                </div>
                <p className="text-sm text-white/40 mt-3 mb-4 flex-1">{tier.description}</p>
                <div className="mb-6">
                  <p className="text-lg font-bold" style={{ color: tier.color }}>{tier.price}</p>
                  <p className="text-xs text-white/30 mt-1">{tier.audience}</p>
                </div>
                <div className="flex flex-col gap-2 mb-8">
                  {tier.deliverables.map((d, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm text-white/50">
                      <span style={{ color: tier.color }}>→</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={tier.ctaHref}
                  className="mt-auto text-center px-6 py-3 text-sm font-bold rounded-sm transition-all"
                  style={{
                    backgroundColor: tier.color,
                    color: '#0A0A0B',
                  }}
                >
                  {tier.cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Services */}
        <section className="px-6 py-20 border-t border-white/5 bg-[#0b0b14]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35 mb-3">Add-on Services</p>
              <h2 className="font-display text-4xl font-bold tracking-tight mb-4">
                Every Intelligence Needs a Foundation
              </h2>
              <p className="text-white/40 text-sm max-w-xl mx-auto">
                Individual services available a la carte — pick what you need, skip what you don&apos;t.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES_LIST.map((svc, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.025] p-6 hover:border-white/20 transition-all">
                  <span className="text-lg mb-3 block">{svc.icon}</span>
                  <h3 className="font-display text-lg font-bold mb-2">{svc.title}</h3>
                  <p className="text-sm text-white/40">{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <h2 className="font-display text-4xl font-bold mb-4">Not Sure Where to Start?</h2>
          <p className="text-white/40 text-sm max-w-lg mx-auto mb-8">
            Every intelligence system starts with defining what you need. Take the first step.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/define-intelligence" className="px-10 py-4 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all">
              Define Your Intelligence →
            </Link>
            <Link href="/demo" className="px-10 py-4 border border-white/20 text-white font-bold text-sm rounded-sm hover:bg-white/10 transition-all">
              Explore Demos
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
