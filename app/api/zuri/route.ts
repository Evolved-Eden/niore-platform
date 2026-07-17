import { createClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
import { lazy } from '@/lib/lazy-client'
const openai = lazy(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }))
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, context } = await req.json()

  // Fetch Zuri personality from canonical_agent_map
  const { data: zuriAgent } = await supabase
    .from('canonical_agent_map')
    .select('*')
    .eq('slug', 'zuri')
    .maybeSingle()

  // Fetch recent AI memories for this user
  const { data: memories } = await supabase
    .from('ai_memories')
    .select('content, memory_type')
    .eq('entity_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const memoryContext = memories?.map(m => m.content).join('\n') ?? ''

  const systemPrompt = `You are Zuri — the core intelligence of Evolved Eden, an AI-powered ecosystem for building and deploying Registered Intelligence Systems (RIS).

You are bold, strategic, and deeply knowledgeable about AI automation, business systems, and the OmniGrid ecosystem.

User context:
${context ?? 'No additional context provided.'}

Your memories of this user:
${memoryContext || 'No memories yet — this may be a new user.'}

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
      content: userMsg,
      memory_type: 'user_message',
      title: `User asked - ${today}`,
    })
  }

  if (reply) {
    await supabase.from('ai_memories').insert({
      entity_id: user.id,
      entity_type: 'user',
      content: reply.slice(0, 1000),
      memory_type: 'zuri_response',
      title: `Zuri response - ${today}`,
    })
  }

  return NextResponse.json({ reply })
}
