import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/admin/accounts/setup
 *
 * Full manual account setup with:
 * 1. Auth user creation
 * 2. Users + clients records
 * 3. Organization + org membership
 * 4. Entitlements (from hardcoded defaults + plan tier)
 * 5. Optional agent/swarm deployment
 * 6. Intelligence profile + client twin
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email, password, fullName, role = 'client',
      planTier = null, isTestAccount = false, autoApprove = false,
      deployAgents = false, orgName = null,
    } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    let userId: string

    // ── 1. Create auth user ──
    try {
      const { data: rpcUserId } = await supabase.rpc('admin_create_user', {
        p_email: email,
        p_password: password,
        p_full_name: fullName || null,
        p_role: role,
      } as never) as any
      userId = rpcUserId
    } catch {
      // Fallback to GoTrue admin API
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: fullName, role },
      })
      if (authError) throw authError
      userId = authUser.user.id
      await supabase.from('users').upsert({ id: userId, email, full_name: fullName, role }, { onConflict: 'id' })
    }

    const name = fullName || email.split('@')[0]
    const effectiveTier = isTestAccount ? 'client_test' : (planTier || null)
    const clientStatus = autoApprove || isTestAccount ? 'admin_approved' : 'onboarding'

    // ── 2. Create/update clients record ──
    await supabaseAdmin.from('clients').upsert({
      id: userId,
      email,
      full_name: name,
      status: clientStatus,
      plan_tier_key: effectiveTier,
      client_type: role === 'creator' ? 'creator' : role === 'personal' ? 'personal' : 'individual',
      onboarding_status: autoApprove ? 'approved' : 'pending',
      metadata: {
        is_test_account: isTestAccount || false,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        billing_status: isTestAccount ? 'test_account' : (autoApprove ? 'auto_approved' : 'onboarding'),
      },
    }, { onConflict: 'id' })

    // ── 3. Ensure users record ──
    await supabaseAdmin.from('users').upsert({
      id: userId,
      email,
      full_name: name,
      role,
      metadata: {
        is_test_account: isTestAccount || false,
        created_by: 'admin',
      },
    }, { onConflict: 'id' })

    // ── 4. Create organization + membership ──
    const slug = `${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_org`
    const { data: org } = await supabaseAdmin.from('organizations').insert({
      name: orgName || `${name}'s Intelligence`,
      owner_id: userId,
      slug,
      subscription_plan: effectiveTier || 'onboarding',
      subscription_status: autoApprove ? 'active' : 'pending',
      plan_tier_key: effectiveTier,
      status: 'active',
    } as any).select().single()
    const orgId = org?.id

    if (orgId) {
      // Add owner to org_memberships
      await supabaseAdmin.from('organization_memberships').upsert({
        user_id: userId,
        organization_id: orgId,
        role: 'owner',
        status: 'active',
      } as never, { onConflict: 'user_id,organization_id' } as never)

      // ── 5. Create entitlements ──
      const isUnlimited = isTestAccount || effectiveTier?.includes('enterprise') || effectiveTier?.includes('test')
      const defaultEntitlements = [
        { feature_key: 'agent_slots', limit_value: isUnlimited ? 9999 : 10 },
        { feature_key: 'swarm_slots', limit_value: isUnlimited ? 9999 : 5 },
        { feature_key: 'workflow_runs_monthly', limit_value: isUnlimited ? 999999 : 1000 },
        { feature_key: 'api_calls_monthly', limit_value: isUnlimited ? 9999999 : 10000 },
        { feature_key: 'storage_gb', limit_value: isUnlimited ? 99999 : 5 },
        { feature_key: 'ai_memory_gb', limit_value: isUnlimited ? 999 : 1 },
      ]
      for (const ent of defaultEntitlements) {
        try { await supabaseAdmin.rpc('check_entitlement', { org_uuid: orgId, entitlement_key_param: ent.feature_key } as never) } catch {}
        await supabaseAdmin.from('entitlements').upsert({
          organization_id: orgId,
          feature_key: ent.feature_key,
          limit_value: ent.limit_value,
          usage_count: 0,
          is_enabled: true,
          source_type: isTestAccount ? 'test_account' : 'plan',
        } as never, { onConflict: 'organization_id,feature_key' } as never)
      }

      // ── 6. Create intelligence profile + client twin ──
      const { data: intel } = await supabaseAdmin.from('intelligence_profiles').insert({
        entity_type: 'organization',
        entity_id: orgId,
        organization_id: orgId,
        profile_kind: 'business_intelligence',
        identity_summary: `Business intelligence for ${name}`,
        profile_type: 'admin_created',
        version: 1,
      } as any).select().single()
      const intelId = (intel as any)?.id

      if (intelId) {
        await supabaseAdmin.from('client_twins').upsert({
          client_id: userId,
          organization_id: orgId,
          twin_status: 'active',
          version: 1,
        } as never, { onConflict: 'client_id' } as never)
      }
    }

    // ── 7. Deploy default agents if requested ──
    if (deployAgents && orgId) {
      const defaultAgents = [
        { agent_name: 'Zuri', role_type: 'CORE', capabilities: ['orchestration', 'analysis', 'recommendation', 'monitoring'] },
        { agent_name: 'Front Desk', role_type: 'VERTICAL', capabilities: ['intake', 'qualification', 'scheduling', 'routing'] },
      ]
      for (const ag of defaultAgents) {
        try {
          await supabaseAdmin.from('agents').insert({
            client_id: userId,
            organization_id: orgId,
            agent_name: ag.agent_name,
            role_type: ag.role_type,
            is_system_agent: true,
            status: 'active',
            health_status: 'ACTIVE',
            capabilities: ag.capabilities,
          } as never)
        } catch (e2: any) { console.warn(`Agent deploy skipped: ${e2.message}`) }
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      organizationId: orgId,
      message: `Account ${email} fully set up with org${orgId ? ' + entitlements' : ''}${deployAgents ? ' + agents' : ''}.`,
    })
  } catch (error: any) {
    console.error('Account setup error:', error)
    return NextResponse.json({ error: error.message || 'Failed to set up account' }, { status: 500 })
  }
}
