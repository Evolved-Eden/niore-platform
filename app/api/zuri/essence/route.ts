import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIKey, getAnthropicKey, getEssenceProvider, getEssenceModel } from '@/lib/config'
import { runAgentByAgentId } from '@/lib/agents'

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
  range: 'daily' as const,
  topFive: [] as string[],
  numerology: null,
  color: null,
  modality: null,
  crystals: [] as { name: string; reason: string }[],
  postingTime: null,
  businessMove: null,
  personality: 'Complete your Blueprint Assessment to unlock your personality read.',
  blueprint: { tier: 'base' as const, agentsUsed: [] as string[], content: 'Complete your Blueprint Assessment to unlock this tile.' },
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


// ── Factual lens-derived lookups (always computed, not AI-dependent) ──
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
  cardinal: 'You initiate — you\'re built to start things, not just maintain them',
  fixed: 'You sustain — you\'re built to see things through once you commit',
  mutable: 'You adapt — you\'re built to flex and adjust faster than most',
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
  1: { window: '8-10 AM', reason: 'lead with something new — this energy favors first moves' },
  2: { window: '12-1 PM', reason: 'conversational, community-building content lands best' },
  3: { window: '2-4 PM', reason: 'creative and visual content performs best under this energy' },
  4: { window: '7-9 AM', reason: 'practical, how-to content resonates with this grounded energy' },
  5: { window: '6-8 PM', reason: 'bold, attention-grabbing content matches this restless energy' },
  6: { window: '11 AM-1 PM', reason: 'relationship and community content lands under this energy' },
  7: { window: '8-10 PM', reason: 'thoughtful, reflective content fits this introspective window' },
  8: { window: '9-11 AM', reason: 'authority and results-driven content lands under this energy' },
  9: { window: '3-5 PM', reason: 'wrap-up and highlight content fits this completion energy' },
}

const BUSINESS_MOVE_BY_HD_TYPE: Record<string, string> = {
  Generator: "Respond, don't initiate — say yes to what excites you rather than pitching cold today.",
  'Manifesting Generator': 'Move fast on what lights you up, but inform others before you pivot.',
  Projector: 'Wait for recognition or invitation before pitching — make your expertise visible instead of chasing.',
  Manifestor: 'Initiate boldly today, but inform key stakeholders before you act.',
  Reflector: 'Sample the field before committing — check in with 1-2 trusted advisors before deciding.',
}
const BUSINESS_MOVE_DEFAULT = 'Focus on your single highest-leverage business action today rather than spreading across many.'

const PERSONALITY_BLURBS: Record<string, string> = {
  'The Pioneer': "You lead by going first — your gift is crossing frontiers before there's a map.",
  'The Sage': 'You lead through wisdom — people come to you to make sense of things.',
  'The Alchemist': 'You transform what you touch — raw material becomes something new in your hands.',
  'The Strategist': 'You see the board three moves ahead — your gift is clarity under complexity.',
  'The Connector': "You build bridges — your network is your superpower, and you know it.",
  'The Architect': 'You build what lasts — structure and systems are where you do your best work.',
  'The Visionary': "You see what doesn't exist yet — and you can't help but build toward it.",
  'The Guardian': 'You protect what matters — your strength shows up most when others need it.',
  'The Catalyst': 'You move things that are stuck — change follows you into a room.',
  'The Weaver': 'You integrate — your gift is finding the thread that ties everything together.',
  'The Seeker': "You're driven by the question, not the answer — curiosity is your engine.",
  'The Harmonizer': 'You find the balance point — peace, for you, is an active skill, not passivity.',
  'The Artisan': 'You refine — craft and mastery matter more to you than speed.',
  'The Navigator': "You course-correct fast — you'd rather adjust than stay stuck on the wrong path.",
  'The Amplifier': 'You make things louder in the best way — momentum builds around you.',
  'The Cultivator': 'You grow things patiently — you play the long game better than most.',
}

/** Always-computed factual extras for the Essence Board — grounded in the
 * person's real astrology/numerology/human-design data (not AI-dependent),
 * so these stay correct and genuinely change day-to-day / week-to-week /
 * month-to-month rather than looping a fixed template pool. */
function computeLensExtras(
  lensAstro: any,
  lensNumer: any,
  hdType: string | undefined,
  archetype: string | undefined,
  range: 'daily' | 'weekly' | 'monthly',
  seedNum: number
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

  const crystalNum = numNumber ? ((numNumber - 1) % 9) + 1 : (Math.abs(seedNum) % 9) + 1
  const crystals = [CRYSTAL_BY_NUMBER[crystalNum] ?? CRYSTAL_BY_NUMBER[1]]

  const postNum = numNumber ? ((numNumber - 1) % 9) + 1 : (Math.abs(seedNum) % 9) + 1
  const postingTime = POSTING_TIME_BY_NUMBER[postNum] ?? POSTING_TIME_BY_NUMBER[1]

  const businessMove = {
    action: hdType ? (BUSINESS_MOVE_BY_HD_TYPE[hdType] ?? BUSINESS_MOVE_DEFAULT) : BUSINESS_MOVE_DEFAULT,
    hdType: hdType ?? null,
  }

  const personality = archetype && PERSONALITY_BLURBS[archetype]
    ? PERSONALITY_BLURBS[archetype]
    : sunSign
      ? `A ${sunSign} Sun${lensAstro?.moonSign ? ` with ${lensAstro.moonSign} Moon` : ''} — complete your Blueprint Assessment for a full personality read.`
      : 'Complete your Blueprint Assessment to unlock your personality read.'

  return { numerology, color, modality, crystals, postingTime, businessMove, personality }
}

/** Blueprint essence tile — literally calls the Blueprint agent(s) via the
 * agent-execution system (lib/agents.ts), tier-gated: base tier gets the
 * Blueprint Strategist (AGT-007) only; Enhanced/Expanded tiers get both
 * the Strategist and the Soul Blueprint Agent (AGT-212), with Enhanced
 * limited to a shorter combined read and Expanded getting the full output. */
async function generateBlueprintTile(meta: any, range: 'daily' | 'weekly' | 'monthly') {
  const enhanced = !!meta?.blueprint_enhanced
  const expanded = !!meta?.blueprint_expanded
  const tier: 'base' | 'enhanced' | 'expanded' = expanded ? 'expanded' : enhanced ? 'enhanced' : 'base'
  const core = meta?.blueprint?.core

  const horizon = range === 'monthly' ? 'this month' : range === 'weekly' ? 'this week' : 'today'
  const inputPrompt = `Give the user one focused, specific, actionable blueprint insight for ${horizon}, grounded in their profile — not generic advice. Archetype: ${core?.archetype || 'unknown'}. Overall score: ${core?.overallScore ?? 'n/a'}. Section scores: ${core?.scores ? JSON.stringify(core.scores) : 'n/a'}. Keep it to 2-4 sentences.`

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
      content: core?.summary || core?.archetype
        ? `Your saved blueprint summary: ${core?.summary || core?.archetype}`
        : 'Complete your Blueprint Assessment to unlock this tile.',
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
            .from('essence_intelligence')
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

    // Try the configured provider — wrapped in try-catch so AI errors
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

    // ── Always-computed factual extras (numerology/color/modality/crystals/
    // posting time/business move/personality) — grounded in real lens data,
    // independent of which AI provider (if any) generated the core items.
    const daySeed = new Date().toISOString().slice(0, 10)
    const seedNum = daySeed.split('-').reduce((s, p) => s + parseInt(p), 0)
    const extras = computeLensExtras(lensAstro, lensNumer, hdType, archetypeName, range, seedNum)
    const topFive = (result.items || []).slice(0, 5).map(i => i.content)

    // ── Blueprint tile — literally calls the Blueprint agent(s) via the
    // agent-execution system, tier-gated by the person's purchased level.
    let blueprintTile
    try {
      blueprintTile = await generateBlueprintTile(twinMeta, range)
    } catch (e) {
      console.error('Essence: blueprint tile generation failed:', e)
      blueprintTile = { tier: 'base' as const, agentsUsed: [] as string[], content: 'Blueprint tile temporarily unavailable.' }
    }

    // ── Purchased Domain Modules -> permanent recurring essence categories.
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
      blueprint: blueprintTile,
      domainTiles,
    })
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
