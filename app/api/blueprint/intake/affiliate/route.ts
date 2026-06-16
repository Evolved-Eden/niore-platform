import { NextRequest, NextResponse } from 'next/server'

const questions = [
  { key: 'af1_niche', type: 'select', label: 'What affiliate niche do you focus on?',
    options: [
      { value: 'tech', label: 'Tech / SaaS' },
      { value: 'beauty', label: 'Beauty / Fashion' },
      { value: 'finance', label: 'Finance / Investing' },
      { value: 'health', label: 'Health / Wellness' },
      { value: 'education', label: 'Education / Courses' },
      { value: 'lifestyle', label: 'Lifestyle / General' },
    ], required: true },
  { key: 'af2_experience', type: 'select', label: 'Your affiliate marketing experience',
    options: [
      { value: 'beginner', label: 'Beginner — just getting started' },
      { value: 'intermediate', label: 'Intermediate — some active promotions' },
      { value: 'advanced', label: 'Advanced — full-time affiliate' },
    ], required: true },
  { key: 'af3_traffic', type: 'select', label: 'Primary traffic source',
    options: [
      { value: 'organic', label: 'Organic social media' },
      { value: 'paid', label: 'Paid ads' },
      { value: 'email', label: 'Email list' },
      { value: 'seo', label: 'SEO / blog' },
      { value: 'multiple', label: 'Multiple sources' },
    ], required: true },
  { key: 'af4_platforms', type: 'multi_select', label: 'Which platforms do you use?',
    options: [
      { value: 'instagram', label: 'Instagram' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'tiktok', label: 'TikTok' },
      { value: 'twitter', label: 'X / Twitter' },
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'blog', label: 'Blog / Website' },
      { value: 'email', label: 'Email Newsletter' },
    ] },
  { key: 'af5_income', type: 'select', label: 'Monthly affiliate income range',
    options: [
      { value: 'pre', label: 'Pre-revenue' },
      { value: 'low', label: '$0–$500' },
      { value: 'mid', label: '$500–$5,000' },
      { value: 'high', label: '$5,000+' },
    ] },
  { key: 'af6_ai_interest', type: 'select', label: 'Interest in AI-powered affiliate tools',
    options: [
      { value: 'low', label: 'Low — I prefer manual methods' },
      { value: 'medium', label: 'Medium — open to AI assistance' },
      { value: 'high', label: 'High — want full AI automation' },
    ] },
  { key: 'af7_team_size', type: 'select', label: 'Team size',
    options: [
      { value: 'solo', label: 'Solo' },
      { value: 'small', label: 'Small team (2–5)' },
      { value: 'agency', label: 'Agency (6+)' },
    ] },
  { key: 'af8_goal', type: 'select', label: 'Primary goal for Affiliate OS',
    options: [
      { value: 'tracking', label: 'Better link tracking & analytics' },
      { value: 'automation', label: 'Automate promotions & follow-ups' },
      { value: 'scale', label: 'Scale to multiple offers & partners' },
      { value: 'twin', label: 'AI Twin for affiliate intelligence' },
    ] },
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return NextResponse.json({ questions, answers: body })
  } catch {
    return NextResponse.json({ questions })
  }
}
