import { createClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, context } = await req.json()

  // Fetch Zuri personality
  const { data: personality } = await supabase
    .from('zuri_personality')
    .select('*')
    .single()

  // Fetch recent memory for this user
  const { data: memories } = await supabase
    .from('zuri_memory')
    .select('content, memory_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const memoryContext = memories?.map(m => m.content).join('\n') ?? ''

  const systemPrompt = `You are Zuri — the core intelligence of Hoodacity, an AI-powered ecosystem for building and deploying Registered Intelligence Systems (RIS).

${personality?.core_description ?? 'You are bold, strategic, and deeply knowledgeable about AI automation, business systems, and the OmniGrid ecosystem.'}

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

  // Save to memory
  await supabase.from('zuri_memory').insert({
    user_id: user.id,
    content: `User asked: ${messages[messages.length - 1]?.content?.slice(0, 200)}`,
    memory_type: 'interaction',
  })

  return NextResponse.json({ reply })
}
