import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { provisionAccount } from '../provision/route'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, full_name, role, created_at,
        clients!inner (
          status, plan_tier_key, onboarding_status, client_type
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback: query users and clients separately
      const [usersRes, clientsRes] = await Promise.all([
        supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('clients').select('id, status, plan_tier_key, onboarding_status, client_type'),
      ])
      if (usersRes.error) throw usersRes.error

      const clientMap = new Map((clientsRes.data || []).map((c: any) => [c.id, c]))
      const joined = (usersRes.data || []).map((u: any) => {
        const c = clientMap.get(u.id) || {}
        return { ...u, client_status: c.status, plan_tier: c.plan_tier_key, onboarding_status: c.onboarding_status, client_type: c.client_type }
      })

      let filtered = joined
      if (status === 'pending') {
        filtered = joined.filter((u: any) =>
          u.client_status === 'pending_payment' || u.client_status === 'pending_approval' || u.client_status === null
        )
      } else if (status === 'approved') {
        filtered = joined.filter((u: any) => u.client_status === 'active' || u.client_status === 'admin_approved')
      } else if (status === 'test') {
        filtered = joined.filter((u: any) => u.plan_tier?.includes('test'))
      }

      return NextResponse.json({ users: filtered, total: filtered.length })
    }

    const joined = (users || []).map((u: any) => {
      const c = u.clients || {}
      return {
        ...u,
        client_status: c.status,
        plan_tier: c.plan_tier_key,
        onboarding_status: c.onboarding_status,
        client_type: c.client_type,
        clients: undefined,
      }
    })

    let filtered = joined
    if (status === 'pending') {
      filtered = joined.filter((u: any) =>
        u.client_status === 'pending_payment' || u.client_status === 'pending_approval' || u.client_status === null
      )
    } else if (status === 'approved') {
      filtered = joined.filter((u: any) => u.client_status === 'active' || u.client_status === 'admin_approved')
    } else if (status === 'test') {
      filtered = joined.filter((u: any) => u.plan_tier?.includes('test'))
    }

    return NextResponse.json({ users: filtered, total: filtered.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action as string
    const userId = body.userId as string

    if (action === 'approve') {
      // Preserve existing plan or default
      let planTier = body.plan as string | undefined
      if (!planTier) {
        const { data: existing } = await supabaseAdmin
          .from('clients')
          .select('plan_tier_key, email, full_name')
          .eq('id', userId)
          .maybeSingle()
        planTier = existing?.plan_tier_key || 'enterprise'
      }

      const role = (body.role as string) || 'client'
      const { error: userErr } = await supabaseAdmin
        .from('users')
        .update({ role })
        .eq('id', userId)
      if (userErr) throw userErr

      // Fetch current client + user data for provisioning
      const [userRes, clientRes] = await Promise.all([
        supabaseAdmin.from('users').select('email, full_name').eq('id', userId).maybeSingle(),
        supabaseAdmin.from('clients').select('email, full_name').eq('id', userId).maybeSingle(),
      ])
      const email = clientRes.data?.email || userRes.data?.email || ''
      const fullName = clientRes.data?.full_name || userRes.data?.full_name || null

      // Update plan_tier_key and status on clients (reliable — uses supabaseAdmin directly)
      const { error: clientErr } = await supabaseAdmin
        .from('clients')
        .update({
          status: 'active',
          plan_tier_key: planTier,
          onboarding_status: 'provisioning',
        })
        .eq('id', userId)
      if (clientErr) console.error('Failed to update client plan:', clientErr)

      // Call provisionAccount directly (not via HTTP fetch) to avoid auth/cookie issues
      try {
        await provisionAccount({ userId, email, fullName, planTierKey: planTier, role })
      } catch (provisionErr) {
        console.error('Provisioning failed:', provisionErr)
      }

      return NextResponse.json({ success: true, message: 'User approved' })
    }

    if (action === 'reject') {
      await supabaseAdmin
        .from('clients')
        .update({ status: 'rejected', onboarding_status: 'rejected' })
        .eq('id', userId)

      return NextResponse.json({ success: true, message: 'User rejected' })
    }

    if (action === 'suspend') {
      await supabaseAdmin
        .from('clients')
        .update({ status: 'suspended' })
        .eq('id', userId)

      return NextResponse.json({ success: true, message: 'User suspended' })
    }

    if (action === 'set_plan') {
      const plan = body.plan as string
      await supabaseAdmin
        .from('clients')
        .update({ plan_tier_key: plan })
        .eq('id', userId)

      return NextResponse.json({ success: true, message: `Plan set to ${plan}` })
    }

    if (action === 'delete') {
      await supabaseAdmin.from('clients').delete().eq('id', userId)
      await supabaseAdmin.from('users').delete().eq('id', userId)
      return NextResponse.json({ success: true, message: 'User deleted' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 })
  }
}
