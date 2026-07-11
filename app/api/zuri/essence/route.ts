import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIKey, getAnthropicKey, getEssenceProvider, getEssenceModel } from '@/lib/config'

// ── Types ──────────────────────────────────────────────────────────
type AIProvider = 'openai' | 'anthropic' | 'openrouter' | 'local' | 'disabled'
type EssenceItem = { type: string; content: string; priority: 'high' | 'medium' | 'low' }

// ── Fallback (always available, last resort) ──────────────────────
const FALLBACK = {
  items: [
    { type: 'focus',    content: 'Review your intelligence blueprint alignment', priority: 'high' },
    { type: 'action',   content: 'Complete one high-impact task before noon', priority: 'high' },
    { type: 'timing',   content: 'Optimal engagement window: 10 AM - 2 PM', priority: 'medium' },
    { type: 'habit',    content: 'Schedule recovery time between intensive sessions', priority: 'medium' },
    { type: 'growth',   content: 'Reach out to 2 strategic connections today', priority: 'low' },
    { type: 'brand',    content: 'Your brand voice is strongest in direct conversation', priority: 'low' },
  ],
  dailyQuestion: "What's one decision you made today that your future self would thank you for?",
  provider: 'fallback' as const,
}

// ── Gate-based suggestion templates ───────────────────────────────
// Keyed by gate number, each entry provides diverse daily suggestions
const GATE_SUGGESTIONS: Record<number, string[]> = {
  1:  ["Express your original ideas — they carry creative force today", "Trust your unique perspective even when others doubt it", "Your creativity flows when you give yourself permission to be different"],
  2:  ["Check if your current direction still aligns with your values", "Your sense of direction is strongest when you're still — listen before moving", "One small course correction now prevents drift later"],
  3:  ["Embrace the chaos — innovation lives in the unknown", "Order emerges when you stop forcing it and start observing patterns", "Start something imperfectly instead of waiting for clarity"],
  4:  ["Ask the question you've been avoiding — the answer is simpler than you think", "Your understanding deepens when you admit what you don't know", "Teach something to learn it fully"],
  5:  ["Patience is not waiting — it's trusting the timing of your process", "Slow down to speed up: pause before reacting today", "Nature doesn't rush, yet everything gets done"],
  6:  ["Use tension as information — friction reveals where growth is needed", "Stand your ground without making it personal", "A boundary today protects your energy tomorrow"],
  7:  ["Lead through service, not authority — influence follows contribution", "Your example speaks louder than your words today", "Step into the role only you can fill"],
  8:  ["Your authenticity is your strategy — drop the mask today", "Contribute from your essence, not your obligation", "What feels like showing off is actually showing up"],
  9:  ["Focus on one thing that matters — depth beats breadth today", "Small details carry big messages — pay attention to what's precise", "Your power is in your focus, not your availability"],
  10: ["Be present where you are — your presence shapes the room", "How you do one thing is how you do everything", "Self-awareness is the foundation of all growth"],
  11: ["Let yourself vision without limitation — ideas need space to breathe", "The clearest vision comes when you stop looking and start feeling", "Inspiration follows action, not the other way around"],
  12: ["Articulate what you sense but can't yet prove — words give form to intuition", "Your voice matters most when it's honest, not when it's polished", "Say the thing you've been holding back"],
  13: ["Listen beyond words — the real message is in what's unsaid", "Your empathy is a radar — trust what it picks up today", "Connection deepens when you receive without fixing"],
  14: ["Your skills compound when shared — teach what you know today", "Abundance follows generosity — give your best work away", "Power skills amplify when used in service of others"],
  15: ["Find your rhythm and honor it — consistency beats intensity", "Extremes drain; moderation sustains. Check where you're overdoing it", "Your natural rhythm knows the pace — follow it"],
  16: ["Mastery is showing up again, not getting it right the first time", "Practice something with full attention today — even 10 minutes counts", "Skill is built in the mundane, not the magical"],
  17: ["Your perspective is unique — share it openly today", "A new angle on an old problem reveals the solution", "Curiosity expands your view — ask one question from a different lens"],
  18: ["Improvement starts with honest assessment — not criticism", "One small fix today prevents a larger correction tomorrow", "Perfection is the enemy of progress — improve, don't perfect"],
  19: ["Reach out — connection is the gateway to opportunity today", "Your desire for connection is a signal, not a weakness", "The right people are drawn to your authenticity"],
  20: ["Observe before acting — awareness is your greatest tool today", "Contemplation turns information into wisdom", "Stillness reveals what busyness hides"],
  21: ["Take control of what only you can manage; release the rest", "Control is a tool, not a destination — use it wisely today", "Mastery of self precedes mastery of circumstance"],
  22: ["Receptivity is not passivity — it's active openness to what's emerging", "Grace under pressure is your superpower today", "Welcome the unexpected — it carries a gift"],
  23: ["Discern what to integrate and what to release — not everything belongs", "Assimilation takes time — don't rush the process of understanding", "Distinction is clarity in action — separate signal from noise"],
  24: ["Return to what you know to be true — renewal comes from roots", "What cycle is completing? Honor it before starting the next", "Rest is productive when it leads to renewal"],
  25: ["Trust your spontaneous impulse today — not every move needs analysis", "Innocence is not naivety — it's openness without armor", "The most authentic response is the one you don't rehearse"],
  26: ["Your ego is a compass — notice where it points but don't let it steer", "Greatness comes from serving something larger than yourself", "Use your influence to elevate others today"],
  27: ["Nurture something today — including yourself", "Care is a currency that compounds when spent generously", "Supporting others' growth accelerates your own"],
  28: ["Purpose reveals itself in action, not in contemplation", "The game is rigged in favor of those who play — take one step today", "Your life has purpose even when the path is unclear"],
  29: ["Commitment is the bridge between intention and reality — cross it today", "Stay the course — persistence through difficulty builds character", "Your word is your bond. Honor one promise to yourself today"],
  30: ["Desire is data — what you want reveals where you're meant to go", "Fire burns brightest when directed — channel your passion intentionally", "Wanting is not weakness; it's orientation toward growth"],
  31: ["Influence begins with listening — lead by understanding first", "Your impact is proportional to your receptivity today", "The best leaders create other leaders, not followers"],
  32: ["Consistency compounds — one small daily action beats sporadic intensity", "Continuity is more important than intensity today", "Stay with it — the breakthrough comes after the plateau"],
  33: ["Privacy is productive — guard your energy by withdrawing when needed", "Solitude is not loneliness; it's strategic reset", "Your best work happens away from the crowd"],
  34: ["Your vitality is high — channel it into what matters most", "Power without direction is destruction — aim carefully today", "You have more energy than you think — use it wisely"],
  35: ["Change is the only constant — flow with it instead of fighting it", "Adaptability is intelligence in motion", "What's ending is making room for what's ready to begin"],
  36: ["Crisis reveals character — you're stronger than this moment feels", "The dark is where seeds germinate — trust the process", "This challenge is your transformation in disguise"],
  37: ["Friendship fuels growth — invest in your people today", "Equality in relationships creates the strongest foundation", "Collaboration multiplies your impact"],
  38: ["The struggle is the teacher — what is this fight trying to show you?", "Opposition reveals alignment — stand firm where it matters", "Your resistance is a sign of life, not a problem to solve"],
  39: ["Challenge is an invitation to expand — say yes to one hard thing", "The obstacle is the way — go through it, not around it", "Your edge grows where you push against resistance"],
  40: ["Rest is not lazy — it's strategic. Take real alone time today", "Solitude recharges your capacity for connection", "Being alone is different from being lonely — embrace the distinction"],
  41: ["Your imagination is previewing possibilities — pay attention", "What you can conceive, you can achieve — dream on purpose today", "Contraction precedes expansion — the pause is productive"],
  42: ["Growth follows completion — finish what you started before starting new", "Completion is its own reward — don't rush the finale", "Something is ready to end so something new can begin"],
  43: ["Breakthrough follows breakdown — press into the discomfort today", "Insight arrives when you stop pushing and start listening", "The answer you need is on the other side of a risk"],
  44: ["Notice the patterns — the universe speaks in symbols today", "Your pattern recognition is heightened — trust your hunches", "Alertness to opportunity is the precursor to luck"],
  45: ["Gathering people around a shared vision is your power today", "Leadership is service — bring people together around what matters", "Your tribe is waiting for you to call the circle"],
  46: ["Luck favors determination — keep pushing upward today", "Your persistence will pay off sooner than you think", "One more step is all it takes to break through"],
  47: ["Transformation is uncomfortable by design — lean into the tension", "Oppression is temporary; your response to it is transformative", "The pressure you feel is the birth of something new"],
  48: ["You have everything you need — resourcefulness is your edge today", "Depth beats surface — go deeper into one question", "The well inside you never runs dry — draw from it"],
  49: ["It's okay to reject what no longer serves you — principles over comfort", "Revolution starts with a single 'no' to what's not working", "Your values are your compass — check your heading today"],
  50: ["Nourish your foundations today — health, relationships, systems", "Values are not abstract — they show up in daily choices", "What you feed grows; what you starve withers. Choose wisely"],
  51: ["Shock wakes you up — pay attention to surprises today", "Courage is not the absence of fear; it's action despite it", "The unexpected carries a gift if you're open to receiving it"],
  52: ["Stillness is not emptiness — it's readiness. Be still and know", "Composure under pressure is your superpower today", "Before you react, breathe. The pause is power"],
  53: ["Growth happens in increments — trust the slow unfolding", "Development is not always visible — the roots are growing", "You're evolving even when it feels like standing still"],
  54: ["Ambition without attachment is freedom — pursue without grasping", "Your drive is a gift when it's not a burden", "Aspire fully, but stay unattached to the outcome"],
  55: ["Abundance is a mindset before it's a reality — shift your perspective", "Spirit moves through gratitude — find one thing to celebrate today", "Your cup overflows when you stop measuring it against others"],
  56: ["Communication carries energy — choose your words with intention", "Your message matters more than your medium", "Wander with purpose — exploration fuels discovery"],
  57: ["Intuition speaks in whispers — listen for the quiet knowing today", "Clarity comes from within, not from more information", "Trust your gut — it's processing data your mind hasn't caught yet"],
  58: ["Joy is a discipline — choose it regardless of circumstances", "Your vitality is contagious when you lead with enjoyment", "Pleasure is not a distraction from purpose; it's fuel for it"],
  59: ["Intimacy in all forms — connection, creativity, collaboration — is the theme", "Sexuality is creative energy — channel it into your work today", "Close relationships reveal where you're ready to grow"],
  60: ["Limitation is a teacher — what boundary is trying to focus you?", "Realism is not pessimism; it's seeing clearly so you can act effectively", "Your limitations define your edge — work with them, not against them"],
  61: ["Inner truth reveals itself in silence — create space for it today", "Mystery is not a problem to solve but a reality to embrace", "The deepest knowing cannot be spoken — sit with what you sense"],
  62: ["Precision in communication prevents confusion — be exact today", "Detail work is sacred work — honor the small things", "Accuracy is a form of respect for your audience"],
  63: ["Doubt is not the opposite of faith — it's part of the process", "Skepticism is healthy when it leads to investigation, not paralysis", "Question everything, but keep moving"],
  64: ["Confusion precedes breakthrough — stay with the uncertainty", "Not knowing is the beginning of wisdom", "The unfinished is full of potential — leave room for surprise"],
}

// ── Archetype-specific daily questions ───────────────────────────
const ARCHETYPE_QUESTIONS: Record<string, string[]> = {
  'The Pioneer': [
    "What frontier are you avoiding that only you can cross?",
    "Where is your courage calling you to lead today?",
    "What would you attempt if failure wasn't an option?",
  ],
  'The Sage': [
    "What wisdom from your experience applies to today's challenge?",
    "Who needs to hear what you've learned?",
    "What question, if answered, would change everything?",
  ],
  'The Alchemist': [
    "What raw material in your life is ready to be transformed?",
    "Where is the gold hidden in today's difficulty?",
    "What combination of your skills creates something new?",
  ],
  'The Strategist': [
    "What's the one move that makes everything else easier?",
    "Where is your energy best invested, not just spent?",
    "What pattern, if you saw it clearly, would shift your approach?",
  ],
  'The Connector': [
    "Who in your network needs what only you can provide?",
    "What bridge are you uniquely positioned to build today?",
    "How can collaboration multiply your impact today?",
  ],
  'The Architect': [
    "What system, if improved, would change everything?",
    "What are you building that will outlast you?",
    "Where does structure serve you and where does it confine you?",
  ],
  'The Visionary': [
    "What future are you called to create that doesn't yet exist?",
    "If you could see 10 years ahead, what would you start today?",
    "What's the boldest version of your vision?",
  ],
  'The Guardian': [
    "What's worth protecting, and what are you ready to release?",
    "Where does your strength serve others best today?",
    "What foundation needs reinforcement before you build higher?",
  ],
  'The Catalyst': [
    "What change are you resisting that would set you free?",
    "Where is your energy needed to shift the status quo?",
    "What truth, once spoken, would accelerate everything?",
  ],
  'The Weaver': [
    "What threads in your life are ready to be woven together?",
    "Where does integration create more value than addition?",
    "What story are you telling yourself that limits the whole picture?",
  ],
  'The Seeker': [
    "What question is worth spending your life answering?",
    "Where is your curiosity leading you today?",
    "What would you explore if you had nothing to prove?",
  ],
  'The Harmonizer': [
    "Where is peace the most powerful move you can make?",
    "What needs balance in your life right now?",
    "How can you bring harmony without compromising truth?",
  ],
  'The Artisan': [
    "What craft are you called to refine today?",
    "Where does mastery meet meaning in your work?",
    "What would you create if no one was watching?",
  ],
  'The Navigator': [
    "What course correction would save you weeks of drift?",
    "Where is your compass pointing that your mind is arguing with?",
    "What's the next true north in your journey?",
  ],
  'The Amplifier': [
    "What message deserves to be amplified through your voice?",
    "Where can your enthusiasm ignite momentum?",
    "What's the force multiplier in your current project?",
  ],
  'The Cultivator': [
    "What have you planted that needs patient nurturing today?",
    "Where is growth happening beneath the surface?",
    "What seeds are you sowing for a harvest you may never see?",
  ],
}

const GENERIC_QUESTIONS = [
  "What's one decision you made today that your future self would thank you for?",
  "What's the conversation you're avoiding that needs to happen?",
  "Where did you play small today when you could have stepped up?",
  "What would you attempt if you knew you couldn't fail?",
  "What are you pretending not to know?",
  "What's the most important thing you're not doing?",
  "If today were your last, what would you regret not having done?",
  "What does your next level require you to let go of?",
  "Who do you need to become to achieve what you want?",
  "What's the gift in today's challenge?",
]

const SYSTEM_PROMPT = `You are the Essence Board generator for Evolved Eden — a multi-lens human intelligence engine.

Generate a daily intelligence brief that synthesizes the user's astrological, numerological, and human design profile into actionable insights.

Return valid JSON only, no other text:
{
  "items": [
    { "type": "focus|optimization|timing|opportunity|growth|brand|habit|action", "content": "specific actionable insight", "priority": "high|medium|low" }
  ],
  "dailyQuestion": "a thought-provoking question for the user to reflect on"
}

Rules:
- Generate exactly 6 items
- Be specific, actionable, and reference the user's actual astrological/numerological profile data when available
- Use the user's context if provided
- Mix priorities: 2 high, 2 medium, 2 low
- Daily question should make them think and reference their archetype or chart if available
- If you have astrology data: consider the user's Sun, Moon, Rising signs, current transits, and moon phase
- If you have numerology data: reference their personal year/month/day energy
- If you have human design data: consider their type, profile, and gates`

// ── Detect which AI provider to use ────────────────────────────────
async function getProvider(): Promise<AIProvider> {
  // Check env vars directly first (fastest, no DB dependency)
  if (process.env.OPENROUTER_API_KEY) return 'openrouter'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) return 'anthropic'
  // Fallback: check DB config (may fail gracefully depending on env setup)
  try {
    const configured = (await getEssenceProvider() || '').toLowerCase() as AIProvider
    if (configured === 'openai' || configured === 'anthropic' || configured === 'openrouter' || configured === 'local' || configured === 'disabled') {
      return configured
    }
    const openaiKey = await getOpenAIKey()
    const anthropicKey = await getAnthropicKey()
    if (openaiKey) return 'openai'
    if (anthropicKey) return 'anthropic'
  } catch {
    // DB config unavailable — ignore
  }
  return 'disabled' // No AI available — use deterministic fallback
}

// ── OpenAI / OpenRouter generator ────────────────────────────────────
async function generateWithOpenAI(prompt: string, mode: 'openai' | 'openrouter' = 'openai'): Promise<{ items: EssenceItem[]; dailyQuestion: string } | null> {
  const { default: OpenAI } = await import('openai')
  const isOpenRouter = mode === 'openrouter'
  const apiKey = isOpenRouter ? process.env.OPENROUTER_API_KEY : await getOpenAIKey()
  if (!apiKey) return null
  const openai = new OpenAI({
    apiKey,
    ...(isOpenRouter ? { baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1' } : {}),
  })

  const model = isOpenRouter ? (process.env.OPENROUTER_ESSENCE_MODEL || 'anthropic/claude-sonnet-4-20250514') : await getEssenceModel()
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) return null
  return JSON.parse(raw)
}

// ── Anthropic generator ──────────────────────────────────────────────
async function generateWithAnthropic(prompt: string): Promise<{ items: EssenceItem[]; dailyQuestion: string } | null> {
  try {
    const mod = await import('@anthropic-ai/sdk')
    const Anthropic = mod.default
    const anthropicKey = await getAnthropicKey()
    if (!anthropicKey) return null
    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const model = await getEssenceModel()
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content?.type === 'text') {
      return JSON.parse(content.text)
    }
    return null
  } catch {
    return null
  }
}

// ── Local / DB-driven generator ──────────────────────────────────────
function generateLocal(
  userRole: string,
  context: string,
  scores?: Record<string, number>,
  archetype?: string,
  tasks?: { content: string; type: string }[],
  recentMemories?: string[],
  lensData?: { astrology?: any; numerology?: any }
): { items: EssenceItem[]; dailyQuestion: string } {
  const items: EssenceItem[] = []
  const a = lensData?.astrology
  const n = lensData?.numerology

  // Day-based seed for variety
  const daySeed = new Date().toISOString().slice(0, 10)
  const seedNum = daySeed.split('-').reduce((s, p) => s + parseInt(p), 0)

  // 1. Archetype-based focus (with gate suggestions if available)
  const gateNum = Math.abs(seedNum) % 64 + 1
  if (archetype) {
    items.push({ type: 'focus', content: `Lean into your ${archetype} archetype strengths today`, priority: 'high' })
  } else {
    items.push({ type: 'focus', content: `Align your ${userRole || 'intelligence'} priorities for today`, priority: 'high' })
  }

  // 2. Astrology-based suggestion (if available)
  if (a?.moonPhase && a?.sunSign) {
    const moonSuggestions: Record<string, string> = {
      'New Moon': 'New moon energy — ideal for setting intentions and starting fresh initiatives',
      'Waxing Crescent': 'Waxing crescent — momentum is building. Take visible action on your goals',
      'First Quarter': 'First quarter moon — push through resistance. Challenges are clearing the path',
      'Waxing Gibbous': 'Waxing gibbous — refine and adjust. What you\'re building needs one more polish',
      'Full Moon': 'Full moon — harvest time. Celebrate progress and release what no longer serves',
      'Waning Gibbous': 'Waning gibbous — share your wisdom. Teaching others consolidates your mastery',
      'Last Quarter': 'Last quarter — release and forgive. Letting go creates space for the new',
      'Waning Crescent': 'Waning crescent — rest and integrate. The next cycle begins soon',
    }
    items.push({
      type: 'timing',
      content: moonSuggestions[a.moonPhase] || `The ${a.moonPhase} moon is influencing today's energy`,
      priority: 'medium',
    })

    // Transit aspects
    if (a.transitingPlanets) {
      const activeTransits = Object.entries(a.transitingPlanets).filter(([, p]: any) => p.aspecting?.length > 0)
      if (activeTransits.length > 0) {
        const [planet, data]: [string, any] = activeTransits[seedNum % activeTransits.length]
        items.push({
          type: 'opportunity',
          content: `Transit alert: ${planet} ${data.aspecting[0]} — a window for aligned action`,
          priority: data.aspecting[0]?.includes('opposition') || data.aspecting[0]?.includes('square') ? 'high' : 'low',
        })
      }
    }
  }

  // 3. Numerology-based suggestion
  if (n?.personalYear) {
    const yearMeanings: Record<number, string> = {
      1: 'Personal Year 1 — new beginnings. Start the project you\'ve been planning',
      2: 'Personal Year 2 — patience and partnership. Collaborate rather than push',
      3: 'Personal Year 3 — creative expression. Share your ideas and connect socially',
      4: 'Personal Year 4 — build foundations. Discipline and structure pay off now',
      5: 'Personal Year 5 — embrace change. Freedom and variety are the themes',
      6: 'Personal Year 6 — nurture relationships. Home, family, and responsibility call',
      7: 'Personal Year 7 — go inward. Research, reflect, and recharge',
      8: 'Personal Year 8 — power and abundance. Your efforts manifest materially',
      9: 'Personal Year 9 — completion. Tie loose ends and prepare for renewal',
    }
    items.push({
      type: 'optimization',
      content: yearMeanings[n.personalYear] || `Personal Year ${n.personalYear} energy influences your decisions`,
      priority: 'medium',
    })

    // Personal Day number for micro-timing
    const dayThemes: Record<number, string> = {
      1: 'Today favors initiation — start something bold',
      2: 'Today favors cooperation — seek alignment',
      3: 'Today favors creative expression — share your voice',
      4: 'Today favors discipline — do the hard work',
      5: 'Today favors adventure — break your routine',
      6: 'Today favors service — help someone',
      7: 'Today favors reflection — take time to think',
      8: 'Today favors action — move with authority',
      9: 'Today favors completion — finish what you started',
    }
    if (n.personalDay && dayThemes[n.personalDay]) {
      items.push({
        type: 'habit',
        content: dayThemes[n.personalDay],
        priority: 'low',
      })
    }

    // Karmic lesson reminder
    if (n.karmicLessons?.length > 0) {
      items.push({
        type: 'growth',
        content: `Your karmic lessons (${n.karmicLessons.join(', ')}) invite growth through awareness today`,
        priority: 'low',
      })
    }
  }

  // 4. Low-score improvement areas from blueprint
  if (scores) {
    const sorted = Object.entries(scores).sort(([, a], [, b]) => a - b)
    const weakest = sorted[0]
    if (weakest) {
      items.push({
        type: 'growth',
        content: `Your lowest score is ${weakest[0].replace(/_/g, ' ')} (${weakest[1]}). Focus one session on this area today.`,
        priority: 'high',
      })
    }
    if (sorted.length > 1) {
      items.push({
        type: 'optimization',
        content: `${sorted[1][0].replace(/_/g, ' ')} scores ${sorted[1][1]} — a 10% gain here compounds quickly.`,
        priority: 'medium',
      })
    }
  } else if (!a?.moonPhase) {
    // Only add this generic suggestion if we haven't already filled the slot
    items.push({ type: 'action', content: 'Complete your Blueprint Assessment to unlock personalized suggestions', priority: 'high' })
  }

  // 5. Pending tasks from essence_intelligence
  const pendingTasks = tasks?.filter(t => t.content) ?? []
  if (pendingTasks.length > 0) {
    items.push({
      type: 'action',
      content: `Continue: "${pendingTasks[0].content.slice(0, 80)}${pendingTasks[0].content.length > 80 ? '...' : ''}"`,
      priority: 'medium',
    })
  }

  // 6. Gate-specific suggestion from GATE_SUGGESTIONS
  if (items.length < 5) {
    const gs = GATE_SUGGESTIONS[gateNum]
    if (gs) {
      const suggestionIndex = Math.abs(seedNum) % gs.length
      items.push({
        type: 'focus',
        content: gs[suggestionIndex],
        priority: 'low',
      })
    }
  }

  // 7. Fill remaining slots
  const fillers = [
    { type: 'habit' as const, content: 'Take a 5-minute reset between deep work blocks', priority: 'low' as const },
    { type: 'brand' as const, content: 'Your authentic voice is your strongest marketing asset', priority: 'low' as const },
    { type: 'timing' as const, content: 'Schedule creative work for your peak energy window', priority: 'medium' as const },
    { type: 'optimization' as const, content: 'Review yesterday\'s key insights and extract patterns', priority: 'medium' as const },
    { type: 'habit' as const, content: 'Log one insight before end of day', priority: 'low' as const },
    { type: 'brand' as const, content: 'Share one piece of original thinking today', priority: 'low' as const },
  ]

  while (items.length < 4) {
    items.push(fillers[items.length % fillers.length])
  }

  items.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 }
    return (p[a.priority] ?? 3) - (p[b.priority] ?? 3)
  })

  // Daily question: use ARCHETYPE_QUESTIONS or GENERIC_QUESTIONS
  let dailyQuestion: string
  if (archetype && ARCHETYPE_QUESTIONS[archetype]) {
    const qs = ARCHETYPE_QUESTIONS[archetype]
    dailyQuestion = qs[Math.abs(seedNum) % qs.length]
  } else if (n?.lifePath) {
    dailyQuestion = GENERIC_QUESTIONS[Math.abs(seedNum + n.lifePath.value) % GENERIC_QUESTIONS.length]
  } else {
    dailyQuestion = GENERIC_QUESTIONS[Math.abs(seedNum) % GENERIC_QUESTIONS.length]
  }

  return {
    items: items.slice(0, 6),
    dailyQuestion,
  }
}

// ── POST handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId, userRole, context } = await req.json()
    const provider = await getProvider()

    let result: { items: EssenceItem[]; dailyQuestion: string } | null = null
    let usedProvider: string = provider

    // Fetch blueprint scores, lens data, and pending tasks for personalized fallback
    let scores: Record<string, number> | undefined
    let archetypeName: string | undefined
    let pendingTasks: { content: string; type: string }[] | undefined
    let recentMemories: string[] = []
    let lensContext = ''
    let lensAstro: any = undefined
    let lensNumer: any = undefined

    try {
      const { query } = await import('@/lib/db')
      if (userId) {
        // Multi-lens data from client_twins metadata
        const twinRes = await query(
          `SELECT metadata FROM client_twins WHERE client_id = $1 LIMIT 1`,
          [userId]
        )
        const meta = twinRes.rows[0]?.metadata

        // Legacy blueprint data
        if (meta?.blueprint?.core?.scores) {
          scores = meta.blueprint.core.scores
          archetypeName = meta.blueprint.core.archetype
        }

        // New multi-lens data
        const lenses = meta?.lenses

        // Extract raw lens data for local generator
        lensAstro = lenses?.astrology?.data
        lensNumer = lenses?.numerology?.data

        // ── Western Astrology ──
        if (lensAstro) {
          const a = lensAstro
          const parts: string[] = ['[Western Astrology]']
          if (a.sunSign) parts.push(`Sun ${a.sunSign}`)
          if (a.moonSign) parts.push(`Moon ${a.moonSign}`)
          if (a.risingSign) parts.push(`Rising ${a.risingSign}`)
          if (a.elementCounts) parts.push(`Elements ${a.elementCounts.fire}F/${a.elementCounts.earth}E/${a.elementCounts.air}A/${a.elementCounts.water}W`)
          if (a.aspects?.length) {
            const topAspects = a.aspects.slice(0, 3).map((asp: any) => `${asp.planet1} ${asp.type} ${asp.planet2}`)
            parts.push(`Key aspects ${topAspects.join(', ')}`)
          }
          lensContext += parts.join('. ') + '\n'
        }

        // ── Vedic Astrology ──
        if (lenses?.vedicAstrology?.data) {
          const v = lenses.vedicAstrology.data
          const parts: string[] = ['[Vedic Astrology]']
          if (v.sunSign) parts.push(`Sun ${v.sunSign}`)
          if (v.moonSign) parts.push(`Moon ${v.moonSign} in ${v.moonNakshatra || ''}`)
          if (v.risingSign) parts.push(`Rising ${v.risingSign}`)
          if (v.tattvas) parts.push(`Doshas Vata ${v.tattvas.vata}%/Pitta ${v.tattvas.pitta}%/Kapha ${v.tattvas.kapha}%`)
          lensContext += parts.join('. ') + '\n'
        }

        // ── Numerology ──
        if (lenses?.numerology?.data) {
          const n = lenses.numerology.data
          const parts: string[] = ['[Numerology]']
          if (n.lifePath) parts.push(`Life Path ${n.lifePath.label}`)
          if (n.expression) parts.push(`Expression ${n.expression.label}`)
          if (n.heartsDesire) parts.push(`Heart's Desire ${n.heartsDesire.label}`)
          if (n.personalYear) parts.push(`Personal Year ${n.personalYear}/${n.personalMonth}/${n.personalDay}`)
          if (n.karmicLessons?.length) parts.push(`Karmic Lessons ${n.karmicLessons.join(', ')}`)
          lensContext += parts.join('. ') + '\n'
        }

        // ── Chinese Zodiac ──
        if (lenses?.chineseZodiac?.data) {
          const cz = lenses.chineseZodiac.data
          lensContext += `[Chinese Zodiac] ${cz.animal} (${cz.element} ${cz.yinYang}). ${cz.personality}\n`
        }

        // ── Biorhythms ──
        if (lenses?.biorhythms?.data) {
          const b = lenses.biorhythms.data
          lensContext += `[Biorhythms] Physical ${b.today.physicalScore > 0 ? '+' : ''}${b.today.physicalScore}% | Emotional ${b.today.emotionalScore > 0 ? '+' : ''}${b.today.emotionalScore}% | Intellectual ${b.today.intellectualScore > 0 ? '+' : ''}${b.today.intellectualScore}%\n`
          if (b.overall?.interpretation) {
            lensContext += `Biorhythm overall: ${b.overall.interpretation}\n`
          }
        }

        // ── Elemental Archetype ──
        if (lenses?.elementalArchetype?.data) {
          const ea = lenses.elementalArchetype.data
          lensContext += `[Elemental] Primary ${ea.primaryElement}, Secondary ${ea.secondaryElement}. Temperament: ${ea.temperament}. ${ea.expressionStyle}\n`
        }

        // ── Life Theme ──
        if (lenses?.lifeTheme?.data) {
          const lt = lenses.lifeTheme.data
          lensContext += `[Life Theme] ${lt.soulPurpose}. Current stage: ${lt.lifeStage.current} — ${lt.lifeStage.description}\n`
          if (lt.missionStatement) {
            lensContext += `Mission: ${lt.missionStatement}\n`
          }
        }

        // ── Human Design ──
        if (lenses?.humanDesign?.data) {
          const hd = lenses.humanDesign.data
          const parts: string[] = ['[Human Design]']
          if (hd.archetype) parts.push(`Archetype ${hd.archetype}`)
          if (hd.foundation?.energyType) parts.push(`Type ${hd.foundation.energyType}`)
          if (hd.foundation?.operatingRhythm) parts.push(`Strategy ${hd.foundation.operatingRhythm}`)
          if (hd.gates?.sun?.keyword) parts.push(`Sun Gate ${hd.gates.sun.keyword}`)
          lensContext += parts.join('. ') + '\n'
        } else if (archetypeName) {
          lensContext += `[Human Design] Archetype: ${archetypeName}\n`
        }

        // Pending essence intelligence tasks (up to 3)
        try {
          const tasksRes = await query(
            `SELECT content, type FROM essence_intelligence WHERE client_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 3`,
            [userId]
          )
          pendingTasks = tasksRes.rows
        } catch {}
      }
    } catch {
      // Non-critical — fallback works without DB
    }

    // Fetch recent memories from ai_memories (try Supabase as fallback)
    try {
      const { createClient: createSupabaseClient } = await import('@/lib/supabase/server')
      const supabase = await createSupabaseClient()
      const { data: memories } = await supabase
        .from('ai_memories')
        .select('content, memory_type')
        .eq('entity_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (memories?.length) {
        recentMemories = memories.map(m => `[${m.memory_type}] ${m.content}`)
      }
    } catch {
      // Non-critical
    }

    // Keep lens data objects accessible for local generator
    const lensData = {
      astrology: lensAstro,
      numerology: lensNumer,
    }

    // Build prompt with rich multi-lens context
    const memoryBlock = recentMemories.length > 0
      ? `\nRecent memories:\n${recentMemories.join('\n')}`
      : ''

    const prompt = `Generate a daily Essence Board for a ${userRole ?? 'user'} in the Evolved Eden intelligence ecosystem.
${context ? `\nUser context: ${context}` : ''}
${lensContext ? `\nProfile data:\n${lensContext}` : ''}
${userId ? `\nUser ID: ${userId}` : ''}${memoryBlock}`

    // Try the configured provider
    switch (provider) {
      case 'openai':
        result = await generateWithOpenAI(prompt)
        usedProvider = 'openai'
        break
      case 'anthropic':
        result = await generateWithAnthropic(prompt)
        usedProvider = 'anthropic'
        break
      case 'openrouter':
        result = await generateWithOpenAI(prompt, 'openrouter')
        usedProvider = 'openrouter'
        break
      case 'local':
        result = generateLocal(userRole || 'user', context || '', scores, archetypeName, pendingTasks, recentMemories, lensData)
        usedProvider = 'local'
        break
      case 'disabled':
        result = generateLocal(userRole || 'user', context || '', scores, archetypeName, pendingTasks, recentMemories, lensData)
        usedProvider = 'local'
        break
    }

    // If AI generation failed, fall back to deterministic
    if (!result || !result.items?.length) {
      result = generateLocal(userRole || 'user', context || '', scores, archetypeName, pendingTasks, recentMemories, lensData)
      usedProvider = 'local-fallback'
    }

    return NextResponse.json({ ...result, provider: usedProvider })
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
