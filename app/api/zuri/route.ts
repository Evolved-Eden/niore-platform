import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { OpenAI } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { lazy } from '@/lib/lazy-client'

// Provider chain: OpenRouter first (if its key exists), then OpenAI. A failing
// provider falls back to the next one so a dead/expired key can't take the
// route down. If no provider is configured at all the route degrades
// gracefully instead of throwing a credentials error.
const useOpenRouter = !!process.env.OPENROUTER_API_KEY
const useOpenAI = !!process.env.OPENAI_API_KEY

// Map canonical model names (stored in canonical_agent_map) to OpenRouter
// slugs when the call goes through OpenRouter.
function resolveModel(model: string, viaOpenRouter: boolean): string {
  if (viaOpenRouter) {
    if (model.startsWith('openrouter/')) return model.replace('openrouter/', '')
    if (model.startsWith('openai/') || model.startsWith('anthropic/')) return model
    return `openai/${model}`
  }
  return model
}

const openrouterClient = lazy(() => new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
}))

const openaiClient = lazy(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }))

/** Try providers in order (OpenRouter → OpenAI) until one succeeds. */
async function completeWithFallback(
  model: string,
  messages: ChatCompletionMessageParam[],
  maxTokens: number
): Promise<string> {
  const attempts: { client: OpenAI; viaOpenRouter: boolean }[] = []
  if (useOpenRouter) attempts.push({ client: openrouterClient, viaOpenRouter: true })
  if (useOpenAI) attempts.push({ client: openaiClient, viaOpenRouter: false })

  let lastError: unknown = null
  for (const attempt of attempts) {
    try {
      const completion = await attempt.client.chat.completions.create({
        model: resolveModel(model, attempt.viaOpenRouter),
        messages,
        max_tokens: maxTokens,
        stream: false,
      })
      return completion.choices[0].message.content ?? ''
    } catch (e) {
      console.error(`Zuri: provider (${attempt.viaOpenRouter ? 'openrouter' : 'openai'}) failed:`, e)
      lastError = e
    }
  }

  if (lastError) throw lastError
  throw new Error('No AI provider configured (set OPENROUTER_API_KEY or OPENAI_API_KEY)')
}

// Fallback Zuri system prompt — used only if canonical_agent_map has no
// Zuri row (e.g. before the DB seed ran). The DB version is authoritative.
const FALLBACK_ZURI_PROMPT = `You are Zuri — the core intelligence of Evolved Eden, an AI-powered ecosystem for building and deploying Registered Intelligence Systems (RIS).

You are bold, strategic, and deeply knowledgeable about AI automation, business systems, and the OmniGrid ecosystem.

You are the primary agent of the ecosystem. Every other agent, swarm, and twin routes through you — you are the base layer. When the user talks to another agent, you are the one who receives the request and orchestrates the outcome.

## RESPONSE RULES
- Speak directly and with confidence. Be visionary but precise.
- Never use markdown. No bullet-point lists. Natural flowing paragraphs.
- When the user references a specific agent, swarm, twin, or capability, respond concretely.
- If a request belongs to another agent, say how you would route it — you are the decision point.`

// ── Zuri persona from canonical_agent_map ──────────────────
// Zuri is the master/base agent. Her identity (system prompt, tagline,
// capabilities, model) lives in canonical_agent_map so it can be tuned
// without a deploy. All other agents route through her.
async function loadZuriPersona() {
  const { data } = await supabaseAdmin
    .from('canonical_agent_map')
    .select('*')
    .eq('slug', 'zuri')
    .maybeSingle()

  return {
    systemPrompt: (data?.system_prompt as string) || FALLBACK_ZURI_PROMPT,
    name: (data?.name as string) || 'Zuri',
    tagline: (data?.tagline as string) || '',
    capabilities: data?.capabilities ?? [],
    model: (data?.model as string) || 'gpt-4o',
    found: Boolean(data),
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, context, organizationId, entity } = await req.json()

  // Zuri is the base: load her canonical persona.
  const zuri = await loadZuriPersona()

  // If the caller selected a specific agent (chat page entity picker), route
  // through Zuri: she is the entry point, the target agent does the work,
  // and her persona frames the delivery.
  const selectedAgentId = entity?.type === 'agent' ? (entity?.id || entity?.key) : null

  let routedAgentOutput: string | null = null
  let routedAgentName: string | null = null

  if (selectedAgentId && selectedAgentId !== 'zuri') {
    try {
      const { runAgentByAgentId } = await import('@/lib/agents')
      const { agent, output } = await runAgentByAgentId(selectedAgentId, String(messages[messages.length - 1]?.content ?? ''))
      routedAgentOutput = String(output)
      routedAgentName = agent.agent_name || selectedAgentId
    } catch (e) {
      console.error(`Zuri routing: agent ${selectedAgentId} failed:`, e)
      routedAgentOutput = null
    }
  }

  // Fetch recent AI memories for this user, scoped to context (personal vs
  // a specific org/collective) -- same scoping as the essence generation
  // route, so chat and essence draw from the same context-appropriate pool.
  let memoryQuery = supabase
    .from('ai_memories')
    .select('content, memory_type')
    .eq('entity_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  memoryQuery = organizationId
    ? memoryQuery.eq('organization_id', organizationId)
    : memoryQuery.is('organization_id', null)
  const { data: memories } = await memoryQuery

  const memoryContext = memories?.map(m => m.content).join('\n') ?? ''
  const contextLabel = organizationId ? `Organization/Collective context (org ${organizationId})` : 'Personal context'

  // Build the system prompt. When an agent was routed, Zuri presents the
  // agent's output through her persona (she is the base / primary agent).
  let systemPrompt = `${zuri.systemPrompt}

${context ?? 'No additional context provided.'}

Current intelligence context: ${contextLabel}

Your memories of this user (${contextLabel}):
${memoryContext || 'No memories yet — this may be a new user, or the first message in this context.'}

Always respond in Zuri's voice: direct, confident, visionary. Never generic.`

  if (routedAgentOutput) {
    systemPrompt += `\n\n## ROUTED AGENT OUTPUT (from ${routedAgentName})
The user's request was routed through you to the ${routedAgentName} agent. Deliver this agent's output to the user as the outcome of the ecosystem working together. Frame it briefly in your voice, then present the substance:
${routedAgentOutput}`
  }

  const lastUserMessage = messages[messages.length - 1]?.content ?? ''

  // Zuri is the base agent: even when a request is routed through another
  // agent, she is the one who delivers the final answer in her voice. The
  // routed output (if any) is already injected into `systemPrompt` above.
  let reply: string
  if (!useOpenRouter && !useOpenAI) {
    // No AI provider configured (env keys absent) — degrade gracefully rather
    // than 500. Deterministic response so the chat UI stays functional.
    reply = routedAgentOutput
      ? `${routedAgentOutput}`
      : 'Zuri is warming up — the AI provider for this deployment is not configured yet. Ask an admin to set OPENROUTER_API_KEY or OPENAI_API_KEY.'
  } else {
    try {
      reply = await completeWithFallback(zuri.model, [
        { role: 'system', content: systemPrompt },
        ...messages,
      ], 1000)
    } catch {
      // All configured providers failed — return routed output if present,
      // otherwise a graceful message so the chat UI never 500s.
      reply = routedAgentOutput
        ? `${routedAgentOutput}`
        : 'Zuri is temporarily unavailable — all configured AI providers failed. Check the server logs.'
    }
  }

  // Save both sides of the conversation as separate memory entries
  const userMsg = lastUserMessage.slice(0, 500)
  const today = new Date().toISOString().split('T')[0]

  if (userMsg) {
    await supabase.from('ai_memories').insert({
      entity_id: user.id,
      entity_type: 'user',
      organization_id: organizationId ?? null,
      content: userMsg,
      memory_type: 'user_message',
      title: `User asked - ${today}`,
    })
  }

  if (reply) {
    await supabase.from('ai_memories').insert({
      entity_id: user.id,
      entity_type: 'user',
      organization_id: organizationId ?? null,
      content: reply.slice(0, 1000),
      memory_type: routedAgentName ? 'zuri_routed_response' : 'zuri_response',
      title: `${routedAgentName ? `${routedAgentName} via ` : ''}Zuri response - ${today}`,
    })
  }

  return NextResponse.json({ reply, routed: routedAgentName, zuri: zuri.found })
}
