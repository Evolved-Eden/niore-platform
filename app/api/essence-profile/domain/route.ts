import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DOMAIN_KEYS, DOMAIN_QUESTIONS, DOMAIN_LABELS, scoreDomain, type DomainKey } from '@/lib/domainQuestions'

/**
 * DOMAIN MODULES — $50 a-la-carte blueprint add-ons
 *
 * GET  /api/blueprint/domain?domain=domain_relationship
 *   -> paywall check, then returns the 5-question bank for that domain plus
 *      any already-saved profile for it.
 * POST /api/blueprint/domain  { domain, answers }
 *   -> paywall check, scores the answers, and saves the result to
 *      client_twins.metadata.domainProfiles.<domain> PERMANENTLY — per
 *      owner's explicit instruction, a purchased domain becomes a
 *      permanent recurring category in the person's essence board, not a
 *      one-time report.
 *
 * PAYWALLED: requires the domain key to be present in
 * client_twins.metadata.purchased_domains (set by the Stripe webhook after
 * purchase). This mirrors the /api/blueprint/extended enforcement pattern.
 */

function isDomainKey(v: any): v is DomainKey {
  return DOMAIN_KEYS.includes(v)
}

async function getAuthAndTwin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, meta: null, svc: null }

  const svc = createServiceClient()
  const { data: twin, error } = await svc
    .from('client_twins')
    .select('id, metadata')
    .eq('client_id', user.id)
    .maybeSingle()
  if (error) console.error('Domain module: failed to fetch client_twins:', error)

  return { user, meta: (twin?.metadata as any) || {}, twinId: twin?.id as string | undefined, svc }
}

export async function GET(req: NextRequest) {
  try {
    const { user, meta } = await getAuthAndTwin()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const domain = req.nextUrl.searchParams.get('domain')
    if (!isDomainKey(domain)) {
      return NextResponse.json({ error: 'Invalid or missing domain', validDomains: DOMAIN_KEYS }, { status: 400 })
    }

    const purchased: string[] = meta?.purchased_domains || []
    if (!purchased.includes(domain)) {
      return NextResponse.json(
        {
          error: 'Domain module not purchased',
          message: `${DOMAIN_LABELS[domain]} is a $50 add-on module.`,
          purchase_url: '/dashboard/client/essence-profile',
          product_id: domain,
        },
        { status: 402 }
      )
    }

    const existingProfile = meta?.domainProfiles?.[domain] || null

    return NextResponse.json({
      domain,
      label: DOMAIN_LABELS[domain],
      questions: DOMAIN_QUESTIONS[domain],
      existingProfile,
    })
  } catch (error: any) {
    console.error('Domain module GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to load domain module' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, meta, twinId, svc } = await getAuthAndTwin()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!svc) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    const { domain, answers } = await req.json()
    if (!isDomainKey(domain)) {
      return NextResponse.json({ error: 'Invalid or missing domain', validDomains: DOMAIN_KEYS }, { status: 400 })
    }
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers object is required' }, { status: 400 })
    }

    const purchased: string[] = meta?.purchased_domains || []
    if (!purchased.includes(domain)) {
      return NextResponse.json(
        {
          error: 'Domain module not purchased',
          message: `${DOMAIN_LABELS[domain]} is a $50 add-on module.`,
          purchase_url: '/dashboard/client/essence-profile',
          product_id: domain,
        },
        { status: 402 }
      )
    }

    const { score, insights } = scoreDomain(domain, answers)

    const profile = {
      domain,
      label: DOMAIN_LABELS[domain],
      score,
      insights,
      answers,
      completedAt: new Date().toISOString(),
      // Marks this as a permanent recurring essence board category, per
      // owner instruction: purchasing a domain module isn't a one-time
      // report, it becomes ongoing content in the person's daily/weekly/
      // monthly Essence Board (see /api/zuri/essence).
      permanentRotation: true,
    }

    const newMeta = {
      ...meta,
      domainProfiles: {
        ...(meta?.domainProfiles || {}),
        [domain]: profile,
      },
    }

    if (twinId) {
      const { error: updateErr } = await svc
        .from('client_twins')
        .update({ metadata: newMeta })
        .eq('id', twinId)
      if (updateErr) {
        console.error('Domain module: failed to save profile:', updateErr)
        return NextResponse.json({ error: 'Failed to save domain profile' }, { status: 500 })
      }
    } else {
      const { error: insertErr } = await svc
        .from('client_twins')
        .insert({ client_id: user.id, twin_status: 'active', version: 1, metadata: newMeta })
      if (insertErr) {
        console.error('Domain module: failed to create twin with profile:', insertErr)
        return NextResponse.json({ error: 'Failed to save domain profile' }, { status: 500 })
      }
    }

    return NextResponse.json({ status: 'complete', profile })
  } catch (error: any) {
    console.error('Domain module POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save domain module' }, { status: 500 })
  }
}
