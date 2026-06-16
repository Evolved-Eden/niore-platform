import { NextRequest, NextResponse } from 'next/server'

/**
 * PERSONAL DEPLOY INTAKE
 * POST /api/blueprint/intake/personal
 *
 * 14 questions capturing the Personal deployment profile.
 * For solo individuals, partners, or families.
 */
export async function POST(req: NextRequest) {
  try {
    const { answers = {} } = await req.json()

    const questions = [
      // ── Profile Type ──
      { key: 'p1_profile_type', type: 'select', label: 'Who is this for?',
        options: [
          { value: 'solo', label: 'Just me — solo' },
          { value: 'partners', label: 'Me and my partner(s)' },
          { value: 'family', label: 'My whole family' },
          { value: 'solo_business', label: 'Solo with side business' },
        ]},
      { key: 'p2_primary_goal', type: 'select', label: 'Primary goal',
        options: [
          { value: 'productivity', label: 'Personal productivity & organization' },
          { value: 'growth', label: 'Self-development & growth' },
          { value: 'business', label: 'Managing my side business / projects' },
          { value: 'family_management', label: 'Family coordination & management' },
          { value: 'health', label: 'Health, wellness & longevity' },
          { value: 'creative', label: 'Creative projects & content' },
          { value: 'learning', label: 'Learning & education' },
        ]},
      // ── Time & Urgency ──
      { key: 'p3_urgency', type: 'select', label: 'How soon do you want to start?',
        options: [
          { value: 'immediate', label: 'Right now — let\'s go' },
          { value: 'soon', label: 'Within a week' },
          { value: 'planned', label: 'Within a month' },
          { value: 'exploring', label: 'Just exploring' },
        ]},
      { key: 'p4_time_commitment', type: 'select', label: 'Time you can dedicate weekly',
        options: [
          { value: 'minimal', label: '< 1 hour / week' },
          { value: 'moderate', label: '1–3 hours / week' },
          { value: 'dedicated', label: '3–10 hours / week' },
          { value: 'heavy', label: '10+ hours / week' },
        ]},
      // ── Scope ──
      { key: 'p5_scope', type: 'multi_select', label: 'What interests you most?',
        options: [
          { value: 'personal_assistant', label: 'Personal AI assistant' },
          { value: 'dashboard', label: 'Personal dashboard & insights' },
          { value: 'agents', label: 'AI agents for specific tasks' },
          { value: 'automation', label: 'Automate daily routines' },
          { value: 'knowledge', label: 'Personal knowledge management' },
          { value: 'essence', label: 'Daily essence / intelligence brief' },
          { value: 'twin', label: 'AI twin / digital version of me' },
        ]},
      // ── Platforms & Integrations ──
      { key: 'p6_calendar', type: 'multi_select', label: 'Which calendar do you use?',
        options: [
          { value: 'google', label: 'Google Calendar' },
          { value: 'outlook', label: 'Outlook / Office 365' },
          { value: 'apple', label: 'Apple iCloud' },
          { value: 'notion_calendar', label: 'Notion Calendar' },
          { value: 'none', label: 'None' },
        ]},
      { key: 'p7_email', type: 'multi_select', label: 'Which email do you use?',
        options: [
          { value: 'gmail', label: 'Gmail' },
          { value: 'outlook', label: 'Outlook / Hotmail' },
          { value: 'icloud', label: 'iCloud Mail' },
          { value: 'proton', label: 'Proton Mail' },
          { value: 'custom', label: 'Custom domain' },
          { value: 'other', label: 'Other' },
        ]},
      { key: 'p8_social', type: 'multi_select', label: 'Which social platforms are you on?',
        options: [
          { value: 'instagram', label: 'Instagram' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'twitter', label: 'X / Twitter' },
          { value: 'facebook', label: 'Facebook' },
          { value: 'youtube', label: 'YouTube' },
          { value: 'pinterest', label: 'Pinterest' },
          { value: 'snapchat', label: 'Snapchat' },
          { value: 'threads', label: 'Threads' },
          { value: 'none', label: 'None of the above' },
        ]},
      { key: 'p9_community', type: 'multi_select', label: 'Which communities are you part of?',
        options: [
          { value: 'discord', label: 'Discord' },
          { value: 'slack', label: 'Slack' },
          { value: 'telegram', label: 'Telegram' },
          { value: 'whatsapp', label: 'WhatsApp' },
          { value: 'reddit', label: 'Reddit' },
          { value: 'none', label: 'None of the above' },
        ]},
      { key: 'p10_automation', type: 'multi_select', label: 'Which automation tools do you use?',
        options: [
          { value: 'zapier', label: 'Zapier' },
          { value: 'make', label: 'Make (formerly Integromat)' },
          { value: 'ifttt', label: 'IFTTT' },
          { value: 'shortcuts', label: 'Apple Shortcuts' },
          { value: 'none', label: 'None of the above' },
        ]},
      // ── Experience ──
      { key: 'p11_ai_experience', type: 'select', label: 'AI experience level',
        options: [
          { value: 'none', label: 'None — completely new' },
          { value: 'beginner', label: 'Beginner — used ChatGPT a few times' },
          { value: 'intermediate', label: 'Intermediate — use AI tools regularly' },
          { value: 'advanced', label: 'Advanced — build with AI' },
        ]},
      { key: 'p12_onboarding_style', type: 'select', label: 'Onboarding preference',
        options: [
          { value: 'self_guided', label: 'Self-guided with docs' },
          { value: 'walkthrough', label: 'Guided walkthrough' },
          { value: 'full_training', label: 'Full training + handholding' },
        ]},
      // ── Additional ──
      { key: 'p13_referral', type: 'text', label: 'How did you hear about us?' },
      { key: 'p14_commitment', type: 'boolean', label: 'I\'m ready to set up my personal intelligence system' },
    ]

    const totalQuestions = questions.length
    const answeredCount = questions.filter(q => answers[q.key] !== undefined && answers[q.key] !== null && answers[q.key] !== '').length
    const completion = Math.round((answeredCount / totalQuestions) * 100)

    const sel = (key: string) => answers[key] ?? []
    const ready = answers.p14_commitment === true && answers.p1_profile_type && answers.p2_primary_goal

    return NextResponse.json({
      questions,
      answers: Object.keys(answers).length > 0 ? {
        completion_pct: completion,
        ready: !!ready,
        profile_type: answers.p1_profile_type ?? null,
        primary_goal: answers.p2_primary_goal ?? null,
        scope: sel('p5_scope'),
        integrations: {
          calendar: sel('p6_calendar'),
          email: sel('p7_email'),
          social: sel('p8_social'),
          community: sel('p9_community'),
          automation: sel('p10_automation'),
        },
        completed: completion >= 100,
      } : { completion_pct: 0, ready: false, completed: false },
      totalQuestions,
      answeredCount,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
