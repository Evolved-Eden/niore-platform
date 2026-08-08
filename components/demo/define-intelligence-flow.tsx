'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BASE_PLANS, ADDONS, type PathType as PlanPathType } from './specialty-data'

type PathType = 'client' | 'creator' | 'personal' | 'affiliate' | null

type Step =
  | 'welcome'
  | 'scope-intro'
  | 'path-select'
  | 'personal-info'
  | 'questions'
  | 'analysis'
  | 'plan-detail'

// ── Client Path Questions ──
const CLIENT_QUESTIONS = [
  {
    id: 'business_type',
    label: 'Which best describes your business?',
    options: [
      'Service business', 'Agency', 'Real estate', 'E-commerce',
      'Local business', 'Healthcare', 'Consulting', 'Legal',
      'Coaching', 'Startup', 'Other',
    ],
  },
  {
    id: 'improve_most',
    label: 'What are you trying to improve most right now?',
    options: [
      'More customers', 'Better systems', 'More revenue', 'Better team operations',
      'Better organization', 'Time freedom', 'Better client experience', 'Better decision making',
    ],
  },
  {
    id: 'hardest',
    label: 'Which currently feels hardest?',
    options: [
      'Getting leads', 'Following up', 'Sales', 'Team communication',
      'Content', 'Operations', 'Time management', 'Organization',
    ],
  },
  {
    id: 'archetype',
    label: 'Which sounds most like you?',
    options: [
      'I do everything myself',
      'I have a small team',
      'I have an established business',
      "I'm building something larger",
    ],
  },
  {
    id: 'biggest_win',
    label: 'Which would feel like the biggest win?',
    options: [
      'Save time', 'Make more money', 'Automate repetitive work', 'Grow faster', 'Reduce stress',
    ],
  },
  {
    id: 'ai_involvement',
    label: 'How involved do you want AI to be?',
    options: [
      'Minimal support', 'Balanced assistance', 'Heavy automation', 'Full intelligence partner',
    ],
  },
  {
    id: 'experience',
    label: 'Which experience feels right?',
    options: [
      'Professional', 'Luxury', 'High energy', 'Strategic', 'Warm', 'Premium concierge',
    ],
  },
  {
    id: 'most_true',
    label: 'Pick the statement that feels most true:',
    options: [
      'I need structure', 'I need growth', 'I need organization',
      'I need support', 'I need execution', 'I need scale',
    ],
  },
]

const CREATOR_QUESTIONS = [
  {
    id: 'creator_type',
    label: 'What type of creator are you?',
    options: [
      'Lifestyle', 'Business', 'Beauty', 'Education', 'Gaming',
      'Entertainment', 'Wellness', 'Finance', 'Personal brand', 'Other',
    ],
  },
  {
    id: 'biggest_goal',
    label: 'Your biggest goal right now:',
    options: [
      'More followers', 'More revenue', 'Better content', 'Better consistency',
      'Better brand', 'Better community', 'More partnerships',
    ],
  },
  {
    id: 'hardest_creator',
    label: "What's hardest right now?",
    options: [
      'Content ideas', 'Editing', 'Posting consistently', 'Monetization',
      'Community building', 'Burnout', 'Time management',
    ],
  },
  {
    id: 'creator_stage',
    label: 'Which feels closest to your situation?',
    options: [
      'Just starting', 'Growing audience', 'Established creator', 'Building a media business',
    ],
  },
  {
    id: 'excite_most',
    label: 'Which would excite you most?',
    options: [
      'Content made easier', 'Better growth', 'Brand deals',
      'Multiple income streams', 'Community building',
    ],
  },
  {
    id: 'ai_help',
    label: 'How much AI help do you want?',
    options: [
      'Small assistance', 'Moderate assistance', 'Heavy support', 'Full creator ecosystem',
    ],
  },
  {
    id: 'content_vibe',
    label: 'Your content vibe:',
    options: [
      'Luxury', 'Educational', 'Energetic', 'Personal', 'Motivational', 'Spiritual', 'Fun',
    ],
  },
  {
    id: 'most_true_creator',
    label: 'Which feels most true?',
    options: [
      'I need visibility', 'I need systems', 'I need consistency',
      'I need strategy', 'I need execution', 'I need monetization',
    ],
  },
]

const PERSONAL_QUESTIONS = [
  {
    id: 'personal_area',
    label: 'What area matters most to you?',
    options: [
      'Self improvement', 'Family & relationships', 'Side projects',
      'Health & wellness', 'Creative work', 'Learning',
    ],
  },
  {
    id: 'personal_goal',
    label: 'Biggest goal:',
    options: [
      'Simplify my life', 'Grow my potential', 'Connect my world', 'Build something meaningful',
    ],
  },
  {
    id: 'personal_challenge',
    label: 'Biggest challenge:',
    options: [
      'Time management', 'Focus & consistency', 'Organization', 'Motivation', 'Connection',
    ],
  },
  {
    id: 'personal_tech',
    label: 'Your AI comfort level:',
    options: [
      'Just starting', 'Some experience', 'Very comfortable',
    ],
  },
  {
    id: 'personal_usage',
    label: 'How do you want to use it?',
    options: [
      'Daily assistant', 'Weekly check-ins', 'Project support',
    ],
  },
  {
    id: 'personal_devices',
    label: 'What devices do you use?',
    options: [
      'Phone only', 'Laptop/desktop', 'All of the above',
    ],
  },
  {
    id: 'personal_style',
    label: 'Preferred style:',
    options: [
      'Minimalist', 'Feature-rich', 'Guided experience', 'Community driven',
    ],
  },
  {
    id: 'personal_most_true',
    label: 'Most true:',
    options: [
      'I need simplicity', 'I need systems', 'I need growth', 'I need connection',
    ],
  },
]

const AFFILIATE_QUESTIONS = [
  {
    id: 'affiliate_area',
    label: 'Which affiliate area interests you?',
    options: [
      'Tech', 'Beauty', 'Lifestyle', 'Business', 'Finance',
      'Education', 'Health', 'Digital products',
    ],
  },
  {
    id: 'biggest_goal_aff',
    label: 'Biggest goal:',
    options: [
      'Passive income', 'Audience growth', 'Better conversions', 'More traffic', 'More offers',
    ],
  },
  {
    id: 'biggest_challenge',
    label: 'Biggest challenge:',
    options: [
      'Traffic', 'Audience', 'Conversions', 'Content', 'Consistency',
    ],
  },
  {
    id: 'current_level',
    label: 'Current level:',
    options: [
      'Beginner', 'Growing', 'Experienced',
    ],
  },
  {
    id: 'sounds_best',
    label: 'Which sounds best?',
    options: [
      'Simple side income', 'Full business system', 'Long-term brand',
    ],
  },
  {
    id: 'ai_involvement_aff',
    label: 'AI involvement:',
    options: [
      'Minimal', 'Moderate', 'Heavy', 'Full partner',
    ],
  },
  {
    id: 'style_aff',
    label: 'Preferred style:',
    options: [
      'Professional', 'Luxury', 'High energy', 'Community driven',
    ],
  },
  {
    id: 'most_true_aff',
    label: 'Most true:',
    options: [
      'I need traffic', 'I need systems', 'I need offers', 'I need growth',
    ],
  },
]

type AnalysisResult = {
  optionA: { name: string; description: string; includes: string[] }
  optionB: { name: string; description: string; includes: string[] }
  recommendation: 'A' | 'B'
  reasoning: string
}

function analyzeClient(answers: Record<string, string>): AnalysisResult {
  const archetype = answers.archetype || ''
  const aiInv = answers.ai_involvement || ''
  const mostTrue = answers.most_true || ''
  const hardest = answers.hardest || ''
  const win = answers.biggest_win || ''

  const soloMode = archetype.includes('myself')
  const needSupport = ['I need structure', 'I need organization', 'I need support'].includes(mostTrue)
  const heavyOps = hardest === 'Operations' || hardest === 'Time management'
  const growthMode = ['I need growth', 'I need scale', 'I need execution'].includes(mostTrue)
  const deepAI = aiInv === 'Full intelligence partner' || aiInv === 'Heavy automation'
  const winGrowth = win === 'Grow faster' || win === 'Make more money'

  const scoreB = (growthMode ? 2 : 0) + (deepAI ? 2 : 0) + (winGrowth ? 1 : 0) + (archetype.includes('team') || archetype.includes('established') || archetype.includes('larger') ? 2 : 0)
  const scoreA = (soloMode ? 2 : 0) + (needSupport ? 2 : 0) + (heavyOps ? 1 : 0) + (aiInv === 'Minimal support' || aiInv === 'Balanced assistance' ? 1 : 0)

  return {
    optionA: { name: 'Founder Intelligence', description: 'A focused intelligence system for solo operators and independent professionals.', includes: ['Zuri', 'Front Desk', 'Business Concierge', 'Core Automations'] },
    optionB: { name: 'Business Intelligence OS', description: 'A complete operating system for businesses ready to scale with AI orchestration.', includes: ['Zuri', 'AI Twin', 'Concierge', 'Executive Swarms', 'Growth Systems'] },
    recommendation: scoreB >= scoreA ? 'B' : 'A',
    reasoning: scoreB >= scoreA
      ? `You're thinking about growth at scale. Your answers suggest you're ready for deeper AI integration across your business operations — from executive-level swarm orchestration to a full AI Twin.`
      : `Your answers point to a need for structure and support right now. You want intelligence that makes your day-to-day smoother without overcomplicating things.`,
  }
}

function analyzeCreator(answers: Record<string, string>): AnalysisResult {
  const stage = answers.creator_stage || ''
  const aiHelp = answers.ai_help || ''
  const mostTrue = answers.most_true_creator || ''
  const goal = answers.biggest_goal || ''
  const hardest = answers.hardest_creator || ''

  const scoreA = ((stage === 'Just starting') ? 2 : 0) + ((stage === 'Growing audience') ? 1 : 0) + ((aiHelp === 'Small assistance' || aiHelp === 'Moderate assistance') ? 2 : 0) + ((mostTrue === 'I need visibility' || mostTrue === 'I need consistency') ? 1 : 0)
  const scoreB = ((stage === 'Established creator') ? 2 : 0) + ((stage === 'Building a media business') ? 3 : 0) + ((aiHelp === 'Full creator ecosystem') ? 2 : 0) + ((aiHelp === 'Heavy support') ? 1 : 0) + ((mostTrue === 'I need monetization' || goal === 'More revenue') ? 1 : 0) + ((mostTrue === 'I need systems' || hardest === 'Monetization' || hardest === 'Community building') ? 1 : 0)

  return {
    optionA: { name: 'Creator Growth System', description: 'Essential creator intelligence to grow your audience and streamline content.', includes: ['Zuri', 'Social Media Goddess', 'Content Planner', 'Growth Dashboard'] },
    optionB: { name: 'Creator Empire OS', description: 'A full creator business operating system with AI Twin, monetization, and swarms.', includes: ['Zuri', 'AI Twin', 'Elite Creator Coach', 'Monetization Systems', 'Creator Swarms'] },
    recommendation: scoreB >= scoreA ? 'B' : 'A',
    reasoning: scoreB >= scoreA
      ? `You're ready to build a media business. Your answers show ambition for monetization, systems, and deeper AI integration.`
      : `You're focused on growth and consistency right now. Building audience and content rhythm is your priority.`,
  }
}

function analyzePersonal(answers: Record<string, string>): AnalysisResult {
  const tech = answers.personal_tech || ''
  const usage = answers.personal_usage || ''
  const mostTrue = answers.personal_most_true || ''
  const goal = answers.personal_goal || ''
  const area = answers.personal_area || ''

  const scoreA = ((tech === 'Just starting' || tech === 'Some experience') ? 2 : 0) + ((usage === 'Weekly check-ins') ? 1 : 0) + ((mostTrue === 'I need simplicity') ? 2 : 0) + ((goal === 'Simplify my life') ? 1 : 0)
  const scoreB = ((tech === 'Very comfortable') ? 2 : 0) + ((usage === 'Daily assistant') ? 2 : 0) + ((goal === 'Grow my potential' || goal === 'Build something meaningful') ? 2 : 0) + ((mostTrue === 'I need growth' || mostTrue === 'I need connection') ? 1 : 0)

  return {
    optionA: { name: 'Personal Starter', description: 'A simple system to organize your personal world.', includes: ['Zuri', 'Personal Agent', 'Daily Brief'] },
    optionB: { name: 'Personal Intelligence OS', description: 'A full personal intelligence system with AI Twin and daily essence.', includes: ['Zuri', 'AI Twin', 'Personal Swarm', 'Essence Board', 'Growth Dashboard'] },
    recommendation: scoreB >= scoreA ? 'B' : 'A',
    reasoning: scoreB >= scoreA
      ? `You're ready for a full personal intelligence system. Your comfort with AI and daily usage pattern means you'll get the most from our advanced features.`
      : `You're starting your personal intelligence journey. Our starter tools will help you grow at your own pace.`,
  }
}

function analyzeAffiliate(answers: Record<string, string>): AnalysisResult {
  const level = answers.current_level || ''
  const goal = answers.biggest_goal_aff || ''
  const challenge = answers.biggest_challenge || ''
  const mostTrue = answers.most_true_aff || ''
  const aiInv = answers.ai_involvement_aff || ''

  const scoreA = ((level === 'Beginner' || level === 'Growing') ? 2 : 0) + ((goal === 'Passive income' || goal === 'Audience growth') ? 2 : 0) + ((challenge === 'Traffic' || challenge === 'Audience') ? 1 : 0) + ((aiInv === 'Minimal' || aiInv === 'Moderate') ? 1 : 0)
  const scoreB = ((level === 'Experienced') ? 2 : 0) + ((goal === 'Better conversions' || goal === 'More offers') ? 2 : 0) + ((mostTrue === 'I need offers' || mostTrue === 'I need growth') ? 1 : 0) + ((aiInv === 'Heavy' || aiInv === 'Full partner') ? 2 : 0)

  return {
    optionA: { name: 'Affiliate Growth System', description: 'Build your affiliate business with smart tracking and AI-powered optimization.', includes: ['Zuri', 'Affiliate Dashboard', 'Link Tracker', 'Conversion Analytics'] },
    optionB: { name: 'Affiliate OS Enterprise', description: 'Full affiliate operating system with automation, AI Twin, and swarm orchestration.', includes: ['Zuri', 'AI Twin', 'Affiliate Swarm', 'Automation Engine', 'Growth Intelligence'] },
    recommendation: scoreB >= scoreA ? 'B' : 'A',
    reasoning: scoreB >= scoreA
      ? `You're ready for the full affiliate operating system. Your experience and goals point to needing advanced automation and AI-powered growth.`
      : `You're building your affiliate foundation. Start with our growth system and scale up as you grow.`,
  }
}

function getQuestionSet(path: PathType) {
  switch (path) {
    case 'client': return CLIENT_QUESTIONS
    case 'creator': return CREATOR_QUESTIONS
    case 'personal': return PERSONAL_QUESTIONS
    case 'affiliate': return AFFILIATE_QUESTIONS
    default: return CLIENT_QUESTIONS
  }
}

// Member mode: these are already-verified platform members, so we skip the
// full intake (name/email/dob etc.) and only ask the handful of questions the
// path analyzer actually scores on — 5 per path.
const MEMBER_QUESTION_IDS: Record<string, string[]> = {
  client: ['archetype', 'ai_involvement', 'most_true', 'hardest', 'biggest_win'],
  creator: ['creator_stage', 'ai_help', 'most_true_creator', 'biggest_goal', 'hardest_creator'],
  personal: ['personal_tech', 'personal_usage', 'personal_most_true', 'personal_goal', 'personal_area'],
  affiliate: ['current_level', 'biggest_goal_aff', 'biggest_challenge', 'most_true_aff', 'ai_involvement_aff'],
}

function getMemberQuestions(path: PathType) {
  const ids = new Set(MEMBER_QUESTION_IDS[path ?? 'client'] ?? [])
  return getQuestionSet(path).filter(q => ids.has(q.id))
}

function getAnalyzer(path: PathType): (answers: Record<string, string>) => AnalysisResult {
  switch (path) {
    case 'client': return analyzeClient
    case 'creator': return analyzeCreator
    case 'personal': return analyzePersonal
    case 'affiliate': return analyzeAffiliate
    default: return analyzeClient
  }
}

const PATH_META = {
  client: {
    title: 'Client',
    subtitle: 'For professionals, business owners, and service providers',
    color: '#C6A664',
    prices: 'from $397/mo',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  creator: {
    title: 'Creator',
    subtitle: 'For content creators, coaches, educators, and digital entrepreneurs',
    color: '#8B7AA8',
    prices: 'from $297/mo',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  personal: {
    title: 'Personal',
    subtitle: 'For individuals, partners, and families',
    color: '#8B7AA8',
    prices: 'free to start',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.672a3.375 3.375 0 00-4.773-4.773L9.05 5.085m7.288 4.142a3.375 3.375 0 01-2.147 5.795m-7.288-6.14a3.375 3.375 0 012.147-5.795" />
      </svg>
    ),
  },
  affiliate: {
    title: 'Affiliate',
    subtitle: 'For affiliate marketers and referral partners',
    color: '#B5764A',
    prices: 'from $0/mo',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.672a3.375 3.375 0 00-4.773-4.773L9.05 5.085m7.288 4.142a3.375 3.375 0 01-2.147 5.795m-7.288-6.14a3.375 3.375 0 012.147-5.795" />
      </svg>
    ),
  },
}

const TIERS = [
  { key: 'starter', name: 'Starter', tagline: 'Core intelligence tools', description: 'Essential intelligence tools to organize and optimize your workflow.', features: ['Core tools', 'Basic agents', 'Standard support'], price: '$0–$197/mo' },
  { key: 'growth', name: 'Growth', tagline: 'Specialized agents & systems', description: 'Unlock specialized agents and deeper automation.', features: ['Specialized agents', 'Advanced automations', 'Priority support'], price: '$197–$997/mo', popular: true },
  { key: 'intelligence_os', name: 'Intelligence OS', tagline: 'Full ecosystem intelligence', description: 'The complete system: AI Twin, swarms, essence boards, cross-platform intelligence.', features: ['AI Twin', 'Swarm orchestration', 'Essence Boards', 'Cross-platform intelligence'], price: 'From $997/mo' },
]

const SCOPE_DATA = {
  client: {
    title: 'Client Intelligence',
    tagline: 'For professionals, business owners, and service providers',
    scope: 'Client Intelligence is designed for businesses that need an AI-powered operating system — from front desk to executive orchestration. It covers customer acquisition, service delivery, team coordination, and growth operations. This is for anyone running a business who wants intelligence baked into every department, not just a chatbot on their website.',
    features: ['Customer acquisition systems', 'Service delivery automation', 'Team & department orchestration', 'Revenue operations intelligence', 'AI Twin for your business'],
    cta: 'Design Your Client Intelligence',
    color: '#C6A664',
  },
  creator: {
    title: 'Creator Intelligence',
    tagline: 'For content creators, coaches, educators, and digital entrepreneurs',
    scope: 'Creator Intelligence is purpose-built for people who turn their expertise, voice, and perspective into products. It handles content strategy, audience growth, monetization systems, and community building. Whether you are a solo creator or building a media business, this intelligence system learns your brand voice and scales your output without burning you out.',
    features: ['Content strategy & production', 'Audience growth intelligence', 'Monetization & product systems', 'Brand voice consistency', 'Community management'],
    cta: 'Design Your Creator Intelligence',
    color: '#8B7AA8',
  },
  personal: {
    title: 'Personal Intelligence',
    tagline: 'For individuals, partners, and families',
    scope: 'Personal Intelligence is a private AI companion that learns your world — your routines, goals, relationships, and growth edges. It helps you make better decisions, stay organized, and build systems around what matters most. This is not a business tool; it is your personal cognitive layer for life management, self-development, and daily clarity.',
    features: ['Personal decision support', 'Daily planning & reflection', 'Goal tracking & growth', 'Relationship & family coordination', 'Private AI companion'],
    cta: 'Design Your Personal Intelligence',
    color: '#8B7AA8',
  },
  affiliate: {
    title: 'Affiliate Intelligence',
    tagline: 'For affiliate marketers and referral partners',
    scope: 'Affiliate Intelligence is built for partners who earn by sharing intelligence products. It tracks referrals, optimizes conversion paths, manages link infrastructure, and provides real-time commission intelligence. This system learns your audience and automatically surfaces the right offers, at the right time, to the right people — turning your influence into automated income.',
    features: ['Smart link management', 'Conversion optimization', 'Commission tracking & analytics', 'Audience matching intelligence', 'Automated campaign systems'],
    cta: 'Design Your Affiliate Intelligence',
    color: '#B5764A',
  },
}

export default function DefineIntelligenceFlow({ initialPath, member = false }: { initialPath?: PathType; member?: boolean }) {
  const router = useRouter()
  // Member mode: skip welcome/scope/personal-info entirely — these users have
  // already completed intake, so they land directly on the path questions.
  const [step, setStep] = useState<Step>(initialPath ? (member ? 'questions' : 'scope-intro') : 'welcome')
  const [path, setPath] = useState<PathType>(initialPath || null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', dob: '', address: '' })
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const questions = member ? getMemberQuestions(path) : getQuestionSet(path)
  const totalQuestions = questions.length
  const progress = path && step === 'questions'
    ? Math.round(((currentQuestion) / totalQuestions) * 100)
    : 0

  function selectPath(p: PathType) {
    setPath(p)
    setStep('personal-info')
    setCurrentQuestion(0)
    setAnswers({})
    setAnalysis(null)
  }

  function submitPersonalInfo(e: React.FormEvent) {
    e.preventDefault()
    if (!personalInfo.name || !personalInfo.email) return
    setStep('questions')
  }

  function answerQuestion(answer: string) {
    const q = questions[currentQuestion]
    const updated = { ...answers, [q.id]: answer }
    setAnswers(updated)

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      const result = getAnalyzer(path)(updated)
      setAnalysis(result)
      setStep('analysis')
    }
  }

  function goBackQuestion() {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1)
  }

  // ── Welcome Step ──
  if (step === 'welcome') {
    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white">
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl">
          <Link href="/" className="font-display font-bold tracking-tight text-lg">
            EVOLVED <span className="text-[#C6A664]">EDEN</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <Link href="/demo" className="hover:text-white transition-colors">Demo</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/pricing" className="px-4 py-2 bg-[#C6A664] text-black text-xs font-bold rounded-sm hover:bg-white transition-colors">Get Started</Link>
          </div>
        </nav>

        <section className="flex flex-col items-center justify-center min-h-screen px-6 pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full text-xs text-white/40 mb-8 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A664] animate-pulse-slow" />
            Define Your Intelligence
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-3xl text-center leading-none">
            What kind of intelligence<br /><span className="text-[#C6A664]">do you need?</span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl text-center mb-12 leading-relaxed">
            Tell us about your world, and we&apos;ll design the system that fits how you work, create, and grow.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-12">
            {(Object.entries(PATH_META) as [PathType, typeof PATH_META.client][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => selectPath(key!)}
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-left hover:border-white/[0.2] hover:bg-white/[0.04] transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                  {meta.icon}
                </div>
                <h3 className="font-display text-lg font-bold mb-1">{meta.title}</h3>
                <p className="text-sm text-white/40 mb-1">{meta.subtitle}</p>
                <p className="text-xs text-white/30" style={{ color: meta.color }}>{meta.prices}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-white/20 text-center max-w-md">
            Every account starts with a universal package — including Zuri, Front Desk, Intelligence Profile, Essence Board, and RIS License.
          </p>
        </section>
      </main>
    )
  }

  // ── Scope Intro Step ──
  if (step === 'scope-intro' && path) {
    const scope = SCOPE_DATA[path]
    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white">
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl">
          <Link href="/" className="font-display font-bold tracking-tight text-lg">
            EVOLVED <span className="text-[#C6A664]">EDEN</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <Link href="/demo" className="hover:text-white transition-colors">Demo</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </nav>

        <section className="flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full text-xs text-white/40 mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ backgroundColor: scope.color }} />
            Define Intelligence
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter mb-4 max-w-3xl text-center leading-none">
            {scope.title}
          </h1>
          <p className="text-lg max-w-xl text-center mb-3" style={{ color: scope.color }}>
            {scope.tagline}
          </p>
          <p className="text-white/40 text-sm max-w-2xl text-center leading-relaxed mb-10">
            {scope.scope}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-xl">
            {scope.features.map((f: string) => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: `${scope.color}30`, color: scope.color }}>
                {f}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setStep('personal-info')}
              className="px-10 py-4 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all glow-acid text-center"
            >
              {scope.cta} →
            </button>
            <button onClick={() => setStep('welcome')} className="text-sm text-white/30 hover:text-white/60 transition-colors">
              ← Choose a different intelligence type
            </button>
          </div>
        </section>
      </main>
    )
  }

  // ── Personal Info Step ──
  if (step === 'personal-info' && path) {
    const meta = PATH_META[path]
    const isValid = personalInfo.name.trim() && personalInfo.email.trim()

    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <Link href="/" className="font-display text-sm font-semibold tracking-wide">
            EVOLVED <span className="text-[#C6A664]">EDEN</span>
          </Link>
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>{meta.title}</span>
        </header>
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-1">Tell us about yourself</h2>
            <p className="text-white/50 text-sm mb-8">We need a few details to set up your intelligence system.</p>
            <form onSubmit={submitPersonalInfo} className="space-y-5">
              <div>
                <label className="text-xs text-white/40 block mb-1.5">Full Name *</label>
                <input type="text" value={personalInfo.name} onChange={e => setPersonalInfo(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/30 focus:outline-none focus:border-[#C6A664]/50 transition-all"
                  placeholder="Your name" required />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1.5">Email Address *</label>
                <input type="email" value={personalInfo.email} onChange={e => setPersonalInfo(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/30 focus:outline-none focus:border-[#C6A664]/50 transition-all"
                  placeholder="you@example.com" required />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1.5">Phone Number <span className="text-white/20">(optional)</span></label>
                <input type="tel" value={personalInfo.phone} onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/30 focus:outline-none focus:border-[#C6A664]/50 transition-all"
                  placeholder="(555) 123-4567" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Date of Birth <span className="text-white/20">(optional)</span></label>
                  <input type="date" value={personalInfo.dob} onChange={e => setPersonalInfo(p => ({ ...p, dob: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white focus:outline-none focus:border-[#C6A664]/50 transition-all [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Address <span className="text-white/20">(optional)</span></label>
                  <input type="text" value={personalInfo.address} onChange={e => setPersonalInfo(p => ({ ...p, address: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/30 focus:outline-none focus:border-[#C6A664]/50 transition-all"
                    placeholder="City, State" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <button type="button" onClick={() => setStep('welcome')}
                  className="text-sm text-white/30 hover:text-white/60 transition-colors">← Back</button>
                <button type="submit" disabled={!isValid}
                  className="px-8 py-3 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Start Questions →
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    )
  }

  // ── Questions Step ──
  if (step === 'questions' && path) {
    const q = questions[currentQuestion]
    const meta = PATH_META[path]
    const hasPrev = currentQuestion > 0

    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <Link href="/define-intelligence" className="font-display text-sm font-semibold tracking-wide">
            EVOLVED <span className="text-[#C6A664]">EDEN</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>{meta.title}</span>
            <span className="text-xs text-white/30">Question {currentQuestion + 1} of {totalQuestions}</span>
          </div>
        </header>
        <div className="h-0.5 bg-white/[0.05]">
          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: meta.color }} />
        </div>
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="animate-fade-in">
            <p className="text-xs text-white/30 tracking-widest uppercase mb-2">Design Your Intelligence</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">{q.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => answerQuestion(opt)}
                  className={`p-4 rounded-sm border text-sm text-left transition-all ${answers[q.id] === opt ? '' : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20'}`}
                  style={{ borderColor: answers[q.id] === opt ? meta.color : undefined, backgroundColor: answers[q.id] === opt ? `${meta.color}10` : undefined, color: answers[q.id] === opt ? meta.color : undefined }}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-10">
              {hasPrev ? (
                <button onClick={goBackQuestion} className="text-sm text-white/30 hover:text-white/60 transition-colors">← Previous</button>
              ) : member ? (
                <Link href="/dashboard" className="text-sm text-white/30 hover:text-white/60 transition-colors">← Back to Dashboard</Link>
              ) : (
                <Link href="/define-intelligence" className="text-sm text-white/30 hover:text-white/60 transition-colors">← All Paths</Link>
              )}
              <span className="text-xs text-white/20">{currentQuestion + 1} / {totalQuestions}</span>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── Analysis Step ──
  if (step === 'analysis' && analysis && path) {
    const meta = PATH_META[path]
    const rec = analysis.recommendation === 'A' ? analysis.optionA : analysis.optionB
    const other = analysis.recommendation === 'A' ? analysis.optionB : analysis.optionA

    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <Link href="/" className="font-display text-sm font-semibold tracking-wide">
            EVOLVED <span className="text-[#C6A664]">EDEN</span>
          </Link>
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>{meta.title}</span>
        </header>
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center mb-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#C6A664]/10 border border-[#C6A664]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C6A664]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Zuri&apos;s <span className="text-[#C6A664]">Analysis</span></h1>
            <p className="text-white/40 text-sm max-w-md mx-auto">Based on your answers, I&apos;ve designed two intelligence paths for you.</p>
          </div>
          <div className="rounded-sm p-6 mb-8 border animate-fade-in" style={{ backgroundColor: `${meta.color}08`, borderColor: `${meta.color}20` }}>
            <p className="text-sm text-white/70 leading-relaxed">{analysis.reasoning}</p>
          </div>
          <div className="animate-fade-in mb-6" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>RECOMMENDED</span>
              <span className="text-xs text-white/30">Option {analysis.recommendation}</span>
            </div>
            <div className="rounded-sm p-6 border" style={{ backgroundColor: `${meta.color}08`, borderColor: `${meta.color}30` }}>
              <h2 className="font-display text-2xl font-bold mb-1" style={{ color: meta.color }}>{rec.name}</h2>
              <p className="text-sm text-white/50 mb-4">{rec.description}</p>
              <div className="flex flex-wrap gap-2">
                {rec.includes.map((item) => (
                  <span key={item} className="text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: `${meta.color}20`, color: meta.color }}>{item}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="animate-fade-in mb-10" style={{ animationDelay: '0.4s' }}>
            <p className="text-xs text-white/30 mb-2">Also consider:</p>
            <div className="rounded-sm p-5 border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-display text-lg font-bold mb-1 text-white/80">{other.name}</h3>
              <p className="text-sm text-white/40 mb-3">{other.description}</p>
              <div className="flex flex-wrap gap-2">
                {other.includes.map((item) => (
                  <span key={item} className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-white/40">{item}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-sm text-white/40 mb-4">Ready to build your intelligence system?</p>
            <button
              onClick={() => setStep('plan-detail')}
              className="inline-block px-8 py-3.5 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all glow-acid"
            >
              View Your Plan →
            </button>
            <div className="mt-3">
              <Link href="/demo" className="text-xs text-white/20 hover:text-white/50 transition-colors">Try a demo first</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── Plan Detail Step ──
  if (step === 'plan-detail' && analysis && path) {
    const meta = PATH_META[path]

    // Map analysis → actual plan tier
    const planMapping: Record<string, Record<string, string>> = {
      client: { A: 'client_founder', B: 'client_org' },
      creator: { A: 'creator_studio', B: 'creator_premium' },
      personal: { A: 'personal_plus', B: 'personal_premium' },
      affiliate: { A: 'affiliate_annual', B: 'affiliate_plug' },
    }
    const planKey = planMapping[path]?.[analysis.recommendation] || 'client_founder'
    const baseKey = planKey.replace(/^(client|creator|personal)_/, '')
    const plans = BASE_PLANS[path as PlanPathType] as Record<string, { name: string; price: number; period: string; tagline: string }>
    const plan = plans[baseKey]
    const recOption = analysis.recommendation === 'A' ? analysis.optionA : analysis.optionB

    function toggleAddon(id: string) {
      setSelectedAddons(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }

    const addonTotal = ADDONS.filter(a => selectedAddons.has(a.id)).reduce((sum, a) => sum + a.price, 0)
    const totalDue = plan?.price ?? 0
    const monthlyTotal = plan?.period === '/month' ? totalDue + addonTotal : totalDue

    async function handleCheckout() {
      if (!plan) return
      setCheckoutLoading(true)
      setCheckoutError('')
      const params = new URLSearchParams({
        tier: planKey,
        path: path ?? 'client',
      })
      const addonIds = Array.from(selectedAddons)
      if (addonIds.length > 0) params.set('addons', addonIds.join(','))

      // Member mode: the user is already signed in, so create the Stripe
      // session immediately instead of routing through the register flow.
      if (member) {
        try {
          const res = await fetch('/api/stripe/checkout-flow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tier: planKey,
              path: path ?? 'client',
              addons: addonIds.map(id => ({ id })),
            }),
          })
          const d = await res.json()
          if (d.url) {
            window.location.href = d.url
            return
          }
          if (d.requiresAuth) {
            router.push(d.redirectUrl || '/login')
            return
          }
          setCheckoutError(d.error || 'Checkout failed')
        } catch {
          setCheckoutError('Checkout failed. Please try again.')
        }
        setCheckoutLoading(false)
        return
      }

      router.push(`/register?${params.toString()}`)
    }

    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <Link href="/" className="font-display text-sm font-semibold tracking-wide">
            EVOLVED <span className="text-[#C6A664]">EDEN</span>
          </Link>
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>{meta.title}</span>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-16">
          {/* Plan header */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="text-xs text-[#C6A664] uppercase tracking-widest mb-2">Your Intelligence System</div>
            <h1 className="font-display text-4xl font-bold mb-2">
              {plan?.name || 'Your Plan'}
            </h1>
            <p className="text-white/50 text-sm max-w-md mx-auto">{plan?.tagline || ''}</p>
          </div>

          {/* Price card */}
          {plan && (
            <div className="glass rounded-2xl p-6 border border-[#C6A664]/20 mb-8 animate-fade-in" style={{ background: 'linear-gradient(135deg, rgba(200,255,0,0.05) 0%, rgba(200,255,0,0.01) 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-white/30 uppercase tracking-wider mb-1">{path!.charAt(0).toUpperCase() + path!.slice(1)} Plan</div>
                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#C6A664]">${plan.price.toLocaleString()}</div>
                  <div className="text-xs text-white/40">{plan.period || 'free'}</div>
                </div>
              </div>

              {/* Core features from analysis */}
              <div className="mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Core Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {recOption.includes.map((item, i) => (
                    <span key={i} className="px-3 py-1 rounded-full border text-xs"
                      style={{ borderColor: `${meta.color}20`, color: meta.color }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add-ons */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Customize with Add-Ons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ADDONS.map((addon) => (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`flex items-center justify-between rounded-sm p-3 border text-left transition-all ${
                    selectedAddons.has(addon.id)
                      ? 'border-[#C6A664]/40 bg-[#C6A664]/8'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-white/80 truncate">{addon.name}</h4>
                    <p className="text-[10px] text-white/40 truncate">{addon.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs font-mono whitespace-nowrap" style={{ color: meta.color }}>
                      +${addon.price}{addon.period}
                    </span>
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
                      selectedAddons.has(addon.id)
                        ? 'bg-[#C6A664] border-[#C6A664]'
                        : 'border-white/20'
                    }`}>
                      {selectedAddons.has(addon.id) && (
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-4 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-xs text-white/30 tracking-widest uppercase mb-3">Price Breakdown</p>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">{plan?.name || 'Plan'} (base)</span>
                <span className="text-white/80">${(plan?.price ?? 0).toLocaleString()}{plan?.period}</span>
              </div>
              {ADDONS.filter(a => selectedAddons.has(a.id)).map((addon) => (
                <div key={addon.id} className="flex justify-between text-sm">
                  <span className="text-white/40">{addon.name}</span>
                  <span className="text-white/60">+${addon.price}{addon.period}</span>
                </div>
              ))}
              {addonTotal === 0 && (
                <div className="text-xs text-white/20 italic">No add-ons selected</div>
              )}
            </div>
            <div className="border-t border-white/[0.06] pt-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-white/80">Total</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-[#C6A664]">
                    ${monthlyTotal.toLocaleString()}
                  </span>
                  <span className="text-xs text-white/30 ml-1">
                    {plan?.period || ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout error */}
          {checkoutError && (
            <p className="text-red-400 text-xs text-center mb-4">{checkoutError}</p>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="flex-1 px-8 py-4 bg-[#C6A664] text-black font-bold text-sm rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed text-center"
            >
              {checkoutLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `Proceed to Checkout — $${monthlyTotal.toLocaleString()}${plan?.period || ''}`
              )}
            </button>
            <button onClick={() => setStep('analysis')}
              className="px-6 py-4 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-center text-sm">
              ← Back to Options
            </button>
          </div>
        </div>
      </main>
    )
  }

  return null
}
