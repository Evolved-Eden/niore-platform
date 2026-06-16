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
  // Check configured provider from DB config first, then env
  const configured = (await getEssenceProvider() || '').toLowerCase() as AIProvider
  if (configured === 'openai' || configured === 'anthropic' || configured === 'openrouter' || configured === 'local' || configured === 'disabled') {
    return configured
  }
  // Auto-detect: prefer OpenRouter, then OpenAI, then Anthropic, then local
  const openrouterKey = process.env.OPENROUTER_API_KEY
  const openaiKey = await getOpenAIKey()
  const anthropicKey = await getAnthropicKey()
  if (openrouterKey) return 'openrouter'
  if (openaiKey) return 'openai'
  if (anthropicKey) return 'anthropic'
  return 'disabled' // No AI available — use curated/DB-driven fallback
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

// ── Local / deterministic generator ──────────────────────────────────
function generateLocal(userRole: string, context: string): { items: EssenceItem[]; dailyQuestion: string } {
  const roleContext = userRole || 'user'
  const items: EssenceItem[] = [
    { type: 'focus',    content: `Align your ${roleContext} intelligence priorities for today`, priority: 'high' },
    { type: 'action',   content: 'Complete one high-impact task before noon', priority: 'high' },
    { type: 'timing',   content: 'Optimal engagement window: 10 AM - 2 PM', priority: 'medium' },
    { type: 'optimization', content: 'Review yesterday\'s key insights and extract patterns', priority: 'medium' },
    { type: 'growth',   content: 'Identify one skill to develop this week', priority: 'low' },
    { type: 'brand',    content: 'Your authentic voice is your strongest asset', priority: 'low' },
  ]

  return {
    items,
    dailyQuestion: "What's one decision you made today that your future self would thank you for?",
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
        result = generateLocal(userRole || 'user', context || '')
        usedProvider = 'local'
        break
      case 'disabled':
        result = generateLocal(userRole || 'user', context || '')
        usedProvider = 'local'
        break
    }

    // If AI generation failed, fall back to deterministic
    if (!result || !result.items?.length) {
      result = generateLocal(userRole || 'user', context || '')
      usedProvider = 'local-fallback'
    }

    return NextResponse.json({ ...result, provider: usedProvider })
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
