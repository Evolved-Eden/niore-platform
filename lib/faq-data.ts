export type FaqCategory = {
  id: string
  label: string
  icon: string
  questions: FaqItem[]
}

export type FaqItem = {
  q: string
  a: string
  tags?: string[]
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "overview",
    label: "Platform Overview",
    icon: "◈",
    questions: [
      {
        q: "What is Evolved Eden?",
        a: "Evolved Eden is a Registered Intelligence System (RIS) platform. We build and deploy AI twins, specialized agents, swarms, and workflow automations for businesses, creators, and professionals. Think of it as your private intelligence infrastructure — a complete operating system for your life and business.",
        tags: ["what is", "about", "platform"],
      },
      {
        q: "How is Evolved Eden different from ChatGPT or other AI tools?",
        a: "ChatGPT is a general-purpose chatbot. Evolved Eden is a full intelligence ecosystem. You get: a persistent AI twin that knows your business, specialized agents that perform specific functions (lead nurturing, document processing, market intelligence), swarms that coordinate multiple agents, an Essence Board for daily intelligence briefs, and a vault for secure data storage. It's private, persistent, and purpose-built for your operations.",
        tags: ["difference", "chatgpt", "vs", "comparison"],
      },
      {
        q: "What is a Registered Intelligence System (RIS)?",
        a: "An RIS is a legally recognized AI entity that operates on your behalf. Unlike generic AI tools, an RIS has defined identity, agency, and accountability boundaries. It can execute workflows, make decisions within your parameters, and interact with other systems and agents. Every RIS at Evolved Eden is registered with a unique identity, governance model, and operational scope.",
        tags: ["ris", "registered", "intelligence", "system"],
      },
    ],
  },
  {
    id: "agents",
    label: "Agents & Intelligence",
    icon: "✦",
    questions: [
      {
        q: "What's the difference between an AI Twin and an Agent?",
        a: "Your AI Twin is the core intelligence — it represents YOU in the ecosystem. It knows your identity, preferences, history, and goals. Agents are specialized workers that perform specific tasks (e.g., Lead Nurture Agent handles prospect follow-ups, Document Intelligence processes files). The Twin directs, agents execute. Swarms coordinate multiple agents toward a larger goal.",
        tags: ["twin", "agent", "difference"],
      },
      {
        q: "How many agents can I have?",
        a: "The Founder plan includes 1 intelligence instance with 3 agent slots. Teams get 3 agents with swarm deployment. Enterprise has unlimited agents and swarms. You can always add more agents as add-ons regardless of your plan.",
        tags: ["agents", "limit", "slots", "how many"],
      },
      {
        q: "Can I customize agents for my specific business?",
        a: "Yes. Every agent is configurable — you set their behavior, knowledge sources, communication style, automation level, and integration points. Our blueprint assessment recommends the right agents for your vertical, and you can fine-tune them from your dashboard.",
        tags: ["customize", "configure", "custom"],
      },
      {
        q: "What verticals do you support?",
        a: "We currently have demos and agent packs for: Luxury Med Spa, Luxury Hotel, Luxury Real Estate, Corporate HR, and Legal Practice. Our blueprint assessment maps your needs to the right agents regardless of industry — we can build custom verticals for Enterprise clients.",
        tags: ["verticals", "industries", "demos"],
      },
    ],
  },
  {
    id: "pricing",
    label: "Pricing & Plans",
    icon: "◇",
    questions: [
      {
        q: "How much does Evolved Eden cost?",
        a: "Pricing depends on your path. Client plans start at $397/month (Founder), $1,497/month (Teams), and $5,000/month (Enterprise). Creator plans start at $297/month. Affiliates can start free. Each plan includes base intelligence features with optional add-ons. Use our Plan Builder on the pricing page to see your exact monthly cost.",
        tags: ["cost", "price", "pricing", "how much"],
      },
      {
        q: "Is there a free trial?",
        a: "We offer a full demo experience so you can see exactly how your intelligence system would work before committing. You can explore agents, swarms, and essence boards for any vertical. When you're ready, choose a plan and deploy.",
        tags: ["trial", "free", "demo"],
      },
      {
        q: "What add-ons are available?",
        a: "Add-ons include: Additional Intelligence ($195/mo), AI Twin Expansion ($200/mo), Additional Workflow ($75/mo), SDK/API Access ($150/mo), Premium Essence Board ($100/mo), Voice Systems ($250/mo), Additional Agent ($150/mo), Additional Swarm ($300/mo), Additional Memory ($100/mo), and White Label ($500/mo).",
        tags: ["addons", "add-ons", "extras"],
      },
      {
        q: "What is Business OS?",
        a: "Business OS is our enterprise-grade tier for organizations requiring dedicated deployment, multi-vertical orchestration, white-label capabilities, and full governance. It includes unlimited agents, swarms, memory, and a dedicated intelligence architect. Custom pricing — available when your blueprint score is 85+ or you need Enterprise scale.",
        tags: ["business os", "enterprise", "custom"],
      },
    ],
  },
  {
    id: "blueprint",
    label: "Blueprint Assessment",
    icon: "⊙",
    questions: [
      {
        q: "What is the Blueprint Assessment?",
        a: "The Blueprint is a 40+ question intelligence mapping layer that discovers your identity, patterns, constraints, and trajectory. It generates a Blueprint Score, identifies your Archetype (Visionary Architect, Ground Operator, etc.), recommends agents and swarms, and determines your optimal plan. It takes about 10 minutes and feeds directly into your AI Twin configuration.",
        tags: ["blueprint", "assessment", "what is"],
      },
      {
        q: "Is the Blueprint required?",
        a: "It's strongly recommended. The Blueprint ensures your intelligence system is configured for YOUR specific needs, not a generic template. Without it, you'll miss out on personalized agent recommendations, the correct plan tier, and your Archetype-based optimizations. You can skip to deployment intake if you already know what you need.",
        tags: ["required", "skip", "optional"],
      },
      {
        q: "What is an Archetype?",
        a: "Your Archetype is determined by the Blueprint based on your strongest dimension. Archetypes include: Visionary Architect (high identity), Ground Operator (high reality awareness), Future Navigator (high vision), Empire Builder (high business), System Weaver (high digital), and Sovereign Commander (high preferences). Each Archetype unlocks different optimizations in your intelligence system.",
        tags: ["archetype", "type", "personality"],
      },
      {
        q: "Can I retake the Blueprint?",
        a: "Yes, you can retake the Blueprint as many times as you want. Your results evolve as you do. Each completed assessment is saved to your profile and can be referenced from your dashboard.",
        tags: ["retake", "redo", "again"],
      },
    ],
  },
  {
    id: "account",
    label: "Account & Dashboard",
    icon: "◈",
    questions: [
      {
        q: "How do I get started?",
        a: "Explore a demo to see agents in action, take the Blueprint Assessment to map your intelligence needs, choose a plan that fits, and register to deploy. Your dashboard, AI Twin, agents, and Essence Board are ready immediately after registration.",
        tags: ["start", "getting started", "begin"],
      },
      {
        q: "What is the Essence Board?",
        a: "Your Essence Board is a daily intelligence brief — it shows today's top opportunities, risk flags, recommended actions, priority leads, and operational metrics. It's personalized by Zuri based on your agents' data and updated in real-time. Available on all plans.",
        tags: ["essence", "board", "dashboard", "daily"],
      },
      {
        q: "Can I access my system on mobile?",
        a: "Yes. The entire platform is responsive and works on any device. Your dashboard, agents, Essence Board, and vault are accessible from desktop, tablet, and mobile browsers.",
        tags: ["mobile", "app", "phone", "access"],
      },
      {
        q: "Is my data secure?",
        a: "Yes. Your data is encrypted at rest and in transit. Each intelligence instance is isolated. We use Supabase for auth and storage with Row Level Security ensuring you only see your own data. Enterprise customers get dedicated deployment with additional compliance controls.",
        tags: ["security", "secure", "data", "privacy", "encrypted"],
      },
    ],
  },
  {
    id: "deployment",
    label: "Deployment & Support",
    icon: "◆",
    questions: [
      {
        q: "How long does deployment take?",
        a: "Basic deployment (AI Twin + agents + Essence Board) is instant after registration — your system is provisioned automatically. Custom vertical builds, multi-agent swarms, and enterprise deployments typically take 1-3 business days depending on complexity.",
        tags: ["deploy", "deployment", "how long", "time"],
      },
      {
        q: "Do you offer onboarding support?",
        a: "Yes. Founder plans include self-guided onboarding with docs and walkthroughs. Team plans include guided onboarding. Enterprise plans include full training and a dedicated intelligence architect. All plans have in-app chat support.",
        tags: ["onboarding", "support", "training", "help"],
      },
      {
        q: "Can I integrate with my existing tools?",
        a: "Yes. We support calendar integration, email, CRM, social accounts, and financial account connections. SDK/API access is available as an add-on for custom integrations. Enterprise customers get custom development for proprietary systems.",
        tags: ["integrate", "integration", "api", "tools"],
      },
      {
        q: "What if I want to cancel?",
        a: "You can cancel anytime from your dashboard settings. Your intelligence system remains active until the end of your billing period. Your data is retained for 30 days after cancellation in case you want to reinstate. Enterprise contracts have terms specified in your agreement.",
        tags: ["cancel", "refund", "cancelation"],
      },
    ],
  },
]

export function searchFaq(query: string): FaqItem[] {
  const q = query.toLowerCase()
  const results: FaqItem[] = []
  for (const cat of FAQ_CATEGORIES) {
    for (const item of cat.questions) {
      const matchText = item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      const matchTags = item.tags?.some(t => t.toLowerCase().includes(q))
      if (matchText || matchTags) {
        results.push(item)
      }
    }
  }
  return results
}

export function getRelatedFaq(tags: string[]): FaqItem[] {
  const results: FaqItem[] = []
  const seen = new Set<string>()
  for (const cat of FAQ_CATEGORIES) {
    for (const item of cat.questions) {
      const hasTag = item.tags?.some(t => tags.includes(t))
      if (hasTag && !seen.has(item.q)) {
        results.push(item)
        seen.add(item.q)
      }
    }
  }
  return results
}
