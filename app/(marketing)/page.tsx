import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const services = [
  {
    title: 'Front Desk Agents',
    eyebrow: 'Intake and scheduling',
    copy: 'Qualify leads, answer common questions, route requests, and hand off clean context to your team.',
    accent: 'border-[#00d4ff]/35 text-cyan',
  },
  {
    title: 'Business Twins',
    eyebrow: 'Operations memory',
    copy: 'Turn your services, policies, offers, and workflows into a deployable intelligence layer.',
    accent: 'border-[#c8ff00]/35 text-acid',
  },
  {
    title: 'Creator Systems',
    eyebrow: 'Content and monetization',
    copy: 'Package expertise into assistants, campaigns, premium experiences, and affiliate-ready funnels.',
    accent: 'border-[#a78bfa]/35 text-violet',
  },
]

const rolePaths = [
  {
    role: 'Clients',
    href: '/define-intelligence/client',
    metric: 'Blueprint -> Twin -> Deploy',
    copy: 'Build a practical AI operating system around the way your business already works.',
  },
  {
    role: 'Creators',
    href: '/define-intelligence/creator',
    metric: 'IP -> Product -> Revenue',
    copy: 'Turn your perspective, voice, and playbooks into an always-on intelligence product.',
  },
  {
    role: 'Personal',
    href: '/define-intelligence/personal',
    metric: 'Life -> Systems -> Growth',
    copy: 'Build a personal AI companion that learns your world, simplifies your day, and grows with you.',
  },
  {
    role: 'Affiliates',
    href: '/define-intelligence/affiliate',
    metric: 'Audience -> Match -> Commission',
    copy: 'Route the right people into the right systems with partner-ready tracking and offers.',
  },
]

const demoLanes = [
  ['Real Estate', '/demo/real-estate'],
  ['Hotel', '/demo/hotel'],
  ['Legal', '/demo/legal'],
  ['HR', '/demo/hr'],
  ['Med Spa', '/demo/med-spa'],
]

const exchangeItems = [
  'Agent templates for vertical demos',
  'Blueprint scoring and pricing paths',
  'n8n workflow bridge to Discord and social',
  'Supabase identity, roles, and vault data',
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: identity } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = identity?.role ?? 'client'
    redirect(`/dashboard/${role}`)
  }

  return (
    <div className="overflow-hidden bg-[#080810] text-white">
      <section className="relative flex min-h-[92vh] items-center px-5 pb-16 pt-28 md:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_20%,rgba(200,255,0,0.12),transparent_28%),radial-gradient(circle_at_78%_34%,rgba(0,212,255,0.1),transparent_26%)]" />
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff00] animate-pulse-slow" />
              Registered Intelligence Systems
            </div>

            <h1 className="max-w-5xl font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl xl:text-8xl">
              Audacity in every <span className="text-[#c8ff00]">algorithm</span>.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/48">
              Evolved Eden turns business knowledge into AI twins, workflow automations, and monetizable agent systems for clients,
              creators, and personal intelligence users.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/define-intelligence"
                className="inline-flex items-center justify-center rounded-sm bg-[#c8ff00] px-7 py-3.5 text-sm font-bold text-black transition-colors hover:bg-white glow-acid"
              >
                Define Your Intelligence
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-sm border border-white/15 px-7 py-3.5 text-sm text-white/72 transition-colors hover:border-white/30 hover:text-white"
              >
                Try Live Demo
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/30">
            <div className="rounded-md border border-white/10 bg-[#0d0d1a] p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/35">Live OS</p>
                  <h2 className="mt-2 text-2xl font-semibold">Blueprint command center</h2>
                </div>
                <span className="rounded-full border border-[#c8ff00]/30 px-3 py-1 text-xs text-acid">Active</span>
              </div>

              <div className="mt-5 grid gap-3">
                {[
                  ['Essence scan', 'Persona, offers, audience, operational voice', '92%'],
                  ['Agent map', 'Front desk, sales, vault, social routing', '11'],
                  ['Workflow bridge', 'n8n queue, scheduler, recovery, metrics', '5'],
                ].map(([label, copy, value]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{label}</h3>
                        <p className="mt-1 text-sm leading-6 text-white/40">{copy}</p>
                      </div>
                      <span className="text-sm font-semibold text-[#c8ff00]">{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  ['3', 'paths'],
                  ['5', 'demos'],
                  ['400', 'agents'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-black/20 px-3 py-4">
                    <div className="font-display text-2xl font-bold">{value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/30">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-y border-white/5 bg-[#0b0b14] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">Services</p>
              <h2 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
                Build the intelligence layer your business keeps trying to become.
              </h2>
            </div>
            <Link href="/intake" className="text-sm font-semibold text-[#c8ff00] hover:text-white">
              Start blueprint assessment
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.title} className={`rounded-lg border bg-white/[0.025] p-6 ${service.accent}`}>
                <p className="text-xs uppercase tracking-[0.26em] text-white/35">{service.eyebrow}</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">{service.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/45">{service.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="paths" className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">Role Paths</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              One platform, three ways in.
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {rolePaths.map((path) => (
              <Link
                key={path.role}
                href={path.href}
                className="group rounded-lg border border-white/10 bg-white/[0.025] p-6 transition-colors hover:border-[#c8ff00]/50"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-[#c8ff00]/70">{path.metric}</p>
                <h3 className="mt-5 text-3xl font-semibold">{path.role}</h3>
                <p className="mt-4 min-h-20 text-sm leading-7 text-white/45">{path.copy}</p>
                <span className="mt-6 inline-flex text-sm font-semibold text-white/60 transition-colors group-hover:text-[#c8ff00]">
                  Open path
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#0b0b14] px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">Demo Lanes</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Try the system in a real operating context.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45">
              Each demo packages a vertical intake, agent workflow, pricing motion, and operational handoff into a
              tangible preview.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {demoLanes.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25 hover:bg-white/[0.055]"
              >
                <span className="text-lg font-semibold">{label}</span>
                <span className="mt-3 block text-sm text-white/40">Explore demo</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="exchange" className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">Exchange</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              A marketplace for repeatable intelligence.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">
              Evolved Eden is evolving into an exchange where proven agents, workflow packs, creator systems, and referral
              paths can be reused across the ecosystem.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={process.env.NEXT_PUBLIC_EXCHANGE_URL || '/exchange'}
                target="_blank" rel="noopener"
                className="inline-flex items-center justify-center rounded-sm bg-[#c8ff00] px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-white"
              >
                Visit the Exchange
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center rounded-sm border border-white/15 px-6 py-3 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
              >
                Pricing
              </a>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-white/35">What is already wired</p>
            <div className="mt-5 space-y-3">
              {exchangeItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-md border border-white/10 bg-black/20 p-4">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#c8ff00]" />
                  <p className="text-sm leading-6 text-white/55">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
