import { createAdminClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
import { lazy } from '@/lib/lazy-client'
const openai = lazy(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }))
/**
 * POST /api/blueprint/intake
 * Takes a user's business description and recommends a blueprint template + vertical.
 * Body: { messages: { role: string; content: string }[], currentStep?: string }
 * 
 * Steps:
 * 1. Ask about their industry / what they do
 * 2. Ask about their role and business stage
 * 3. Ask what they want to optimize
 * 4. Recommend a blueprint path
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { messages, currentStep } = await req.json()

    // Fetch available templates to inform recommendations
    const { data: templates } = await supabase
      .from('blueprint_templates')
      .select('*, template_json')
      .eq('is_active', true)

    const templateCatalog = (templates ?? []).map(t => ({
      key: t.key,
      name: t.name,
      description: t.description,
      vertical_key: t.vertical_key,
      subcategory_key: t.subcategory_key,
      sections: (t.template_json as any)?.sections?.length ?? 0,
      questions: (t.template_json as any)?.sections?.reduce?.((acc: number, s: any) => acc + (s.questions?.length ?? 0), 0) ?? 0,
    }))

    const stepGuidance = currentStep
      ? `Current intake step: ${currentStep}`
      : 'Start by asking what industry or type of business they have.'

    const systemPrompt = `You are the Blueprint Intake Advisor for Evolved Eden's intelligence system. Your job is to guide users through a brief intake to recommend the right blueprint assessment.

## Available Blueprint Templates
${JSON.stringify(templateCatalog, null, 2)}

## Intake Flow
Ask ONE question at a time. Guide naturally:

1. What industry or business type are they? (e.g., beauty/wellness, hospitality, real estate, ecommerce, professional services, education, healthcare, SaaS, etc.)
2. What's their role? (founder/owner, operator/manager, executive, freelancer/solopreneur, team lead)
3. What stage is their business? (idea/pre-launch, early/growing, established/scaling, enterprise/mature)
4. What's their primary goal? (increase revenue, automate operations, improve client experience, scale team, launch new offering)
5. Based on everything, recommend the best blueprint template.

## Response Rules
- Keep responses 2-3 sentences. Ask exactly ONE question at a time.
- Track what you've learned. After step 4, format your response as:
  RECOMMENDATION: {"template_key": "xxx", "vertical_key": "xxx", "reasoning": "short explanation"}
  Then say: "Based on what you've shared, I recommend the [Blueprint Name]. This will assess [key areas] and recommend [outcome]. Shall I start your assessment?"

${stepGuidance}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 800,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content ?? ''

    // Parse recommendation if present
    let recommendation = null
    const recMatch = reply.match(/RECOMMENDATION:\s*(\{.*?\})/s)
    if (recMatch) {
      try {
        recommendation = JSON.parse(recMatch[1])
      } catch {}
    }

    // Determine current step based on what we know
    const knownInfo = messages.filter((m: { role: string }) => m.role === 'user').map((m: { content: string }) => m.content).join(' ')
    let step = 'industry'
    if (knownInfo.length > 200) step = 'goal'
    else if (knownInfo.length > 120) step = 'stage'
    else if (knownInfo.length > 50) step = 'role'

    return NextResponse.json({
      reply: reply.replace(/RECOMMENDATION:\s*\{.*?\}/s, '').trim(),
      recommendation,
      step,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
