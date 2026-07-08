import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIKey, getAnthropicKey, getEssenceProvider, getEssenceModel } from '@/lib/config'

// ── Types ──────────────────────────────────────────────────────────
type AIProvider = 'openai' | 'anthropic' | 'openrouter' | 'local' | 'disabled'
type EssenceItem = { type: string; content: string; priority: 'high' | 'medium' | 'low' }

// ── Fallback (always available) ────────────────────────────────────
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

const SYSTEM_PROMPT = `You are the Essence Board generator for Evolved Eden. Generate a daily intelligence brief.

Return valid JSON only, no other text:
{
  "items": [
    { "type": "focus|optimization|timing|opportunity|growth|brand|habit|action", "content": "specific actionable insight", "priority": "high|medium|low" }
  ],
  "dailyQuestion": "a thought-provoking question for the user to reflect on"
}

Rules:
- Generate exactly 6 items
- Be specific and actionable, never generic
- Use the user's context if provided
- Mix priorities: 2 high, 2 medium, 2 low
- Daily question should make them think`

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
function generateLocal(userRole: string, context: string, scores?: Record<string, number>, archetype?: string, tasks?: { content: string; type: string }[]): { items: EssenceItem[]; dailyQuestion: string } {
  const items: EssenceItem[] = []

  // 1. Archetype-based focus
  if (archetype) {
    items.push({ type: 'focus', content: `Lean into your ${archetype} archetype strengths today`, priority: 'high' })
  } else {
    items.push({ type: 'focus', content: `Align your ${userRole || 'intelligence'} priorities for today`, priority: 'high' })
  }

  // 2. Low-score improvement areas from blueprint
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
  } else {
    items.push({ type: 'action', content: 'Complete your Blueprint Assessment to unlock personalized suggestions', priority: 'high' })
    items.push({ type: 'timing', content: 'Optimal engagement window: 10 AM - 2 PM', priority: 'medium' })
  }

  // 3. Pending tasks from essence_intelligence
  const pendingTasks = tasks?.filter(t => t.content) ?? []
  if (pendingTasks.length > 0) {
    items.push({
      type: 'action',
      content: `Continue: "${pendingTasks[0].content.slice(0, 80)}${pendingTasks[0].content.length > 80 ? '...' : ''}"`,
      priority: 'medium',
    })
  }

  // 4. Context-aware suggestions
  if (context) {
    if (context.toLowerCase().includes('human design') || context.toLowerCase().includes('profile')) {
      const profileMatch = context.match(/Profile:\s*(\d\/\d)/)
      if (profileMatch) {
        items.push({ type: 'opportunity', content: `Your ${profileMatch[1]} profile benefits from collaborative input today`, priority: 'low' })
      }
    }
    if (context.toLowerCase().includes('gene key') || context.toLowerCase().includes('geneKeys')) {
      items.push({ type: 'growth', content: 'Explore your Gene Keys shadow-to-gift transformation path', priority: 'low' })
    }
  }

  // 5. Fill remaining slots with generic items (ensure at least 4 total)
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

  return {
    items: items.slice(0, 6),
    dailyQuestion: archetype
      ? `How did your ${archetype} archetype show up in your decisions today?`
      : "What's one decision you made today that your future self would thank you for?",
  }
}

// ── POST handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId, userRole, context } = await req.json()
    const provider = await getProvider()

    const prompt = `Generate a daily Essence Board for a ${userRole ?? 'user'} in the Evolved Eden intelligence ecosystem.
${context ? `\nUser context: ${context}` : ''}
${userId ? `\nUser ID: ${userId}` : ''}`

    let result: { items: EssenceItem[]; dailyQuestion: string } | null = null
    let usedProvider: string = provider

    // Fetch blueprint scores and pending tasks for personalized fallback
    let scores: Record<string, number> | undefined
    let archetypeName: string | undefined
    let pendingTasks: { content: string; type: string }[] | undefined

    try {
      const { query } = await import('@/lib/db')
      if (userId) {
        // Blueprint data from client_twins metadata
        const twinRes = await query(
          `SELECT metadata FROM client_twins WHERE client_id = $1 LIMIT 1`,
          [userId]
        )
        const meta = twinRes.rows[0]?.metadata
        if (meta?.blueprint?.core?.scores) {
          scores = meta.blueprint.core.scores
          archetypeName = meta.blueprint.core.archetype
        }
        // Pending essence intelligence tasks (up to 3)
        const tasksRes = await query(
          `SELECT content, type FROM essence_intelligence WHERE client_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 3`,
          [userId]
        )
        pendingTasks = tasksRes.rows
      }
    } catch {
      // Non-critical — fallback works without DB
    }

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
        result = generateLocal(userRole || 'user', context || '', scores, archetypeName, pendingTasks)
        usedProvider = 'local'
        break
      case 'disabled':
        result = generateLocal(userRole || 'user', context || '', scores, archetypeName, pendingTasks)
        usedProvider = 'local'
        break
    }

    // If AI generation failed, fall back to deterministic
    if (!result || !result.items?.length) {
      result = generateLocal(userRole || 'user', context || '', scores, archetypeName, pendingTasks)
      usedProvider = 'local-fallback'
    }

    return NextResponse.json({ ...result, provider: usedProvider })
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
