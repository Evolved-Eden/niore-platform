import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/blueprint/trial
 *
 * Provisions a 3-day free trial account for the current user.
 * Creates: organization → intelligence profile → twin → Zuri agent → default agents
 * All without requiring payment.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to start a trial' }, { status: 401 })
    }

    const body = await req.json()
    const intakeRole = body.intakeRole || 'client'
    const blueprintData = body.blueprintData || {}

    // Check if user already has a client record
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, status, plan_tier_key, metadata')
      .eq('id', user.id)
      .maybeSingle()

    if (existingClient) {
      const meta = existingClient.metadata as Record<string, any> || {}
      // If they already have an active paid account or active trial, don't create another
      if (existingClient.status === 'active' && existingClient.plan_tier_key !== 'trial') {
        return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 })
      }
      // If they already have a trial that hasn't expired
      if (existingClient.plan_tier_key === 'trial') {
        const trialEnd = meta.trial_end_date ? new Date(meta.trial_end_date) : null
        if (trialEnd && trialEnd > new Date()) {
          return NextResponse.json({
            redirectUrl: '/dashboard',
            message: 'Trial already active',
          })
        }
      }
    }

    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 3)

    const trialMeta: Record<string, any> = {
      plan_tier_key: 'trial',
      billing_status: 'trial',
      is_trial: true,
      trial_started_at: new Date().toISOString(),
      trial_end_date: trialEnd.toISOString(),
      provisioned_at: new Date().toISOString(),
      intake_role: intakeRole,
      blueprint_data: blueprintData,
    }

    // ── 1. Upsert clients record ──
    await supabase.from('clients').upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      plan_tier_key: 'trial',
      client_type: intakeRole === 'creator' ? 'creator' : intakeRole === 'personal' ? 'personal' : intakeRole === 'affiliate' ? 'affiliate' : 'individual',
      status: 'active',
      onboarding_status: 'trial',
      metadata: trialMeta,
    }, { onConflict: 'id' })

    // ── 2. Create organization ──
    const { data: org } = await supabase.from('organizations').insert({
      name: `${user.email?.split('@')[0] || 'User'}'s Intelligence`,
      owner_id: user.id,
      slug: `${user.email?.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'user'}_org`,
      subscription_plan: 'trial',
      subscription_status: 'trial',
      settings: { plan_tier: 'trial', trial: true },
    } as any).select().single()

    const orgId = org?.id

    // ── 3. Create human profile ──
    const { data: hp } = await (supabase.from('human_profiles') as any).insert({
      user_id: user.id,
      email: user.email || '',
      first_name: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User',
      identity_summary: `Trial intelligence for ${user.email || 'User'}`,
    }).select('id').single()

    // ── 4. Create intelligence profile ──
    let intelProfileId: string | null = null
    if (orgId) {
      const { data: intel } = await supabase.from('intelligence_profiles').insert({
        entity_type: 'organization',
        entity_id: orgId,
        organization_id: orgId,
        profile_kind: 'business_intelligence',
        identity_summary: `Trial business intelligence`,
        profile_type: 'trial',
        confidence_score: 0.5,
        version: 1,
      }).select('id').single()
      intelProfileId = (intel as any)?.id || null
    }

    // ── 5. Create AI Twin ──
    if (hp && intelProfileId) {
      await (supabase.from('ai_twins') as any).insert({
        human_profile_id: hp.id,
        intelligence_profile_id: intelProfileId,
        client_id: user.id,
        twin_name: `${user.email?.split('@')[0] || 'User'}'s Twin`,
        twin_type: 'trial',
        active: true,
      })
    }

    // ── 6. Create Client Twin ──
    await supabase.from('client_twins').upsert({
      client_id: user.id,
      organization_id: orgId || null,
      twin_status: 'active',
      version: 1,
      confidence_score: 0.5,
    }, { onConflict: 'client_id' })

    // ── 7. Create Zuri agent ──
    await supabase.from('agents').insert({
      client_id: user.id,
      organization_id: orgId || null,
      agent_name: 'Zuri',
      role_type: 'CORE',
      is_system_agent: true,
      status: 'active',
      health_status: 'ACTIVE',
      decision_mode: 'ADVISORY',
      autonomy_level: 8,
      authority_level: 9,
      risk_level: 3,
      capabilities: ['orchestration', 'analysis', 'recommendation', 'monitoring'],
    } as any)

    // ── 8. Create front-desk agent ──
    await supabase.from('agents').insert({
      client_id: user.id,
      organization_id: orgId || null,
      agent_name: 'Front Desk',
      role_type: 'VERTICAL',
      is_system_agent: true,
      status: 'active',
      health_status: 'ACTIVE',
      decision_mode: 'DETERMINISTIC',
      autonomy_level: 5,
      authority_level: 4,
      risk_level: 2,
      capabilities: ['intake', 'qualification', 'scheduling', 'routing'],
    } as any)

    // ── 9. Update users record ──
    await supabase.from('users').update({
      metadata: {
        plan_tier_key: 'trial',
        organization_id: orgId,
        trial: true,
        trial_end_date: trialEnd.toISOString(),
        provisioned: true,
        provisioned_at: new Date().toISOString(),
      },
    }).eq('id', user.id)

    return NextResponse.json({
      success: true,
      message: 'Trial activated — 3 days free',
      trial_end: trialEnd.toISOString(),
      redirectUrl: '/dashboard',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
