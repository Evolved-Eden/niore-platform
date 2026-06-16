import { NextRequest, NextResponse } from 'next/server'

/**
 * CLIENT DEPLOY INTAKE
 * POST /api/blueprint/intake/client
 *
 * 16+ questions capturing the client deployment profile.
 * Used after Core Blueprint to produce the Daily Essence Board + Dashboard.
 */
export async function POST(req: NextRequest) {
  try {
    const { answers = {} } = await req.json()

    const questions = [
      // ── Service Model ──
      { key: 'ci1_service_model', type: 'select', label: 'Preferred service model',
        options: [
          { value: 'ai_only', label: 'AI only — fully autonomous' },
          { value: 'ai_human', label: 'AI + human hybrid' },
          { value: 'ai_coach', label: 'AI coach / guide' },
          { value: 'full_concierge', label: 'Full concierge (AI + human team)' },
        ]},
      { key: 'ci2_urgency', type: 'select', label: 'How urgent is deployment?',
        options: [
          { value: 'immediate', label: 'Immediate — within days' },
          { value: 'soon', label: 'Soon — within weeks' },
          { value: 'planned', label: 'Planned — within 1–3 months' },
          { value: 'exploring', label: 'Exploring — no timeline' },
        ]},
      // ── Budget ──
      { key: 'ci3_budget_monthly', type: 'select', label: 'Monthly AI budget range',
        options: [
          { value: '0-100', label: '$0 – $100' },
          { value: '100-500', label: '$100 – $500' },
          { value: '500-2k', label: '$500 – $2,000' },
          { value: '2k-5k', label: '$2,000 – $5,000' },
          { value: '5k+', label: '$5,000+' },
        ]},
      { key: 'ci4_setup_budget', type: 'select', label: 'One-time setup budget',
        options: [
          { value: '0-500', label: '$0 – $500' },
          { value: '500-2k', label: '$500 – $2,000' },
          { value: '2k-5k', label: '$2,000 – $5,000' },
          { value: '5k-15k', label: '$5,000 – $15,000' },
          { value: '15k+', label: '$15,000+' },
        ]},
      // ── Scope ──
      { key: 'ci5_scope', type: 'multi_select', label: 'What do you need deployed?',
        options: [
          { value: 'daily_board', label: 'Daily Essence Board' },
          { value: 'dashboard', label: 'Personal Dashboard' },
          { value: 'agents', label: 'Individual AI Agents' },
          { value: 'swarms', label: 'AI Swarm Orchestration' },
          { value: 'workflows', label: 'Automation Workflows' },
          { value: 'full_system', label: 'Full system deployment' },
        ]},
      // ── Platforms & Integrations ──
      { key: 'ci6_crm', type: 'multi_select', label: 'Which CRM do you use?',
        options: [
          { value: 'salesforce', label: 'Salesforce' },
          { value: 'hubspot', label: 'HubSpot' },
          { value: 'pipedrive', label: 'Pipedrive' },
          { value: 'close', label: 'Close' },
          { value: 'copper', label: 'Copper' },
          { value: 'zoho', label: 'Zoho' },
          { value: 'gohighlevel', label: 'GoHighLevel' },
          { value: 'not_using', label: 'Not using a CRM' },
          { value: 'other', label: 'Other CRM' },
        ]},
      { key: 'ci7_social', type: 'multi_select', label: 'Which social platforms are you on?',
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
      { key: 'ci8_community', type: 'multi_select', label: 'Which community platforms do you use?',
        options: [
          { value: 'discord', label: 'Discord' },
          { value: 'slack', label: 'Slack' },
          { value: 'circle', label: 'Circle' },
          { value: 'mighty_networks', label: 'Mighty Networks' },
          { value: 'telegram', label: 'Telegram' },
          { value: 'whatsapp', label: 'WhatsApp' },
          { value: 'facebook_groups', label: 'Facebook Groups' },
          { value: 'skool', label: 'Skool' },
          { value: 'none', label: 'None of the above' },
        ]},
      { key: 'ci9_automation', type: 'multi_select', label: 'Which automation tools do you use?',
        options: [
          { value: 'zapier', label: 'Zapier' },
          { value: 'make', label: 'Make (formerly Integromat)' },
          { value: 'n8n', label: 'n8n' },
          { value: 'workato', label: 'Workato' },
          { value: 'ifttt', label: 'IFTTT' },
          { value: 'power_automate', label: 'Microsoft Power Automate' },
          { value: 'custom_api', label: 'Custom API / scripts' },
          { value: 'none', label: 'None of the above' },
        ]},
      { key: 'ci10_calendar', type: 'multi_select', label: 'Which calendar do you use?',
        options: [
          { value: 'google', label: 'Google Calendar' },
          { value: 'outlook', label: 'Outlook / Office 365' },
          { value: 'apple', label: 'Apple iCloud' },
          { value: 'notion_calendar', label: 'Notion Calendar' },
          { value: 'calendly', label: 'Calendly' },
          { value: 'none', label: 'None' },
        ]},
      { key: 'ci11_email', type: 'multi_select', label: 'Which email platform do you use?',
        options: [
          { value: 'gmail', label: 'Gmail' },
          { value: 'outlook', label: 'Outlook / Office 365' },
          { value: 'proton', label: 'Proton Mail' },
          { value: 'custom', label: 'Custom domain email' },
          { value: 'other', label: 'Other' },
        ]},
      { key: 'ci12_banking', type: 'multi_select', label: 'Which financial platforms do you use?',
        options: [
          { value: 'quickbooks', label: 'QuickBooks' },
          { value: 'xero', label: 'Xero' },
          { value: 'stripe', label: 'Stripe' },
          { value: 'square', label: 'Square' },
          { value: 'plaid', label: 'Plaid / banking' },
          { value: 'none', label: 'None' },
        ]},
      // ── Experience ──
      { key: 'ci13_ai_experience', type: 'select', label: 'AI experience level',
        options: [
          { value: 'none', label: 'None — completely new' },
          { value: 'beginner', label: 'Beginner — used ChatGPT a few times' },
          { value: 'intermediate', label: 'Intermediate — use AI tools regularly' },
          { value: 'advanced', label: 'Advanced — build with AI' },
        ]},
      { key: 'ci14_onboarding_style', type: 'select', label: 'Onboarding preference',
        options: [
          { value: 'self_guided', label: 'Self-guided with docs' },
          { value: 'walkthrough', label: 'Guided walkthrough' },
          { value: 'full_training', label: 'Full training + handholding' },
        ]},
      // ── Additional ──
      { key: 'ci15_support_channel', type: 'select', label: 'Preferred support channel',
        options: [
          { value: 'in_app', label: 'In-app chat / notifications' },
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'phone', label: 'Phone' },
          { value: 'slack', label: 'Slack / Discord' },
        ]},
      { key: 'ci16_referral', type: 'text', label: 'How did you hear about us?' },
      { key: 'ci17_special_requests', type: 'text', label: 'Special requests or considerations' },
      { key: 'ci18_commitment', type: 'boolean', label: 'I am ready to deploy my intelligence system' },
    ]

    const totalQuestions = questions.length
    const answeredCount = questions.filter(q => answers[q.key] !== undefined && answers[q.key] !== null && answers[q.key] !== '').length
    const completion = Math.round((answeredCount / totalQuestions) * 100)

    const sel = (key: string) => answers[key] ?? []
    const ready = answers.ci18_commitment === true && answers.ci1_service_model && answers.ci3_budget_monthly

    return NextResponse.json({
      questions,
      answers: Object.keys(answers).length > 0 ? {
        completion_pct: completion,
        ready: !!ready,
        service_model: answers.ci1_service_model ?? null,
        urgency: answers.ci2_urgency ?? null,
        budget: answers.ci3_budget_monthly ?? null,
        scope: answers.ci5_scope ?? [],
        integrations: {
          crm: sel('ci6_crm'),
          social: sel('ci7_social'),
          community: sel('ci8_community'),
          automation: sel('ci9_automation'),
          calendar: sel('ci10_calendar'),
          email: sel('ci11_email'),
          banking: sel('ci12_banking'),
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
