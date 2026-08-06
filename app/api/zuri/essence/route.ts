import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIKey, getAnthropicKey, getEssenceProvider, getEssenceModel } from '@/lib/config'
import { runAgentByAgentId } from '@/lib/agents'

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type AIProvider = 'openai' | 'anthropic' | 'openrouter' | 'local' | 'disabled'
type EssenceItem = { type: string; content: string; priority: 'high' | 'medium' | 'low' }

// â”€â”€ Fallback (always available, last resort) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// No fabricated content: an empty board. Tiles only ever populate from real
// lens data â€” nothing is invented when the client hasn't completed intake.
const FALLBACK = {
  items: [] as EssenceItem[],
  dailyQuestion: '',
  provider: 'fallback' as const,
  range: 'daily' as const,
  topFive: [] as string[],
  numerology: null,
  color: null,
  modality: null,
  crystals: [] as { name: string; reason: string }[],
  postingTime: null,
  businessMove: null,
  personality: null,
  essenceProfile: null,
}

// â”€â”€ Archetype-specific daily questions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Factual lens-derived lookups (always computed, not AI-dependent) â”€â”€
// These ground the new Essence categories in real astrological/numerological
// facts rather than static templates, so they change day-to-day with the
// person's actual numerology day/month/year number and stay correct for
// stable natal traits (sun-sign modality, sun-sign color) that shouldn't
// change day to day.
const MODALITY_BY_SIGN: Record<string, 'cardinal' | 'fixed' | 'mutable'> = {
  Aries: 'cardinal', Cancer: 'cardinal', Libra: 'cardinal', Capricorn: 'cardinal',
  Taurus: 'fixed', Leo: 'fixed', Scorpio: 'fixed', Aquarius: 'fixed',
  Gemini: 'mutable', Virgo: 'mutable', Sagittarius: 'mutable', Pisces: 'mutable',
}

const MODALITY_MEANING: Record<'cardinal' | 'fixed' | 'mutable', string> = {
  cardinal: 'You initiate â€” you\'re built to start things, not just maintain them',
  fixed: 'You sustain â€” you\'re built to see things through once you commit',
  mutable: 'You adapt â€” you\'re built to flex and adjust faster than most',
}

const COLOR_BY_SIGN: Record<string, { name: string; hex: string }> = {
  Aries: { name: 'Red', hex: '#E63946' },
  Taurus: { name: 'Emerald Green', hex: '#2A9D8F' },
  Gemini: { name: 'Yellow', hex: '#F4D35E' },
  Cancer: { name: 'Silver', hex: '#C0C0C0' },
  Leo: { name: 'Gold', hex: '#FFB703' },
  Virgo: { name: 'Slate Grey', hex: '#5C6B73' },
  Libra: { name: 'Rose Pink', hex: '#F4A6B7' },
  Scorpio: { name: 'Maroon', hex: '#6A040F' },
  Sagittarius: { name: 'Royal Purple', hex: '#7B2CBF' },
  Capricorn: { name: 'Deep Brown', hex: '#4A3728' },
  Aquarius: { name: 'Electric Blue', hex: '#0077B6' },
  Pisces: { name: 'Sea Green', hex: '#40916C' },
}

const CRYSTAL_BY_NUMBER: Record<number, { name: string; reason: string }> = {
  1: { name: 'Citrine', reason: 'supports new beginnings and personal leadership' },
  2: { name: 'Moonstone', reason: 'supports intuition and balance in partnership' },
  3: { name: 'Carnelian', reason: 'supports creative expression and confidence' },
  4: { name: 'Hematite', reason: 'supports grounding and steady structure' },
  5: { name: 'Turquoise', reason: 'supports adaptability and healthy change' },
  6: { name: 'Rose Quartz', reason: 'supports love, care, and harmony' },
  7: { name: 'Amethyst', reason: 'supports reflection and spiritual insight' },
  8: { name: "Tiger's Eye", reason: 'supports personal power and abundance' },
  9: { name: 'Clear Quartz', reason: 'supports clarity and completion' },
}

const POSTING_TIME_BY_NUMBER: Record<number, { window: string; reason: string }> = {
  1: { window: '8-10 AM', reason: 'lead with something new â€” this energy favors first moves' },
  2: { window: '12-1 PM', reason: 'conversational, community-building content lands best' },
  3: { window: '2-4 PM', reason: 'creative and visual content performs best under this energy' },
  4: { window: '7-9 AM', reason: 'practical, how-to content resonates with this grounded energy' },
  5: { window: '6-8 PM', reason: 'bold, attention-grabbing content matches this restless energy' },
  6: { window: '11 AM-1 PM', reason: 'relationship and community content lands under this energy' },
  7: { window: '8-10 PM', reason: 'thoughtful, reflective content fits this introspective window' },
  8: { window: '9-11 AM', reason: 'authority and results-driven content lands under this energy' },
  9: { window: '3-5 PM', reason: 'wrap-up and highlight content fits this completion energy' },
}

const BUSINESS_MOVE_BY_HD_TYPE: Record<string, string> = {  Generator: "Respond, don't initiate â€” say yes to what excites you rather than pitching cold today.",
  'Manifesting Generator': 'Move fast on what lights you up, but inform others before you pivot.',
  Projector: 'Wait for recognition or invitation before pitching â€” make your expertise visible instead of chasing.',
  Manifestor: 'Initiate boldly today, but inform key stakeholders before you act.',
  Reflector: 'Sample the field before committing â€” check in with 1-2 trusted advisors before deciding.',
}
// (BUSINESS_MOVE_DEFAULT removed â€” no fabricated fallbacks)

const PERSONALITY_BLURBS: Record<string, string> = {
  'The Pioneer': "You lead by going first â€” your gift is crossing frontiers before there's a map.",
  'The Sage': 'You lead through wisdom â€” people come to you to make sense of things.',
  'The Alchemist': 'You transform what you touch â€” raw material becomes something new in your hands.',
  'The Strategist': 'You see the board three moves ahead â€” your gift is clarity under complexity.',
  'The Connector': "You build bridges â€” your network is your superpower, and you know it.",
  'The Architect': 'You build what lasts â€” structure and systems are where you do your best work.',
  'The Visionary': "You see what doesn't exist yet â€” and you can't help but build toward it.",
  'The Guardian': 'You protect what matters â€” your strength shows up most when others need it.',
  'The Catalyst': 'You move things that are stuck â€” change follows you into a room.',
  'The Weaver': 'You integrate â€” your gift is finding the thread that ties everything together.',
  'The Seeker': "You're driven by the question, not the answer â€” curiosity is your engine.",
  'The Harmonizer': 'You find the balance point â€” peace, for you, is an active skill, not passivity.',
  'The Artisan': 'You refine â€” craft and mastery matter more to you than speed.',
  'The Navigator': "You course-correct fast â€” you'd rather adjust than stay stuck on the wrong path.",
  'The Amplifier': 'You make things louder in the best way â€” momentum builds around you.',
  'The Cultivator': 'You grow things patiently â€” you play the long game better than most.',
}

/** Always-computed factual extras for the Essence Board â€” grounded in the
 * person's real astrology/numerology/human-design data (not AI-dependent),
 * so these stay correct and genuinely change day-to-day / week-to-week /
 * month-to-month rather than looping a fixed template pool. */
function computeLensExtras(
  lensAstro: any,
  lensNumer: any,
  hdType: string | undefined,
  archetype: string | undefined,
  range: 'daily' | 'weekly' | 'monthly',
  _seedNum: number
) {
  const sunSign: string | undefined = lensAstro?.sunSign

  const modalityType = sunSign ? MODALITY_BY_SIGN[sunSign] : undefined
  const modality = modalityType
    ? { type: modalityType, sign: sunSign, reason: MODALITY_MEANING[modalityType] }
    : null

  const color = sunSign && COLOR_BY_SIGN[sunSign]
    ? { ...COLOR_BY_SIGN[sunSign], reason: `Your ${sunSign} Sun's signature color` }
    : null

  // Which numerology number applies depends on the time horizon being viewed
  const numNumber: number | undefined =
    range === 'monthly' ? lensNumer?.personalYear
    : range === 'weekly' ? lensNumer?.personalMonth
    : lensNumer?.personalDay
  const numberLabel = range === 'monthly' ? 'Personal Year' : range === 'weekly' ? 'Personal Month' : 'Personal Day'
  const numerology = numNumber
    ? { number: numNumber, label: `${numberLabel} ${numNumber}`, range }
    : null

  const crystalNum = numNumber ? ((numNumber - 1) % 9) + 1 : null
  const crystals = crystalNum ? [CRYSTAL_BY_NUMBER[crystalNum] ?? CRYSTAL_BY_NUMBER[1]] : []

  const postNum = numNumber ? ((numNumber - 1) % 9) + 1 : null
  const postingTime = postNum ? (POSTING_TIME_BY_NUMBER[postNum] ?? null) : null

  const businessMove = hdType && BUSINESS_MOVE_BY_HD_TYPE[hdType]
    ? { action: BUSINESS_MOVE_BY_HD_TYPE[hdType], hdType }
    : null

  const personality = archetype && PERSONALITY_BLURBS[archetype]
    ? PERSONALITY_BLURBS[archetype]
    : sunSign
      ? `A ${sunSign} Sun${lensAstro?.moonSign ? ` with ${lensAstro.moonSign} Moon` : ''}`
      : null

  return { numerology, color, modality, crystals, postingTime, businessMove, personality }
}

/** Blueprint essence tile â€” literally calls the Blueprint agent(s) via the
 * agent-execution system (lib/agents.ts), tier-gated: base tier gets the
 * Blueprint Strategist (AGT-007) only; Enhanced/Expanded tiers get both
 * the Strategist and the Soul Blueprint Agent (AGT-212), with Enhanced
 * limited to a shorter combined read and Expanded getting the full output. */
async function generateBlueprintTile(meta: any, range: 'daily' | 'weekly' | 'monthly') {
  const enhanced = !!meta?.essence_assessment_enhanced
  const expanded = !!meta?.essence_assessment_expanded
  const tier: 'base' | 'enhanced' | 'expanded' = expanded ? 'expanded' : enhanced ? 'enhanced' : 'base'
  const core = meta?.lenses?.humanDesign?.data
  if (!core) return null

  const horizon = range === 'monthly' ? 'this month' : range === 'weekly' ? 'this week' : 'today'
  const inputPrompt = `Give the user one focused, specific, actionable blueprint insight for ${horizon}, grounded in their profile â€” not generic advice. Archetype: ${core?.archetype || 'unknown'}. Overall score: ${core?.overallScore ?? 'n/a'}. Section scores: ${core?.scores ? JSON.stringify(core.scores) : 'n/a'}. Keep it to 2-4 sentences.`

  const agentIds = tier === 'base' ? ['AGT-007'] : ['AGT-007', 'AGT-212']
  const outputs: { agentId: string; agentName: string; text: string }[] = []

  for (const id of agentIds) {
    try {
      const { agent, output } = await runAgentByAgentId(id, inputPrompt)
      const text = tier === 'enhanced' ? String(output).slice(0, 420) : String(output)
      outputs.push({ agentId: id, agentName: agent.agent_name || id, text })
    } catch (e) {
      console.error(`Blueprint tile: agent ${id} failed:`, e)
    }
  }

  if (outputs.length === 0) {
    return {
      tier,
      agentsUsed: [] as string[],
      content: core?.summary || core?.archetype || '',
      upgradeMessage: tier === 'base' ? 'Upgrade to Enhanced or Expanded Blueprint for deeper, dual-agent insight.' : undefined,
    }
  }

  return {
    tier,
    agentsUsed: outputs.map(o => o.agentName),
    content: outputs.map(o => o.text).join('\n\n'),
    upgradeMessage: tier === 'base' ? 'Upgrade to Enhanced or Expanded Blueprint for deeper, dual-agent insight.' : undefined,
  }
}

const SYSTEM_PROMPT = `You are the Essence Board generator for Evolved Eden â€” a multi-lens human intelligence engine.

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

// â”€â”€ Detect which AI provider to use â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // DB config unavailable â€” ignore
  }
  return 'disabled' // No AI available â€” use deterministic fallback
}

// â”€â”€ OpenAI / OpenRouter generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Anthropic generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Local / DB-driven generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// The EE engine produces "<Modifier> <Primary>" archetype names (e.g.
// "Primal Explorer", "Luminous Sage") from 16 fixed primaries. Map each
// primary to the closest daily-question set so every client -- not just the
// handful whose exact archetype name collides with an ARCHETYPE_QUESTIONS key
// -- gets a real daily question from their Human Design data.
const ARCHETYPE_QUESTION_KEY_BY_PRIMARY: Record<string, string> = {
  Innovator: 'The Alchemist',
  Builder: 'The Architect',
  Mentor: 'The Sage',
  Explorer: 'The Seeker',
  Catalyst: 'The Catalyst',
  Strategist: 'The Strategist',
  Architect: 'The Architect',
  Navigator: 'The Navigator',
  Alchemist: 'The Alchemist',
  Weaver: 'The Weaver',
  Pioneer: 'The Pioneer',
  Oracle: 'The Visionary',
  Artisan: 'The Artisan',
  Harmonizer: 'The Harmonizer',
  Visionary: 'The Visionary',
  Sage: 'The Sage',
}

function resolveArchetypeQuestionKey(archetype: string): string | undefined {
  if (ARCHETYPE_QUESTIONS[archetype]) return archetype
  const primary = archetype.trim().split(/\s+/).pop() || ''
  return primary ? ARCHETYPE_QUESTION_KEY_BY_PRIMARY[primary] : undefined
}

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

  // 1. Archetype-based focus
  if (archetype) {
    items.push({ type: 'focus', content: `Lean into your ${archetype} archetype strengths today`, priority: 'high' })
  } else {
    items.push({ type: 'focus', content: `Align your ${userRole || 'intelligence'} priorities for today`, priority: 'high' })
  }

  // 2. Astrology-based suggestion (if available)
  if (a?.moonPhase && a?.sunSign) {
    const moonSuggestions: Record<string, string> = {
      'New Moon': 'New moon energy â€” ideal for setting intentions and starting fresh initiatives',
      'Waxing Crescent': 'Waxing crescent â€” momentum is building. Take visible action on your goals',
      'First Quarter': 'First quarter moon â€” push through resistance. Challenges are clearing the path',
      'Waxing Gibbous': 'Waxing gibbous â€” refine and adjust. What you\'re building needs one more polish',
      'Full Moon': 'Full moon â€” harvest time. Celebrate progress and release what no longer serves',
      'Waning Gibbous': 'Waning gibbous â€” share your wisdom. Teaching others consolidates your mastery',
      'Last Quarter': 'Last quarter â€” release and forgive. Letting go creates space for the new',
      'Waning Crescent': 'Waning crescent â€” rest and integrate. The next cycle begins soon',
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
          content: `Transit alert: ${planet} ${data.aspecting[0]} â€” a window for aligned action`,
          priority: data.aspecting[0]?.includes('opposition') || data.aspecting[0]?.includes('square') ? 'high' : 'low',
        })
      }
    }
  }

  // 3. Numerology-based suggestion
  if (n?.personalYear) {
    const yearMeanings: Record<number, string> = {
      1: 'Personal Year 1 â€” new beginnings. Start the project you\'ve been planning',
      2: 'Personal Year 2 â€” patience and partnership. Collaborate rather than push',
      3: 'Personal Year 3 â€” creative expression. Share your ideas and connect socially',
      4: 'Personal Year 4 â€” build foundations. Discipline and structure pay off now',
      5: 'Personal Year 5 â€” embrace change. Freedom and variety are the themes',
      6: 'Personal Year 6 â€” nurture relationships. Home, family, and responsibility call',
      7: 'Personal Year 7 â€” go inward. Research, reflect, and recharge',
      8: 'Personal Year 8 â€” power and abundance. Your efforts manifest materially',
      9: 'Personal Year 9 â€” completion. Tie loose ends and prepare for renewal',
    }
    items.push({
      type: 'optimization',
      content: yearMeanings[n.personalYear] || `Personal Year ${n.personalYear} energy influences your decisions`,
      priority: 'medium',
    })

    // Personal Day number for micro-timing
    const dayThemes: Record<number, string> = {
      1: 'Today favors initiation â€” start something bold',
      2: 'Today favors cooperation â€” seek alignment',
      3: 'Today favors creative expression â€” share your voice',
      4: 'Today favors discipline â€” do the hard work',
      5: 'Today favors adventure â€” break your routine',
      6: 'Today favors service â€” help someone',
      7: 'Today favors reflection â€” take time to think',
      8: 'Today favors action â€” move with authority',
      9: 'Today favors completion â€” finish what you started',
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
        content: `${sorted[1][0].replace(/_/g, ' ')} scores ${sorted[1][1]} â€” a 10% gain here compounds quickly.`,
        priority: 'medium',
      })
    }
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

  // 6. Daily question â€” only when we have real profile data; otherwise empty.
  let dailyQuestion = ''
  if (archetype) {
    const qKey = resolveArchetypeQuestionKey(archetype)
    if (qKey) {
      const qs = ARCHETYPE_QUESTIONS[qKey]
      dailyQuestion = qs[Math.abs(seedNum) % qs.length]
    }
  }

  return {
    items: items.slice(0, 6),
    dailyQuestion,
  }
}

// â”€â”€ POST handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
// AUTH NOTE: this route previously had no auth check at all -- it trusted
// whatever userId was in the body, so anyone who knew or guessed a user id
// could trigger AI-cost-incurring generation and read that user's essence
// content. Every legitimate in-app caller already passes the requesting
// user's OWN id (confirmed across app/intake, app/dashboard/admin/essence,
// app/dashboard/client/essence, app/dashboard/client/profile), so the fix
// below doesn't change behavior for any of them: a logged-in session must
// match the userId it's requesting. The one legitimate exception is the
// internal scheduled workflows (WF-102/103/104, see n8n/workflows/) which
// have no browser session and iterate over many clients -- those
// authenticate instead with a shared secret header.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userRole, context } = body
    // app/dashboard/admin/essence/page.tsx sends client_id instead of userId --
    // accept both rather than silently no-op'ing on a mismatched field name.
    const userId: string | undefined = body.userId || body.client_id
    // Real context scoping: null/undefined = Personal (memories with no org
    // attached). A real organization_id = that org's context -- which
    // could be the person's Business, or a Collective they belong to, or
    // any other organization_members row. Not a fixed 3-way enum -- driven
    // by the person's actual memberships (see admin/essence/page.tsx).
    const organizationId: string | null = body.organizationId ?? null

    const internalSecret = req.headers.get('x-internal-cron-secret')
    const isInternalServiceCall =
      !!internalSecret && !!process.env.INTERNAL_CRON_SECRET && internalSecret === process.env.INTERNAL_CRON_SECRET

    if (!isInternalServiceCall) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (!sessionUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (userId && userId !== sessionUser.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const range: 'daily' | 'weekly' | 'monthly' =
      body?.range === 'weekly' || body?.range === 'monthly' ? body.range : 'daily'
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
    let hdType: string | undefined = undefined
    let twinMeta: any = undefined

    try {
      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      if (userId) {
        // Multi-lens data from client_twins metadata. Uses the admin client
        // (not the raw pg pool lib/db used to use here) so this doesn't
        // depend on a second, separately-configured DB connection -- that
        // was silently failing (bare catch, no logging) whenever DB_HOST
        // wasn't set, which is why the essence board kept falling back to
        // generic filler content even after a real intake was completed.
        const { data: twinRow, error: twinErr } = await supabaseAdmin
          .from('client_twins')
          .select('metadata')
          .eq('client_id', userId)
          .maybeSingle()
        if (twinErr) console.error('Essence: failed to fetch client_twins metadata:', twinErr)
        const meta = twinRow?.metadata as any
        twinMeta = meta

        // Human Design lens data (consolidated storage -- Round 32 item 2)
        if (meta?.lenses?.humanDesign?.data?.scores) {
          scores = meta.lenses.humanDesign.data.scores
          archetypeName = meta.lenses.humanDesign.data.archetype
        }

        // New multi-lens data
        const lenses = meta?.lenses

        // Extract raw lens data for local generator
        lensAstro = lenses?.astrology?.data
        lensNumer = lenses?.numerology?.data

        // â”€â”€ Western Astrology â”€â”€
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

        // â”€â”€ Vedic Astrology â”€â”€
        if (lenses?.vedicAstrology?.data) {
          const v = lenses.vedicAstrology.data
          const parts: string[] = ['[Vedic Astrology]']
          if (v.sunSign) parts.push(`Sun ${v.sunSign}`)
          if (v.moonSign) parts.push(`Moon ${v.moonSign} in ${v.moonNakshatra || ''}`)
          if (v.risingSign) parts.push(`Rising ${v.risingSign}`)
          if (v.tattvas) parts.push(`Doshas Vata ${v.tattvas.vata}%/Pitta ${v.tattvas.pitta}%/Kapha ${v.tattvas.kapha}%`)
          lensContext += parts.join('. ') + '\n'
        }

        // â”€â”€ Numerology â”€â”€
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

        // â”€â”€ Chinese Zodiac â”€â”€
        if (lenses?.chineseZodiac?.data) {
          const cz = lenses.chineseZodiac.data
          lensContext += `[Chinese Zodiac] ${cz.animal} (${cz.element} ${cz.yinYang}). ${cz.personality}\n`
        }

        // â”€â”€ Biorhythms â”€â”€
        if (lenses?.biorhythms?.data) {
          const b = lenses.biorhythms.data
          lensContext += `[Biorhythms] Physical ${b.today.physicalScore > 0 ? '+' : ''}${b.today.physicalScore}% | Emotional ${b.today.emotionalScore > 0 ? '+' : ''}${b.today.emotionalScore}% | Intellectual ${b.today.intellectualScore > 0 ? '+' : ''}${b.today.intellectualScore}%\n`
          if (b.overall?.interpretation) {
            lensContext += `Biorhythm overall: ${b.overall.interpretation}\n`
          }
        }

        // â”€â”€ Elemental Archetype â”€â”€
        if (lenses?.elementalArchetype?.data) {
          const ea = lenses.elementalArchetype.data
          lensContext += `[Elemental] Primary ${ea.primaryElement}, Secondary ${ea.secondaryElement}. Temperament: ${ea.temperament}. ${ea.expressionStyle}\n`
        }

        // â”€â”€ Life Theme â”€â”€
        if (lenses?.lifeTheme?.data) {
          const lt = lenses.lifeTheme.data
          lensContext += `[Life Theme] ${lt.soulPurpose}. Current stage: ${lt.lifeStage.current} â€” ${lt.lifeStage.description}\n`
          if (lt.missionStatement) {
            lensContext += `Mission: ${lt.missionStatement}\n`
          }
        }

        // â”€â”€ Human Design â”€â”€
        if (lenses?.humanDesign?.data) {
          const hd = lenses.humanDesign.data
          hdType = hd.foundation?.energyType
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
          const { data: tasksRows, error: tasksErr } = await supabaseAdmin
            .from('essintelligence_items')
            .select('content, type')
            .eq('client_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(3)
          if (tasksErr) console.error('Essence: failed to fetch pending tasks:', tasksErr)
          pendingTasks = tasksRows ?? undefined
        } catch (e) {
          console.error('Essence: pending tasks fetch threw:', e)
        }
      }
    } catch (e) {
      console.error('Essence: client_twins/lens fetch failed, using fallback:', e)
    }

    // Fetch recent memories from ai_memories (use admin client to bypass RLS)
    // Scoped by context: personal memories (organization_id IS NULL) vs a
    // specific org/collective's memories -- so a Business owner's personal
    // reflections don't bleed into their org-level essence generation.
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      let memoryQuery = supabaseAdmin
        .from('ai_memories')
        .select('content, memory_type')
        .eq('entity_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      memoryQuery = organizationId
        ? memoryQuery.eq('organization_id', organizationId)
        : memoryQuery.is('organization_id', null)

      const { data: memories } = await memoryQuery

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

    const horizonInstruction =
      range === 'monthly' ? "Time horizon: THIS MONTH. Phrase every item and the daily question for a month-long arc (use 'this month' language), and reference the person's Personal Year/Month numerology and any longer transits rather than single-day timing."
      : range === 'weekly' ? "Time horizon: THIS WEEK. Phrase every item and the daily question for a week-long arc (use 'this week' language), and reference the person's Personal Month numerology and the week's moon phase/transit movement rather than single-day timing."
      : "Time horizon: TODAY."

    const prompt = `Generate an Essence Board for a ${userRole ?? 'user'} in the Evolved Eden intelligence ecosystem.
${horizonInstruction}
${organizationId ? `\nContext: Organization/Collective-level intelligence (org id ${organizationId}) -- focus on shared, group-level priorities, not individual personal reflection.` : `\nContext: Personal intelligence -- individual priorities, not organizational.`}
${context ? `\nUser context: ${context}` : ''}
${lensContext ? `\nProfile data:\n${lensContext}` : ''}
${userId ? `\nUser ID: ${userId}` : ''}${memoryBlock}`

    // Try the configured provider â€” wrapped in try-catch so AI errors
    // fall through to generateLocal() instead of the outer catch which
    // returns the completely static FALLBACK constant.
    try {
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
    } catch (e) {
      console.error('Essence: AI provider threw, falling back to deterministic:', e)
    }

    // If AI generation failed or threw, fall back to deterministic
    if (!result || !result.items?.length) {
      result = generateLocal(userRole || 'user', context || '', scores, archetypeName, pendingTasks, recentMemories, lensData)
      usedProvider = result === null ? 'local' : 'local-fallback'
    }

    // â”€â”€ Always-computed factual extras (numerology/color/modality/crystals/
    // posting time/business move/personality) â€” grounded in real lens data,
    // independent of which AI provider (if any) generated the core items.
    const daySeed = new Date().toISOString().slice(0, 10)
    const seedNum = daySeed.split('-').reduce((s, p) => s + parseInt(p), 0)
    const extras = computeLensExtras(lensAstro, lensNumer, hdType, archetypeName, range, seedNum)
    const topFive = (result.items || []).slice(0, 5).map(i => i.content)

    // â”€â”€ Blueprint tile â€” literally calls the Blueprint agent(s) via the
    // agent-execution system, tier-gated by the person's purchased level.
    let blueprintTile
    try {
      blueprintTile = await generateBlueprintTile(twinMeta, range)
    } catch (e) {
      console.error('Essence: blueprint tile generation failed:', e)
      blueprintTile = null
    }

    // â”€â”€ Purchased Domain Modules -> permanent recurring essence categories.
    // Per owner instruction, buying a domain module isn't a one-time report;
    // once completed it shows up here permanently across all time horizons.
    const domainProfiles = twinMeta?.domainProfiles || {}
    const domainTiles = Object.values(domainProfiles).map((p: any) => ({
      domain: p.domain,
      label: p.label,
      score: p.score,
      insight: p.insights?.[Math.abs(seedNum) % Math.max(p.insights?.length ?? 1, 1)] ?? p.insights?.[0] ?? null,
    }))

    return NextResponse.json({
      ...result,
      provider: usedProvider,
      range,
      topFive,
      ...extras,
      essenceProfile: blueprintTile,
      domainTiles,
    })
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
