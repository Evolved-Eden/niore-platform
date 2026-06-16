import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { provisionAccount } from '@/app/api/admin/provision/route'

export async function POST(req: NextRequest) {
  try {
    const { user_id, email, role = 'client', full_name, display_name, phone, plan_tier_key, path, addons } = await req.json()

    if (!user_id || !email) {
      return NextResponse.json({ error: 'Missing user_id or email' }, { status: 400 })
    }

    const validRoles = ['client', 'creator', 'personal', 'affiliate']
    const safeRole = validRoles.includes(role) ? role : 'client'
    const supabase = await createAdminClient()
    const name = full_name ?? display_name ?? email.split('@')[0]
    const requestedPlan = typeof plan_tier_key === 'string' && plan_tier_key.trim() ? plan_tier_key.trim() : null
    const requestedPath = typeof path === 'string' && validRoles.includes(path) ? path : safeRole
    const requestedAddons = Array.isArray(addons) ? addons.filter((addon) => typeof addon === 'string') : []

    // enterprise/test accounts auto-provision; others need payment
    const isEnterprise = requestedPlan?.includes('enterprise') ?? false
    const isTest = requestedPlan?.includes('test') ?? false
    const autoProvision = isEnterprise || isTest
    
    const profileMetadata = {
      requested_plan_tier_key: requestedPlan,
      requested_path: requestedPath,
      requested_addons: requestedAddons,
      billing_status: autoProvision ? 'auto_approved' : (requestedPlan ? 'pending_payment' : 'pending_plan_selection'),
    }

    const clientStatus = autoProvision
      ? 'admin_approved'
      : (requestedPlan === 'personal_free' ? 'pending' : 'onboarding')

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (existing) {
      await supabase
        .from('users')
        .update({
          full_name: name,
          phone: phone || null,
          role: safeRole,
          metadata: profileMetadata,
        })
        .eq('id', user_id)

      await supabase
        .from('clients')
        .upsert({
          id: user_id,
          full_name: name,
          email,
          phone: phone || null,
client_type: safeRole === 'creator' ? 'creator' : safeRole === 'personal' ? 'personal' : safeRole === 'affiliate' ? 'affiliate' : 'individual',
          status: clientStatus,
          onboarding_status: 'account_created',
          plan_tier_key: requestedPlan,
          metadata: profileMetadata,
        }, { onConflict: 'id' })

      // Auto-provision enterprise/test accounts
      if (autoProvision && requestedPlan) {
        provisionAccount({
          userId: user_id,
          email,
          fullName: name,
          planTierKey: requestedPlan,
          role: safeRole,
        }).catch((err: unknown) => console.error('auto-provision error:', err))
      }

      return NextResponse.json({ ok: true, message: 'User already exists' })
    }

    // Create user record (RIS = users table)
    const { error } = await supabase
      .from('users')
      .insert({
        id: user_id,
        full_name: name,
        email,
        phone: phone || null,
        role: safeRole,
        metadata: profileMetadata,
      })

    if (error) {
      console.error('users insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also create a client record
    await supabase
      .from('clients')
      .insert({
        id: user_id,
        full_name: name,
        email,
        phone: phone || null,
        client_type: safeRole === 'creator' ? 'creator' : safeRole === 'personal' ? 'personal' : safeRole === 'affiliate' ? 'affiliate' : 'individual',
        status: clientStatus,
        onboarding_status: 'account_created',
        plan_tier_key: requestedPlan,
        metadata: profileMetadata,
      })
      .then(r => {
        if (r.error) console.error('clients insert error:', r.error)
      })

    // Auto-provision enterprise/test accounts (fire-and-forget after user/client created)
    if (autoProvision && requestedPlan) {
      provisionAccount({
        userId: user_id,
        email,
        fullName: name,
        planTierKey: requestedPlan,
        role: safeRole,
      }).catch((err: unknown) => console.error('auto-provision error:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('onSignup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
