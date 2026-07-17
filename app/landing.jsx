'use client'

import React, { useState } from "react";
import Link from 'next/link'
import {
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Building2,
  Users,
  UserSquare2,
  UserPlus,
  Zap,
  Crown,
  Boxes,
  Layers,
  BookOpen,
  Brain,
  Search,
  TrendingUp,
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS — luxe editorial: obsidian, champagne, ivory, wine
   (unchanged from prior pass — this round is story, not UI)
--------------------------------------------------------- */
const INK = "#0A0A0B";
const SURFACE = "#141414";
const LINE = "#2A2A2A";
const GOLD = "#C6A664";
const IVORY = "#F3EEE6";
const STONE = "#A8A29A";


function SealBadge({ size = 150 }) {
  const id = "sealpath";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ animation: "spin 40s linear infinite" }}>
      <defs>
        <path id={id} d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke={GOLD} strokeWidth="0.75" />
      <circle cx="100" cy="100" r="60" fill="none" stroke={GOLD} strokeWidth="0.75" />
      <text fill={GOLD} fontSize="9.5" letterSpacing="2.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <textPath href={`#${id}`} startOffset="0%">
          AUDACITY IN EVERY ALGORITHM • EVOLVED EDEN • AUDACITY IN EVERY ALGORITHM •
        </textPath>
      </text>
      <text x="100" y="107" textAnchor="middle" fill={IVORY} fontSize="26" style={{ fontFamily: "'Italiana', serif" }}>
        EE
      </text>
    </svg>
  );
}

function Eyebrow({ children }) {
  return (
    <div className="uppercase tracking-[0.3em] text-xs mb-4 font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: GOLD }}>
      {children}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ border: `1px solid ${LINE}`, color: IVORY, backgroundColor: "rgba(198,166,100,0.05)" }}>
      {children}
    </span>
  );
}

function PrimaryButton({ children, className = "", href }) {
  const cls = `px-8 py-3.5 text-sm md:text-base tracking-wide transition-transform hover:scale-[1.02] inline-block ${className}`
  const style = { backgroundColor: GOLD, color: INK }
  if (href) {
    return <Link href={href} className={cls} style={style}>{children}</Link>
  }
  return <button className={cls} style={style}>{children}</button>
}

function GhostButton({ children, className = "", href }) {
  const cls = `px-8 py-3.5 text-sm md:text-base tracking-wide transition-colors inline-block ${className}`
  const style = { border: `1px solid ${GOLD}`, color: IVORY }
  if (href) {
    return <Link href={href} className={cls} style={style}>{children}</Link>
  }
  return <button className={cls} style={style}>{children}</button>
}



function OrgTier({ label, items, caption }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="uppercase tracking-[0.25em] text-xs mb-3"
        style={{ color: GOLD, fontFamily: "'Manrope', sans-serif" }}
      >
        {label}
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-3xl mb-2">
        {items.map((it, i) => (
          <span
            key={i}
            className="px-4 py-2 text-sm"
            style={{ border: `1px solid ${LINE}`, color: IVORY, backgroundColor: SURFACE }}
          >
            {it}
          </span>
        ))}
      </div>
      {caption && <p className="text-xs italic" style={{ color: STONE }}>{caption}</p>}
    </div>
  );
}

function OrgConnector() {
  return <div className="w-px h-8" style={{ backgroundColor: GOLD, opacity: 0.5 }} />;
}

const zuriCapabilities = [
  { icon: Brain, title: "Remembers Everything", body: "Every decision, every preference, permanently retained." },
  { icon: Search, title: "Learns Your Business", body: "Studies your market, your voice, your standards." },
  { icon: Users, title: "Delegates Work", body: "Assigns the right task to the right Employee, instantly." },
  { icon: UserPlus, title: "Hires Intelligence", body: "Recruits new Elite Employees the moment you need them." },
  { icon: Building2, title: "Installs Departments", body: "Adds entire functions to your organization on demand." },
  { icon: Crown, title: "Supervises Executives", body: "Keeps your Executive Council aligned to your goals." },
  { icon: TrendingUp, title: "Improves Over Time", body: "Gets sharper with every decision she makes for you." },
];

const workforceTiers = [
  {
    icon: Crown,
    title: "Executives",
    tagline: "Leadership that coordinates your Workforce.",
    roles: ["Chief Marketing Officer", "Chief Financial Officer", "Chief Operations Officer", "Chief Growth Officer"],
    note: "Zuri sits above them.",
  },
  {
    icon: Building2,
    title: "Departments",
    tagline: "Multiple Teams, orchestrated as one operating function.",
    roles: ["Marketing", "Sales", "Finance", "Operations", "Research", "Creative"],
  },
  {
    icon: Users,
    title: "Teams",
    tagline: "Specialized groups of Employees solving one objective.",
    roles: ["Launch Team", "Content Team", "Sales Team", "Growth Team", "Support Team"],
  },
  {
    icon: UserSquare2,
    title: "Elite Employees",
    tagline: "Experts trained for one responsibility.",
    roles: ["Marketing Strategist", "Research Analyst", "Operations Specialist", "Sales Representative", "Creative Director"],
  },
];

const flagshipOS = [
  {
    title: "Personal OS",
    forWhom: "For your own life",
    result: "Clearer decisions, less mental load, every day.",
    features: ["Identity Profile", "Decision Support", "Daily Planning", "Personal Assistant"],
  },
  {
    title: "Founder OS",
    forWhom: "For building companies",
    result: "Go from idea to running organization, fast.",
    features: ["Company Formation", "Operating Structure", "Executive Team", "Growth Systems"],
  },
  {
    title: "Creator OS",
    forWhom: "For building an audience",
    result: "Turn what you know into products that sell.",
    features: ["Content Engine", "Course Builder", "Brand Voice", "Sales Funnel"],
  },
  {
    title: "Business OS",
    forWhom: "For running what you already have",
    result: "Every department covered, without new headcount.",
    features: ["Sales Team", "Marketing Team", "Operations Team", "Finance Team"],
  },
];
const moreOS = ["Executive OS", "Enterprise OS", "Relationship OS", "Legacy OS"];

const exchangeCategories = [
  { title: "Personal Intelligence", items: ["Identity Profiles", "Essence Profile", "Decision Systems", "Growth Maps"] },
  { title: "Business Intelligence", items: ["Founder Systems", "Marketing Intelligence", "Sales Intelligence", "Operations Intelligence"] },
  { title: "Creative Intelligence", items: ["Creator Systems", "Content Engines", "Brand Intelligence"] },
  { title: "Automated Intelligence", items: ["Workflows", "Business Machines", "Autonomous Systems"] },
];

const faqs = [
  {
    q: "What makes Evolved Eden different from AI assistants?",
    a: "Most AI gives you a conversation. Evolved Eden gives you an intelligence ecosystem designed around you — your goals, your work, your decisions, and your growth.",
  },
  {
    q: "What's the difference between an Elite Employee, a Team, and a Department?",
    a: "An Elite Employee is a single expert trained for one responsibility. A Team is a group of Employees solving one objective together. A Department orchestrates multiple Teams into a single operating function — with Executives coordinating above them, and Zuri above that.",
  },
  {
    q: "Who is Zuri Niorè?",
    a: "Zuri Niorè is your Chief Intelligence Officer — the mind behind your Workforce. She coordinates your Executives, manages your Departments, deploys Elite Employees, and installs new capability from the Intelligence Exchange. She isn't a chatbot; she's the intelligence layer connecting your entire organization.",
  },
  {
    q: "What can I add to my intelligence ecosystem?",
    a: "You can expand your system with new capabilities, specialized experts, business functions, creative tools, and automated solutions — the moment you need them.",
  },
  {
    q: "Which membership is right for me?",
    a: "Affiliate is built for referral and partnership income. Personal is your private command center. Creator is for building and selling your own work. Client is built for B2C — consumer-facing brands and large organizations selling at scale. All four share one Operating System underneath, and Concierge is available separately if you'd rather have it built for you.",
  },
];

export default function EvolvedEdenLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div style={{ backgroundColor: INK, color: IVORY }} className="min-h-screen w-full overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Italiana&family=Manrope:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Italiana', serif; }
        .font-body { font-family: 'Manrope', sans-serif; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .reveal { animation: fadeUp 0.8s ease both; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="font-body">
        {/* NAV */}
        <header className="sticky top-0 z-50 backdrop-blur" style={{ backgroundColor: "rgba(10,10,11,0.88)", borderBottom: `1px solid ${LINE}` }}>
          <div className="max-w-6xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
            <span className="font-display text-xl tracking-widest">EVOLVED EDEN</span>

            <nav className="hidden lg:flex items-center gap-7 text-sm tracking-wide" style={{ color: STONE }}>
              <a href="#workforce" className="hover:text-white transition-colors">Workforce™</a>
              <a href="#os" className="hover:text-white transition-colors">Operating Systems</a>
              <a href="#zuri" className="hover:text-white transition-colors">Zuri Niorè</a>
              <a href="#exchange" className="hover:text-white transition-colors">Intelligence Exchange</a>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/demo" className="hover:text-white transition-colors">Demos</Link>
            </nav>

            <div className="hidden md:flex items-center gap-5">
              <Link href="/pricing" className="text-sm tracking-wide hover:text-white transition-colors" style={{ color: STONE }}>Pricing</Link>
              <PrimaryButton href="/define-intelligence">Enter Platform</PrimaryButton>
            </div>

            <button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {menuOpen && (
            <div className="lg:hidden px-6 pb-6 flex flex-col gap-4 text-sm" style={{ color: STONE }}>
              <a href="#workforce">Workforce™</a>
              <a href="#os">Operating Systems</a>
              <a href="#zuri">Zuri Niorè</a>
              <a href="#exchange">Intelligence Exchange</a>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/demo" className="hover:text-white transition-colors">Demos</Link>
              <PrimaryButton href="/define-intelligence" className="mt-2 w-full">Enter Platform</PrimaryButton>
            </div>
          )}
        </header>

        {/* HERO */}
        <section className="max-w-6xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-20 grid md:grid-cols-2 gap-14 items-center">
          <div className="reveal">
            <Eyebrow>The Intelligence Operating System™</Eyebrow>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mb-6">
              Design Your Intelligence.
              <br />
              <span style={{ color: GOLD }}>Build the Organization</span>
              <br />
              You Are Meant to Lead.
            </h1>
            <p className="text-lg leading-relaxed mb-4 max-w-md font-medium" style={{ color: GOLD }}>
              Most AI helps you complete tasks. Evolved Eden helps you build an
              intelligent ecosystem around who you are.
            </p>
            <p className="text-lg leading-relaxed mb-8 max-w-md" style={{ color: STONE }}>
              Meet Zuri Niorè — your Chief Intelligence Officer. You stay in charge.
              She coordinates your Workforce.
            </p>
            <div className="flex flex-wrap gap-4">
              <PrimaryButton href="/define-intelligence">Design My Workforce</PrimaryButton>
              <GhostButton href="/pricing">Explore Operating Systems</GhostButton>
            </div>
          </div>

          <div className="relative reveal flex justify-center" style={{ animationDelay: "0.15s" }}>
            <SealBadge size={280} />
          </div>
        </section>

        {/* TICKER */}
        <div className="overflow-hidden py-4" style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
          <div className="flex whitespace-nowrap text-sm md:text-base tracking-[0.3em] uppercase" style={{ color: GOLD, animation: "ticker 26s linear infinite", width: "max-content" }}>
            {Array(2)
              .fill("Design Intelligence  ·  Build Workforce  ·  Scale Legacy  ·  ")
              .map((t, i) => (
                <span key={i} className="pr-4">{t}</span>
              ))}
          </div>
        </div>

        {/* HOW ZURI WORKS */}
        <section id="zuri" className="px-6 md:px-10 py-20 md:py-28" style={{ backgroundColor: SURFACE, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-16">
              <Eyebrow>How Zuri Works</Eyebrow>
              <h2 className="font-display text-4xl md:text-5xl mb-5">Meet Your Chief Intelligence Officer</h2>
              <p className="text-lg leading-relaxed" style={{ color: STONE }}>
                Zuri isn't another chatbot. She coordinates your intelligence
                ecosystem — your Workforce™, your Operating System, and every
                capability you add as you grow.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {zuriCapabilities.map(({ icon: Icon, title, body }, i) => (
                <div key={i} className="p-6" style={{ border: `1px solid ${LINE}`, backgroundColor: INK }}>
                  <Icon size={20} style={{ color: GOLD }} className="mb-3" />
                  <h3 className="font-display text-lg mb-2">{title}</h3>
                  <p className="text-sm" style={{ color: STONE }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ORG CHART */}
        <section className="px-6 md:px-10 py-20 md:py-28" style={{ backgroundColor: SURFACE, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
          <div className="max-w-5xl mx-auto text-center mb-10">
            <Eyebrow>How It's Organized</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-6">One Chart Says It All</h2>
            <p className="text-lg leading-relaxed max-w-xl mx-auto" style={{ color: IVORY }}>
              You're in charge of your organization. Zuri runs it for you.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="px-8 py-4 mb-1 text-center" style={{ border: `1px solid ${LINE}`, backgroundColor: INK }}>
              <div className="font-display text-xl tracking-widest">YOU</div>
              <div className="text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: GOLD }}>In Charge</div>
            </div>
            <p className="text-xs italic mb-2" style={{ color: STONE }}>Vision.</p>
            <OrgConnector />
            <div className="px-8 py-3 mb-1 text-center" style={{ border: `1px solid ${LINE}`, backgroundColor: SURFACE }}>
              <div className="text-sm uppercase tracking-[0.2em]" style={{ color: IVORY }}>Your Intelligence Ecosystem</div>
            </div>
            <OrgConnector />
            <div className="px-8 py-4 mb-1 mt-1 text-center" style={{ border: `1px solid ${GOLD}`, backgroundColor: INK }}>
              <div className="font-display text-2xl tracking-widest">ZURI NIORÈ</div>
              <div className="text-xs uppercase tracking-[0.25em] mt-1" style={{ color: GOLD }}>
                Chief Intelligence Officer
              </div>
            </div>
            <p className="text-xs italic mb-2" style={{ color: STONE }}>Runs It.</p>
            <OrgConnector />
            <OrgTier label="Executive Leadership Council" items={["CMO", "COO", "CFO", "CGO", "CSO", "CXO"]} caption="Lead." />
            <OrgConnector />
            <OrgTier label="Departments" items={["Marketing", "Sales", "Operations", "Finance", "Research", "Creative", "Customer Success"]} caption="Manage." />
            <OrgConnector />
            <OrgTier label="Teams" items={["Content Team", "Growth Team", "Launch Team", "Analytics Team", "Support Team"]} caption="Collaborate." />
            <OrgConnector />
            <OrgTier label="Elite Employees" items={["Marketing Strategist", "SEO Specialist", "Research Analyst", "Financial Planner", "Creative Writer", "Automation Specialist"]} caption="Execute." />
            <OrgConnector />
            <OrgTier label="Workflows & Automations" items={["Workflows", "Knowledge", "Generators"]} caption="Repeat." />
          </div>
        </section>

        {/* BUILD YOUR WORKFORCE */}
        <section id="workforce" className="px-6 md:px-10 py-20 md:py-28" style={{ backgroundColor: SURFACE, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
          <div className="max-w-6xl mx-auto">
            <div className="max-w-xl mb-14">
              <Eyebrow>Workforce™</Eyebrow>
              <h2 className="font-display text-4xl md:text-5xl mb-4">Build Your Workforce</h2>
              <p className="text-lg leading-relaxed" style={{ color: STONE }}>
                Every organization needs leaders, specialists, and systems. Now you can
                deploy all three.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {workforceTiers.map(({ icon: Icon, title, tagline, roles, note }, i) => (
                <div key={i} className="p-8" style={{ backgroundColor: INK, border: `1px solid ${LINE}` }}>
                  <Icon size={22} style={{ color: GOLD }} className="mb-4" />
                  <h3 className="font-display text-2xl mb-2">{title}</h3>
                  <p className="mb-5" style={{ color: STONE }}>{tagline}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {roles.map((r, j) => (
                      <span key={j} className="text-xs px-3 py-1.5" style={{ border: `1px solid ${LINE}`, color: IVORY }}>
                        {r}
                      </span>
                    ))}
                  </div>
                  {note && <p className="text-xs tracking-wide" style={{ color: GOLD }}>{note}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OPERATING SYSTEMS */}
        <section id="os" className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28 text-center">
          <Eyebrow>Operating Systems</Eyebrow>
          <h2 className="font-display text-4xl md:text-5xl mb-5">Choose the Intelligence System That Matches Your Life</h2>
          <p className="text-lg leading-relaxed mb-14 max-w-2xl mx-auto" style={{ color: STONE }}>
            One Operating System, chosen for who you are — every Department, Team, and
            Executive already fits inside it.
          </p>
          <div className="grid md:grid-cols-4 gap-5 text-left mb-8">
            {flagshipOS.map((os, i) => (
              <div key={i} className="p-7 flex flex-col" style={{ border: `1px solid ${LINE}`, backgroundColor: SURFACE }}>
                <h3 className="font-display text-2xl mb-1">{os.title}</h3>
                <div className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: GOLD }}>{os.forWhom}</div>
                <p className="text-sm mb-5" style={{ color: IVORY }}>{os.result}</p>
                <div className="flex flex-col gap-2 mt-auto">
                  {os.features.map((f, j) => (
                    <React.Fragment key={j}>
                      <span className="text-sm" style={{ color: STONE }}>{f}</span>
                      {j < os.features.length - 1 && <div style={{ borderTop: `1px solid ${LINE}` }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {moreOS.map((os, i) => (
              <Chip key={i}>{os}</Chip>
            ))}
          </div>
        </section>

        {/* INTELLIGENCE EXCHANGE */}
        <section id="exchange" className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28 text-center">
          <Boxes size={26} style={{ color: GOLD }} className="mx-auto mb-5" />
          <Eyebrow>Intelligence Exchange™</Eyebrow>
          <h2 className="font-display text-4xl md:text-5xl mb-5">Where Your Ecosystem Expands</h2>
          <p className="text-lg leading-relaxed mb-14 max-w-2xl mx-auto" style={{ color: STONE }}>
            New capabilities, specialized experts, business functions, creative tools,
            and automated solutions — added the moment you need them.
          </p>
          <div className="grid md:grid-cols-4 gap-5 text-left">
            {exchangeCategories.map((cat, i) => (
              <div key={i} className="p-6" style={{ border: `1px solid ${LINE}`, backgroundColor: SURFACE }}>
                <h4 className="uppercase text-xs tracking-widest mb-4" style={{ color: GOLD }}>{cat.title}</h4>
                <div className="flex flex-col gap-2 text-sm" style={{ color: STONE }}>
                  {cat.items.map((it, j) => (
                    <span key={j}>{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm mt-10" style={{ color: STONE }}>
            The Twin Registry — people whose trained Twins are available to hire, entirely by their own choice.
          </p>
        </section>

        {/* DEFINE THE FUTURE */}
        <section className="px-6 md:px-10 py-20 md:py-28" style={{ backgroundColor: SURFACE, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
          <div className="max-w-4xl mx-auto text-center">
            <Eyebrow>Define the Future</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-6 leading-tight">
              Define the Future of AI,
              <br /> With Audacity.
            </h2>
            <p className="text-lg leading-relaxed mb-14 max-w-2xl mx-auto" style={{ color: STONE }}>
              Step into a new paradigm where intelligence meets boldness. Evolved Eden is
              more than software — it's a movement where your instinct leads the
              technology, setting not just a path, but a standard.
            </p>
            <div className="grid md:grid-cols-3 gap-10 text-left">
              <div>
                <h3 className="font-display text-xl mb-2">Confidence</h3>
                <p style={{ color: STONE }}>Be the leader, not the follower, of the digital revolution.</p>
              </div>
              <div>
                <h3 className="font-display text-xl mb-2">Ambition</h3>
                <p style={{ color: STONE }}>Set standards that don't just meet the industry — they redefine it.</p>
              </div>
              <div>
                <h3 className="font-display text-xl mb-2">Influence</h3>
                <p style={{ color: STONE }}>Craft solutions that are intelligent first, and iconic because of it.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW EVOLVED EDEN WORKS */}
        <section className="max-w-5xl mx-auto px-6 md:px-10 py-20 md:py-24 text-center">
          <Eyebrow>How Evolved Eden Works</Eyebrow>
          <h2 className="font-display text-4xl md:text-5xl mb-14">A Simple Journey</h2>
          <div className="flex flex-col items-center max-w-md mx-auto">
            {[
              "Choose Membership",
              "Install Operating System",
              "Deploy Workforce™",
              "Customize Intelligence",
              "Scale Through the Intelligence Exchange",
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-4 w-full">
                  <span className="font-display text-2xl" style={{ color: GOLD }}>{i + 1}</span>
                  <span className="font-display text-lg text-left">{step}</span>
                </div>
                {i < arr.length - 1 && <div className="my-3 w-px h-6" style={{ backgroundColor: LINE }} />}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* CHOOSE YOUR MEMBERSHIP */}
        <section className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28 text-center">
          <Eyebrow>Begin Here</Eyebrow>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Choose Your Membership</h2>
          <p className="text-lg leading-relaxed mb-12 max-w-xl mx-auto" style={{ color: STONE }}>
            Membership defines who you join as. Your Operating System defines what you build.
          </p>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { t: "Affiliate", d: "Grow your income by sharing intelligence.", slug: "affiliate" },
              { t: "Personal", d: "Your private intelligence ecosystem.", slug: "personal" },
              { t: "Creator", d: "Build, publish, and monetize your expertise.", slug: "creator" },
              { t: "Client", d: "Deploy a complete intelligent organization — built for B2C brands and large organizations.", slug: "client" },
            ].map((m, i) => (
              <Link key={i} href={`/define-intelligence/${m.slug}`} className="block p-8" style={{ border: `1px solid ${LINE}`, backgroundColor: SURFACE }}>
                <h3 className="font-display text-xl mb-2">{m.t}</h3>
                <p className="text-sm" style={{ color: STONE }}>{m.d}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* OUR STORY */}
        <section className="max-w-2xl mx-auto px-6 md:px-10 py-20 md:py-28 text-center">
          <Eyebrow>Our Story</Eyebrow>
          <h2 className="font-display text-4xl md:text-5xl mb-5">A Sibling Ecosystem</h2>
          <p className="text-lg leading-relaxed" style={{ color: STONE }}>
            Evolved Eden shares its foundation with a family of platform ecosystems —
            same engine, distinct standard. Built for those who were never going to
            wait their turn.
          </p>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="text-center mb-14">
            <Eyebrow>Common Questions</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl">Frequently Asked Questions</h2>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <div key={i} style={{ border: `1px solid ${LINE}`, backgroundColor: SURFACE }}>
                <button className="w-full flex items-center justify-between gap-4 p-6 text-left" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span className="font-display text-lg">{f.q}</span>
                  <ChevronDown size={20} style={{ color: GOLD, transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
                </button>
                {openFaq === i && <p className="px-6 pb-6 -mt-2" style={{ color: STONE }}>{f.a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative px-6 md:px-10 py-24 md:py-32 text-center" style={{ borderTop: `1px solid ${LINE}`, backgroundColor: SURFACE }}>
          <div className="relative">
            <Sparkles size={24} style={{ color: GOLD }} className="mx-auto mb-5" />
            <h2 className="font-display text-4xl md:text-5xl mb-5 max-w-2xl mx-auto leading-tight">
              The Future Doesn't Need More Software.
              <br /> It Needs Better Organizations.
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: STONE }}>
              Design Your Intelligence. Build Your Workforce. Lead What's Next.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <PrimaryButton href="/define-intelligence">Design My Operating System</PrimaryButton>
              <GhostButton href="/define-intelligence">Design Your Intelligence</GhostButton>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="max-w-6xl mx-auto px-6 md:px-10 py-14 border-t" style={{ borderColor: LINE }}>
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <span className="font-display text-lg tracking-widest">EVOLVED EDEN</span>
              <p className="text-sm mt-3" style={{ color: STONE }}>The Intelligence Operating System™</p>
            </div>
            <div>
              <h4 className="uppercase text-xs tracking-widest mb-4" style={{ color: GOLD }}>Platform</h4>
              <div className="flex flex-col gap-3 text-sm" style={{ color: STONE }}>
                <a href="#workforce" className="hover:text-white">Workforce™</a>
                <a href="#os" className="hover:text-white">Operating Systems</a>
                <a href="#exchange" className="hover:text-white">Intelligence Exchange</a>
              </div>
            </div>
            <div>
              <h4 className="uppercase text-xs tracking-widest mb-4" style={{ color: GOLD }}>Membership</h4>
              <div className="flex flex-col gap-3 text-sm" style={{ color: STONE }}>
                <Link href="/define-intelligence/affiliate" className="hover:text-white">Affiliate</Link>
                <Link href="/define-intelligence/personal" className="hover:text-white">Personal</Link>
                <Link href="/define-intelligence/creator" className="hover:text-white">Creator</Link>
                <Link href="/define-intelligence/client" className="hover:text-white">Client</Link>
              </div>
            </div>
            <div>
              <h4 className="uppercase text-xs tracking-widest mb-4" style={{ color: GOLD }}>Company</h4>
              <div className="flex flex-col gap-3 text-sm" style={{ color: STONE }}>
                <Link href="/define-intelligence" className="hover:text-white">Our Story</Link>
                <Link href="#zuri" className="hover:text-white">Zuri Niorè</Link>
                <Link href="/pricing" className="hover:text-white">Enterprise</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
