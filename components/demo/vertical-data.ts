// ── Vertical-Specific Intelligence Data ──
// Each vertical has: agents, swarm, essence board preview, walkthrough, brand colors

export type Agent = {
  id: string
  name: string
  tagline: string
  description: string
  icon: string
  capabilities: string[]
}

export type VerticalData = {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  color: string
  gradient: string
  emoji: string
  agents: Agent[]
  swarm: {
    name: string
    description: string
    agents: string[]
  }
  essenceBoard: {
    title: string
    items: string[]
  }
  walkthrough: string
  defaultPlan: string
}

export const VERTICALS: Record<string, VerticalData> = {
  med_spa: {
    id: 'med_spa',
    slug: 'med-spa',
    title: 'Luxury Med Spa',
    tagline: 'Intelligence for aesthetics, wellness & client care',
    description: 'Full-spectrum intelligence system for med spas, aesthetic clinics, and wellness practices — from booking to retention.',
    color: '#C6A664',
    gradient: 'from-pink-500/20 to-rose-600/10',
    emoji: '✦',
    agents: [
      {
        id: 'client_concierge',
        name: 'Client Concierge',
        tagline: 'Your front desk never sleeps',
        description: 'Handles bookings, rescheduling, cancellations, and automated follow-ups. Syncs with your calendar and sends smart reminders.',
        icon: '✦',
        capabilities: ['Smart booking management', 'Automated follow-ups', 'Calendar sync', 'Waitlist optimization'],
      },
      {
        id: 'treatment_intelligence',
        name: 'Treatment Intelligence Engine',
        tagline: 'Recommendations that convert',
        description: 'Analyzes client history, preferences, and purchase patterns to recommend the right treatments and products.',
        icon: '◎',
        capabilities: ['Personalized treatment matching', 'Cross-sell optimization', 'Seasonal trend analysis', 'Product recommendations'],
      },
      {
        id: 'retention_sentinel',
        name: 'Retention Sentinel',
        tagline: 'Never lose a client again',
        description: 'Monitors engagement patterns, flags at-risk clients before they churn, and triggers re-engagement campaigns automatically.',
        icon: '◈',
        capabilities: ['Churn prediction', 'Re-engagement automation', 'Loyalty program mgmt', 'Satisfaction tracking'],
      },
      {
        id: 'marketing_intelligence',
        name: 'Marketing Intelligence Agent',
        tagline: 'Campaigns that actually work',
        description: 'Optimizes ad spend, tracks ROI, and generates campaign recommendations based on real-time client data.',
        icon: '▣',
        capabilities: ['Campaign optimization', 'ROI tracking', 'Audience segmentation', 'Content generation'],
      },
      {
        id: 'operations_orchestrator',
        name: 'Operations Orchestrator',
        tagline: 'Everything runs itself',
        description: 'Coordinates staff schedules, inventory, supply orders, and daily workflows so you focus on clients, not logistics.',
        icon: '◇',
        capabilities: ['Staff scheduling', 'Inventory management', 'Supply chain automation', 'Daily ops dashboard'],
      },
    ],
    swarm: {
      name: 'Med Spa Operations Swarm',
      description: 'Five agents collaborating to run your entire practice — from first booking to long-term retention. The swarm communicates in real-time, shares context, and executes multi-step workflows without human intervention.',
      agents: ['Client Concierge', 'Treatment Intelligence Engine', 'Retention Sentinel', 'Marketing Intelligence Agent', 'Operations Orchestrator'],
    },
    essenceBoard: {
      title: 'Daily Med Spa Essence Board',
      items: [
        "Today's top opportunity — highest-value booking slot",
        'Risk flags — clients showing low engagement',
        'Supply alerts — low inventory items needing reorder',
        'Revenue snapshot — daily, weekly, monthly trends',
        'Recommended actions — Zuri\'s priority for your day',
      ],
    },
    walkthrough: 'Your Med Spa Intelligence includes five specialized agents working as one unified system.\n\nThe Client Concierge handles every booking, reschedule, and follow-up automatically. Your Treatment Intelligence Engine studies each client\'s history to recommend exactly what they need next. The Retention Sentinel watches for disengagement signals and triggers re-engagement before they leave. Your Marketing Intelligence Agent optimizes every campaign based on real client data. And the Operations Orchestrator keeps your staff schedules, inventory, and daily workflows running smoothly.\n\nThese five agents collaborate inside the Med Spa Operations Swarm — sharing context, coordinating actions, and executing complex workflows without you lifting a finger.\n\nYour daily Essence Board gives you a one-glance command center: top opportunity, risk flags, supply alerts, revenue snapshot, and Zuri\'s recommended action for the day.\n\nEverything is accessible from your dashboard. Your AI Twin reflects your practice in real-time. Your Vault stores every client record securely.\n\nThis is what an intelligence system looks like when it\'s built for your world.',
    defaultPlan: 'client_founder',
  },

  hotel: {
    id: 'hotel',
    slug: 'hotel',
    title: 'Luxury Hotel',
    tagline: 'Intelligence for hospitality & guest experience',
    description: 'End-to-end intelligence for boutique hotels, luxury resorts, and hospitality groups — from booking to unforgettable stays.',
    color: '#5E8B84',
    gradient: 'from-cyan-500/20 to-blue-600/10',
    emoji: '◆',
    agents: [
      {
        id: 'guest_experience',
        name: 'Guest Experience AI',
        tagline: 'Every stay is personal',
        description: 'Personalizes every guest interaction from pre-arrival preferences to post-stay follow-ups. Learns guest preferences across visits.',
        icon: '◆',
        capabilities: ['Preference learning', 'Personalized welcome', 'Stay history tracking', 'Post-stay engagement'],
      },
      {
        id: 'concierge_ai',
        name: 'Concierge Intelligence',
        tagline: 'Your 24/7 luxury concierge',
        description: 'Handles guest requests, restaurant recommendations, spa bookings, room service, and local experiences — all in natural conversation.',
        icon: '◎',
        capabilities: ['Natural language requests', 'Local recommendations', 'Service booking', 'Multi-language support'],
      },
      {
        id: 'revenue_optimizer',
        name: 'Revenue Optimizer',
        tagline: 'Maximize every room',
        description: 'Dynamic pricing engine that adjusts rates based on demand, seasonality, events, and booking patterns in real-time.',
        icon: '◈',
        capabilities: ['Dynamic pricing', 'Demand forecasting', 'Yield management', 'Package optimization'],
      },
      {
        id: 'operations_sentinel',
        name: 'Operations Sentinel',
        tagline: 'Everything behind the scenes',
        description: 'Monitors housekeeping, maintenance, F&B, and front desk operations. Flags issues before guests notice them.',
        icon: '▣',
        capabilities: ['Housekeeping coordination', 'Maintenance alerts', 'F&B inventory tracking', 'Front desk oversight'],
      },
      {
        id: 'guest_insights',
        name: 'Guest Insights Engine',
        tagline: 'Know your guests deeply',
        description: 'Aggregates guest feedback, reviews, and behavior data to surface actionable insights for service improvement.',
        icon: '◇',
        capabilities: ['Sentiment analysis', 'Review aggregation', 'Service improvement recs', 'Loyalty optimization'],
      },
    ],
    swarm: {
      name: 'Hotel Operations Swarm',
      description: 'Five agents working 24/7 to deliver luxury hospitality. The swarm coordinates guest experiences, revenue optimization, operations, and insights — creating a seamless stay for every guest.',
      agents: ['Guest Experience AI', 'Concierge Intelligence', 'Revenue Optimizer', 'Operations Sentinel', 'Guest Insights Engine'],
    },
    essenceBoard: {
      title: 'Daily Hotel Essence Board',
      items: [
        'VIP arrivals today — names, preferences, special requests',
        'Revenue opportunities — rooms to upsell, packages to offer',
        'Operational flags — maintenance, staffing, supply issues',
        'Guest sentiment — recent reviews, satisfaction trends',
        'Priority actions — Zuri\'s recommended focus for the day',
      ],
    },
    walkthrough: 'Your Hotel Intelligence brings together five specialized agents delivering a luxury hospitality operating system.\n\nThe Guest Experience AI personalizes every stay, learning preferences and anticipating needs. Your Concierge Intelligence handles every guest request in natural conversation — from dinner reservations to spa bookings. The Revenue Optimizer adjusts pricing dynamically to maximize every room. Your Operations Sentinel monitors housekeeping, maintenance, and front desk, flagging issues before guests notice. And the Guest Insights Engine aggregates feedback to continuously improve service.\n\nThese form the Hotel Operations Swarm — a 24/7 intelligence layer that runs your property seamlessly.\n\nYour daily Essence Board gives you: VIP arrivals, revenue opportunities, operational flags, guest sentiment, and Zuri\'s priority actions.\n\nYour AI Twin reflects your property in real-time. Your dashboard gives you full command of every guest journey.',
    defaultPlan: 'client_founder',
  },

  real_estate: {
    id: 'real_estate',
    slug: 'real-estate',
    title: 'Luxury Real Estate',
    tagline: 'Intelligence for properties, leads & deals',
    description: 'Complete intelligence system for real estate agents, brokerages, and property developers — from lead to closing.',
    color: '#8B7AA8',
    gradient: 'from-purple-500/20 to-violet-600/10',
    emoji: '◇',
    agents: [
      {
        id: 'lead_nurture',
        name: 'Lead Nurture Agent',
        tagline: 'Cold leads become hot prospects',
        description: 'Automatically follows up with leads, qualifies interest, schedules showings, and keeps your pipeline warm 24/7.',
        icon: '◇',
        capabilities: ['Automated follow-ups', 'Lead qualification', 'Showing scheduling', 'Pipeline warming'],
      },
      {
        id: 'property_match',
        name: 'Property Match Intelligence',
        tagline: 'The perfect property finds them',
        description: 'Pairs buyers with their ideal properties using preference analysis, behavioral data, and market intelligence.',
        icon: '◎',
        capabilities: ['Preference matching', 'Behavioral analysis', 'Neighborhood insights', 'Comparative market analysis'],
      },
      {
        id: 'market_intelligence',
        name: 'Market Intelligence Engine',
        tagline: 'Know the market before everyone else',
        description: 'Tracks neighborhood trends, pricing shifts, days-on-market, and emerging opportunities in real-time.',
        icon: '◈',
        capabilities: ['Trend tracking', 'Pricing analysis', 'Opportunity detection', 'Competitive intelligence'],
      },
      {
        id: 'transaction_coordinator',
        name: 'Transaction Coordinator',
        tagline: 'Deals close on autopilot',
        description: 'Handles paperwork, deadlines, escrow coordination, and compliance — so no deal falls through the cracks.',
        icon: '▣',
        capabilities: ['Document automation', 'Deadline tracking', 'Escrow coordination', 'Compliance checks'],
      },
      {
        id: 'client_relations',
        name: 'Client Relations Agent',
        tagline: 'Relationships that last beyond closing',
        description: 'Manages client communication, referrals, reviews, and long-touch nurture campaigns for repeat and referral business.',
        icon: '✦',
        capabilities: ['Communication automation', 'Referral generation', 'Review management', 'Long-touch nurture'],
      },
    ],
    swarm: {
      name: 'Real Estate Client Acquisition Swarm',
      description: 'Five agents collaborating to manage your entire real estate pipeline — from first lead to closed deal and beyond. The swarm keeps every prospect warm, every deal moving, and every client delighted.',
      agents: ['Lead Nurture Agent', 'Property Match Intelligence', 'Market Intelligence Engine', 'Transaction Coordinator', 'Client Relations Agent'],
    },
    essenceBoard: {
      title: 'Daily Real Estate Essence Board',
      items: [
        'Hot leads — prospects ready to buy or sell today',
        'Market shifts — price changes, new listings, trends',
        'Deal pipeline — stages, blockers, priority actions',
        'Client touchpoints — who needs follow-up today',
        'Zuri\'s focus — the one action that moves the needle',
      ],
    },
    walkthrough: 'Your Real Estate Intelligence deploys five specialized agents working as one client acquisition system.\n\nThe Lead Nurture Agent follows up with every prospect automatically, warming cold leads and scheduling showings. Your Property Match Intelligence pairs buyers with their ideal properties using deep preference analysis. The Market Intelligence Engine tracks neighborhood trends, pricing shifts, and emerging opportunities. Your Transaction Coordinator handles paperwork, deadlines, and escrow coordination automatically. And the Client Relations Agent keeps every past client engaged for referrals and repeat business.\n\nThese five collaborate inside the Real Estate Client Acquisition Swarm — managing your entire pipeline from first touch to closed deal.\n\nYour daily Essence Board shows: hot leads, market shifts, deal pipeline status, client touchpoints, and Zuri\'s recommended focus.\n\nYour AI Twin represents your brand. Your dashboard gives you a complete view of your portfolio and pipeline.',
    defaultPlan: 'client_founder',
  },

  hr: {
    id: 'hr',
    slug: 'hr',
    title: 'Corporate HR',
    tagline: 'Intelligence for people operations & talent',
    description: 'Enterprise-grade intelligence for HR departments, talent teams, and people operations — from hiring to retention.',
    color: '#B5764A',
    gradient: 'from-orange-500/20 to-amber-600/10',
    emoji: '▤',
    agents: [
      {
        id: 'talent_acquisition',
        name: 'Talent Acquisition Agent',
        tagline: 'Hire the best, faster',
        description: 'Screens candidates, schedules interviews, ranks applicants, and manages the entire hiring pipeline with intelligent automation.',
        icon: '▤',
        capabilities: ['Candidate screening', 'Interview scheduling', 'Applicant ranking', 'Pipeline management'],
      },
      {
        id: 'onboarding_automator',
        name: 'Onboarding Automator',
        tagline: 'Day one starts before day one',
        description: 'Handles paperwork, equipment setup, training plans, and compliance docs so every new hire is productive from day one.',
        icon: '◎',
        capabilities: ['Paperwork automation', 'Equipment provisioning', 'Training plan generation', 'Compliance tracking'],
      },
      {
        id: 'employee_intelligence',
        name: 'Employee Intelligence Engine',
        tagline: 'Know your people deeply',
        description: 'Tracks engagement, performance, satisfaction, and growth patterns to surface insights that reduce turnover and boost productivity.',
        icon: '◈',
        capabilities: ['Engagement tracking', 'Performance analytics', 'Satisfaction monitoring', 'Growth path mapping'],
      },
      {
        id: 'compliance_sentinel',
        name: 'Compliance Sentinel',
        tagline: 'Audit-ready always',
        description: 'Monitors regulatory requirements, certification expirations, policy updates, and generates compliance reports automatically.',
        icon: '▣',
        capabilities: ['Regulatory monitoring', 'Certification tracking', 'Policy management', 'Audit reporting'],
      },
      {
        id: 'workforce_planner',
        name: 'Workforce Planner',
        tagline: 'Right people, right time',
        description: 'Analyzes headcount needs, skill gaps, and staffing forecasts to recommend hiring, training, and restructuring decisions.',
        icon: '◇',
        capabilities: ['Headcount analysis', 'Skill gap mapping', 'Staffing forecasts', 'Organizational planning'],
      },
    ],
    swarm: {
      name: 'Workforce Intelligence Swarm',
      description: 'Five agents powering your entire people operations — from attracting talent to retaining and developing your workforce. The swarm ensures no hire falls through, no compliance gap forms, and no employee goes unsupported.',
      agents: ['Talent Acquisition Agent', 'Onboarding Automator', 'Employee Intelligence Engine', 'Compliance Sentinel', 'Workforce Planner'],
    },
    essenceBoard: {
      title: 'Daily HR Essence Board',
      items: [
        'Hiring priorities — open roles, candidates, pipeline status',
        'Engagement flags — teams or individuals needing attention',
        'Compliance deadlines — upcoming certifications, audits',
        'Workforce metrics — headcount, turnover, growth trends',
        'Zuri\'s focus — priority action for people operations',
      ],
    },
    walkthrough: 'Your HR Intelligence deploys five specialized agents as one unified workforce system.\n\nThe Talent Acquisition Agent screens candidates and manages your entire hiring pipeline. The Onboarding Automator ensures every new hire is productive from day one. Your Employee Intelligence Engine tracks engagement, performance, and satisfaction to reduce turnover. The Compliance Sentinel keeps your organization audit-ready at all times. And the Workforce Planner analyzes headcount needs and skill gaps to guide strategic decisions.\n\nThese five collaborate inside the Workforce Intelligence Swarm — powering your entire people operations from hire to retire.\n\nYour daily Essence Board shows: hiring priorities, engagement flags, compliance deadlines, workforce metrics, and Zuri\'s recommended focus.\n\nYour AI Twin reflects your organizational health. Your dashboard gives you a complete people intelligence view.',
    defaultPlan: 'client_founder', // Business Essintelligence -- HR is an org use case, not an unknown-fallback case
  },

  legal: {
    id: 'legal',
    slug: 'legal',
    title: 'Legal Practice',
    tagline: 'Intelligence for law firms & legal teams',
    description: 'Complete practice intelligence for attorneys, law firms, and legal departments — from intake to billing.',
    color: '#5E8B84',
    gradient: 'from-emerald-500/20 to-teal-600/10',
    emoji: '⊙',
    agents: [
      {
        id: 'client_intake',
        name: 'Client Intake Agent',
        tagline: 'Qualify leads instantly',
        description: 'Screens potential clients, qualifies cases, schedules consultations, and collects initial information before the first meeting.',
        icon: '⊙',
        capabilities: ['Case qualification', 'Conflict checking', 'Consultation scheduling', 'Initial data collection'],
      },
      {
        id: 'document_intelligence',
        name: 'Document Intelligence Engine',
        tagline: 'Draft, review, file — automatically',
        description: 'Drafts standard documents, reviews contracts for risk, organizes filings, and maintains a searchable knowledge base.',
        icon: '◎',
        capabilities: ['Document drafting', 'Contract review', 'Filing organization', 'Knowledge management'],
      },
      {
        id: 'case_coordinator',
        name: 'Case Management Coordinator',
        tagline: 'Every deadline met',
        description: 'Tracks court dates, filing deadlines, task assignments, and case milestones across every active matter.',
        icon: '◈',
        capabilities: ['Deadline tracking', 'Task coordination', 'Milestone monitoring', 'Calendar management'],
      },
      {
        id: 'billing_automation',
        name: 'Billing Automation Agent',
        tagline: 'Time tracked, invoices sent',
        description: 'Tracks billable hours, generates invoices, manages trust accounts, and follows up on outstanding payments automatically.',
        icon: '▣',
        capabilities: ['Time tracking', 'Invoice generation', 'Trust accounting', 'Payment follow-up'],
      },
      {
        id: 'research_associate',
        name: 'Research Associate',
        tagline: 'Find precedent in seconds',
        description: 'Searches case law, statutes, and legal databases. Surfaces relevant precedents and summarizes findings for your review.',
        icon: '◇',
        capabilities: ['Legal research', 'Precedent analysis', 'Statute lookup', 'Case summarization'],
      },
    ],
    swarm: {
      name: 'Legal Practice Operations Swarm',
      description: 'Five agents collaborating to run your entire practice — from first client contact to final billing. The swarm manages cases, deadlines, documents, and research so you focus on practicing law.',
      agents: ['Client Intake Agent', 'Document Intelligence Engine', 'Case Management Coordinator', 'Billing Automation Agent', 'Research Associate'],
    },
    essenceBoard: {
      title: 'Daily Legal Essence Board',
      items: [
        'Case priorities — urgent matters and approaching deadlines',
        'Deadline alerts — court dates, filing deadlines today',
        'Billing opportunities — unbilled time, outstanding invoices',
        'Research briefs — relevant case law and statute updates',
        'Zuri\'s focus — the action that protects your practice',
      ],
    },
    walkthrough: 'Your Legal Intelligence deploys five specialized agents as one unified practice system.\n\nThe Client Intake Agent screens and qualifies leads before your first consultation. Your Document Intelligence Engine drafts, reviews, and organizes every filing. The Case Management Coordinator tracks every deadline and case milestone. Your Billing Automation Agent captures every billable hour and follows up on payments. And the Research Associate surfaces relevant case law and precedents in seconds.\n\nThese five collaborate inside the Legal Practice Operations Swarm — running your entire firm so you focus on practicing law.\n\nYour daily Essence Board shows: case priorities, deadline alerts, billing opportunities, research briefs, and Zuri\'s recommended focus.\n\nYour AI Twin reflects your practice. Your dashboard gives you complete command of every matter.',
    defaultPlan: 'client_founder',
  },
}

export const VERTICAL_LIST = Object.values(VERTICALS)

export function getVerticalBySlug(slug: string): VerticalData | undefined {
  return VERTICAL_LIST.find(v => v.slug === slug)
}

// ── Concrete Pricing (aligned with catalog_items & lib/pricing.ts) ──
// Prices in dollars (display), mirror catalog_items.base_price.
// Tier keys match the {path}_{plan} convention for backend lookup.
export const BASE_PLANS = {
  client: {
    founder:   { name: 'Founder',    price: 497,  period: '/month', tagline: 'Personal Intelligence System' },
    groups:    { name: 'Groups',     price: 2500, period: '/month', tagline: 'Collaborative Intelligence', popular: true },
    enterprise:{ name: 'Enterprise', price: 5000, period: '/month', tagline: 'Organizational OS' },
  },
  creator: {
    studio:    { name: 'Studio',     price: 49,   period: '/month', tagline: 'Creator Operating System' },
    premium:   { name: 'Premium',    price: 297,  period: '/month', tagline: 'Creator Business System', popular: true },
    concierge: { name: 'Concierge',  price: 4000, period: '/month', tagline: 'Luxury Creator System' },
  },
  personal: {
    solo:      { name: 'Solo',       price: 49,   period: '/month', tagline: 'Personal Layer' },
    partner:   { name: 'Partner',    price: 79,   period: '/month', tagline: 'Personal Intelligence Plus', popular: true },
    family:    { name: 'Family',     price: 99,   period: '/month', tagline: 'Personal Intelligence Premium' },
  },
  affiliate: {
    annual:    { name: 'Annual',     price: 97,   period: '/month', tagline: 'Affiliate OS Starter' },
    plug:      { name: 'Plug',       price: 149,  period: '/month', tagline: 'Affiliate OS Professional', popular: true },
  },
} as const

export const ADDONS = [
  { id: 'voice',                name: 'Voice',                      price: 250, period: '/mo', desc: 'Voice-based AI interaction' },
  { id: 'sdk_api_access',       name: 'SDK/API Access',             price: 150, period: '/mo', desc: 'Programmatic access to intelligence layer' },
  { id: 'white_label',          name: 'White Label',                price: 499, period: '/mo', desc: 'Full white-label rebranding' },
  { id: 'premium_essenceboard', name: 'Premium EssenceBoard',       price: 100, period: '/mo', desc: 'Enhanced daily intelligence briefs' },
  { id: 'team_essence',         name: 'Team Essence',               price: 150, period: '/mo', desc: 'Team-wide intelligence sharing' },
  { id: 'usb_export',           name: 'USB Export',                 price: 150, period: '/mo', desc: 'Export intelligence to USB' },
  { id: 'custom_domain',        name: 'Custom Domain',              price: 9,   period: '/mo', desc: 'Bring your own domain' },
  { id: 'custom_subdomain',     name: 'Custom Subdomain',           price: 5,   period: '/mo', desc: 'Custom subdomain URL' },
  { id: 'premium_branding',     name: 'Premium Branding',           price: 99,  period: '/mo', desc: 'Premium brand customization' },
  { id: 'additional_ai_twin',   name: 'Additional AI Twin',         price: 195, period: '/mo', desc: 'Add another AI twin instance' },
  { id: 'plus_50gb_storage',    name: '+50GB Storage',              price: 100, period: '/mo', desc: 'Extra storage capacity' },
  { id: 'plus_500_workflow_runs', name: '+500 Workflow Runs',       price: 99,  period: '/mo', desc: 'Additional workflow runs' },
  { id: 'plus_1000_api_calls',  name: '+1000 API Calls',            price: 99,  period: '/mo', desc: 'Additional API calls' },
  { id: 'additional_member',    name: 'Additional Member',          price: 499, period: '/mo', desc: 'Add a team member' },
  { id: 'additional_location',  name: 'Additional Location',        price: 49,  period: '/mo', desc: 'Add another physical location' },
  // Legacy aliases (map to same Stripe products)
  { id: 'additional_intelligence', name: 'Additional Intelligence', price: 195, period: '/mo', desc: 'Add another intelligence instance' },
  { id: 'additional_agent',       name: 'Additional Agent',         price: 150, period: '/mo', desc: 'Deploy a new specialized agent' },
  { id: 'additional_swarm',       name: 'Additional Swarm',         price: 300, period: '/mo', desc: 'Orchestrate a new agent swarm' },
  { id: 'additional_workflow',    name: 'Additional Workflow',      price: 75,  period: '/mo', desc: 'Add deployable customer workflows' },
  { id: 'additional_memory',      name: 'Additional Memory (50GB)', price: 100, period: '/mo', desc: 'Expand memory capacity' },
  { id: 'premium_essence',        name: 'Premium Essence Board',    price: 100, period: '/mo', desc: 'Enhanced daily intelligence briefs' },
  { id: 'sdk_api',                name: 'SDK/API Access',           price: 150, period: '/mo', desc: 'Programmatic access to the intelligence layer' },
  { id: 'white_label_addon',      name: 'White Label',              price: 499, period: '/mo', desc: 'Rebrand the platform as your own' },
  { id: 'voice_systems',          name: 'Voice Systems',            price: 250, period: '/mo', desc: 'Voice-based interaction with your intelligence' },
] as const

export type PlanKey = keyof typeof BASE_PLANS.client | keyof typeof BASE_PLANS.creator | keyof typeof BASE_PLANS.personal | keyof typeof BASE_PLANS.affiliate
export type PathType = 'client' | 'creator' | 'personal' | 'affiliate'
