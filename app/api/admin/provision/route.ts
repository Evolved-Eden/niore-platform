import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Full account provisioning — called when:
 * 1. Admin approves a user (sets status = 'admin_approved')
 * 2. Enterprise/test accounts sign up (auto-provision)
 * 3. Payment completes (stripe webhook → activatePaidAccess)
 *
 * Creates: organization → intelligence profile → twin → default agents → swarm assignment
 */
async function provisionAccount({
  userId,
  email,
  fullName,
  planTierKey,
  role = 'client',
  verticalKey = null,
  swarmKey = null,
}: {
  userId: string
  email: string
  fullName?: string | null
  planTierKey: string
  role?: string
  verticalKey?: string | null
  swarmKey?: string | null
}) {
  const supabase = await createAdminClient()
  const name = fullName || email.split('@')[0]

  // ── 1. Update clients record ──
  const isTestAccount = planTierKey.includes('test')
  await supabase.from('clients').upsert({
    id: userId,
    full_name: name,
    email,
    plan_tier_key: planTierKey,
    client_type: role === 'creator' ? 'creator' : role === 'personal' ? 'personal' : role === 'affiliate' ? 'affiliate' : 'individual',
    status: isTestAccount ? 'admin_approved' : 'active',
    onboarding_status: 'pending',
    metadata: {
      plan_tier_key: planTierKey,
      billing_status: isTestAccount ? 'test_account' : 'active',
      provisioned_at: new Date().toISOString(),
      ...(isTestAccount ? { is_test_account: true, unlimited: true } : {}),
    },
  }, { onConflict: 'id' })

  // ── 2. Create organization ──
  const { data: org } = await supabase.from('organizations').insert({
    name: `${name}'s Intelligence`,
    owner_id: userId,
    slug: `${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_org`,
    industry: verticalKey || null,
    subscription_plan: planTierKey,
    subscription_status: 'active',
    settings: {
      vertical_key: verticalKey,
      swarm_key: swarmKey,
      plan_tier: planTierKey,
    },
  } as any).select().single()

  const orgId = org?.id

  // ── 3. Create human profile (blueprint/essence anchor) ──
  const { data: hp } = await (supabase.from('human_profiles') as any).insert({
    user_id: userId,
    email,
    first_name: fullName?.split(' ')[0] || email.split('@')[0],
    last_name: fullName?.split(' ').slice(1).join(' ') || null,
    identity_summary: `Business intelligence for ${name}`,
    daily_essence: null,
  }).select('id').single()

  // ── 4. Create intelligence profile (AI Twin data) ──
  let intelProfileId: string | null = null
  if (orgId) {
    const { data: intel } = await supabase.from('intelligence_profiles').insert({
      entity_type: 'organization',
      entity_id: orgId,
      organization_id: orgId,
      profile_kind: 'business_intelligence',
      identity_summary: `Business intelligence for ${name}`,
      profile_type: 'blueprint_derived',
      confidence_score: 0.5,
      version: 1,
    }).select('id').single()
    intelProfileId = (intel as any)?.id || null
  }

  // ── 5. Create AI Twin (joins human_profile + intelligence_profile) ──
  if (hp && intelProfileId) {
    await (supabase.from('ai_twins') as any).insert({
      human_profile_id: hp.id,
      intelligence_profile_id: intelProfileId,
      client_id: userId,
      twin_name: `${name}'s Twin`,
      twin_type: 'blueprint',
      active: true,
    })
  }

  // ── 6. Create Client Twin ──
  await supabase.from('client_twins').upsert({
    client_id: userId,
    organization_id: orgId || null,
    twin_status: 'active',
    version: 1,
    confidence_score: 0.5,
  }, { onConflict: 'client_id' })

  // ── 7. Create Zuri agent ──
  const { data: zuriAgent } = await supabase.from('agents').insert({
    client_id: userId,
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
  } as any).select().single()

  // ── 8. Create front-desk agent ──
  await supabase.from('agents').insert({
    client_id: userId,
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

  // ── 9. Assign swarm if specified ──
  const zuriId = (zuriAgent as any)?.id
  if (swarmKey && zuriId) {
    const { data: swarm } = await supabase.from('swarm_templates').select('*').eq('key', swarmKey).maybeSingle()
    const swarmRec = swarm as any
    if (swarmRec) {
      const members: number[] = (swarmRec.member_agents || [])
      if (!members.includes(zuriId)) {
        members.push(zuriId)
      }
      await supabase.from('swarm_templates').update({
        member_agents: members,
        metadata: {
          ...((swarmRec.metadata as Record<string, unknown>) || {}),
          assigned_to: userId,
          organization_id: orgId,
        },
      } as any).eq('key', swarmKey)
    }
  }

  // ── 10. Initialize entitlements (rpc functions need to exist in Supabase) ──
  if (orgId) {
    const { error: entErr } = await supabase.rpc('check_entitlement', {
      org_uuid: orgId,
      entitlement_key_param: 'agent_slots',
    } as any)
    if (entErr) {
      console.warn('Entitlement RPC not available (provisioning still OK):', entErr.message)
    }
  }

  // ── 11. Update users record ──
  await supabase.from('users').update({
    role,
    metadata: {
      plan_tier_key: planTierKey,
      organization_id: orgId,
      provisioned: true,
      provisioned_at: new Date().toISOString(),
    },
  }).eq('id', userId)

  return { orgId, zuriAgent: zuriAgent as any }
}

export async function POST(request: NextRequest) {
  try {
    const body: Record<string, unknown> = await request.json()
    const userId = body.userId as string
    const email = body.email as string
    const planTierKey = (body.planTierKey as string) || 'client_enterprise'
    const role = (body.role as string) || 'client'
    const verticalKey = (body.verticalKey as string) || null
    const swarmKey = (body.swarmKey as string) || null
    const fullName = (body.fullName as string) || null

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email required' }, { status: 400 })
    }

    const result = await provisionAccount({ userId, email, fullName, planTierKey, role, verticalKey, swarmKey })

    return NextResponse.json({
      success: true,
      message: 'Account provisioned',
      orgId: result.orgId,
    })
  } catch (error: any) {
    console.error('Provision error:', error)
    return NextResponse.json({ error: error.message || 'Provisioning failed' }, { status: 500 })
  }
}

export { provisionAccount }
