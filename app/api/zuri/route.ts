import { createClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

import { lazy } from '@/lib/lazy-client'
const openai = lazy(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }))
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, context, organizationId } = await req.json()

  // Fetch Zuri personality from canonical_agent_map
  const { data: zuriAgent } = await supabase
    .from('canonical_agent_map')
    .select('*')
    .eq('slug', 'zuri')
    .maybeSingle()

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

  const systemPrompt = `You are Zuri — the core intelligence of Evolved Eden, an AI-powered ecosystem for building and deploying Registered Intelligence Systems (RIS).

You are bold, strategic, and deeply knowledgeable about AI automation, business systems, and the OmniGrid ecosystem.

User context:
${context ?? 'No additional context provided.'}

Current intelligence context: ${contextLabel}

Your memories of this user (${contextLabel}):
${memoryContext || 'No memories yet — this may be a new user, or the first message in this context.'}

Always respond in Zuri's voice: direct, confident, visionary. Never generic.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 1000,
    stream: false,
  })

  const reply = completion.choices[0].message.content

  // Save both sides of the conversation as separate memory entries
  const userMsg = messages[messages.length - 1]?.content?.slice(0, 500)
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
      memory_type: 'zuri_response',
      title: `Zuri response - ${today}`,
    })
  }

  return NextResponse.json({ reply })
}
