import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { provisionAccount } from '@/app/api/admin/provision/route'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 500)
    const offset = (page - 1) * limit

    let sbQuery = supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact' })

    if (status) sbQuery = sbQuery.eq('status', status)

    const { data, count, error } = await sbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return NextResponse.json({ clients: data || [], count: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / limit) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const body = await request.json()
    const { action, clientId } = body

    // Action-based operations (called from ClientsTable)
    if (action) {
      if (!clientId) {
        return NextResponse.json({ error: 'clientId required' }, { status: 400 })
      }

      if (action === 'activate') {
        const { error } = await supabaseAdmin
          .from('clients')
          .update({ status: 'active', onboarding_status: 'completed' })
          .eq('id', clientId)
        if (error) throw error
        return NextResponse.json({ success: true, message: 'Client activated' })
      }

      if (action === 'reject') {
        const { error } = await supabaseAdmin
          .from('clients')
          .update({ status: 'rejected', onboarding_status: 'rejected' })
          .eq('id', clientId)
        if (error) throw error
        return NextResponse.json({ success: true, message: 'Client rejected' })
      }

      if (action === 'suspend') {
        const { error } = await supabaseAdmin
          .from('clients')
          .update({ status: 'suspended' })
          .eq('id', clientId)
        if (error) throw error
        return NextResponse.json({ success: true, message: 'Client suspended' })
      }

      if (action === 'set_plan') {
        let plan = body.plan as string
        const PREFIX_MAP: Record<string, string> = {
          'founder': 'client_founder',
          'team': 'client_org',
          'enterprise': 'client_enterprise',
          'studio': 'creator_studio',
          'premium': 'creator_premium',
          'concierge': 'creator_concierge',
        }
        if (PREFIX_MAP[plan]) plan = PREFIX_MAP[plan]
        const { error } = await supabaseAdmin
          .from('clients')
          .update({ plan_tier_key: plan })
          .eq('id', clientId)
        if (error) throw error
        return NextResponse.json({ success: true, message: `Plan set to ${plan}` })
      }

      if (action === 'set_additional_plans') {
        const plans = body.plans as string[]
        const { error } = await supabaseAdmin
          .from('clients')
          .update({ additional_plans: plans })
          .eq('id', clientId)
        if (error) throw error
        return NextResponse.json({ success: true, message: `Additional plans updated` })
      }

      if (action === 'set_addons') {
        const addons = body.addons as string[]
        const { error } = await supabaseAdmin
          .from('clients')
          .update({ addons })
          .eq('id', clientId)
        if (error) throw error
        return NextResponse.json({ success: true, message: `Add-ons updated` })
      }

      if (action === 'delete') {
        await supabaseAdmin.from('clients').delete().eq('id', clientId)
        return NextResponse.json({ success: true, message: 'Client deleted' })
      }

      if (action === 'update') {
        const updates = body.updates as Record<string, any>
        if (!updates || Object.keys(updates).length === 0) {
          return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
        }
        const { error } = await supabaseAdmin
          .from('clients')
          .update(updates)
          .eq('id', clientId)
        if (error) throw error
        return NextResponse.json({ success: true, message: 'Client updated' })
      }

      if (action === 'provision') {
        // Fetch client record to get email, full_name, etc.
        const { data: client } = await supabaseAdmin
          .from('clients')
          .select('id, email, full_name, plan_tier_key, client_type, primary_specialty')
          .eq('id', clientId)
          .single()
        if (!client) {
          return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }
        const planTierKey = client.plan_tier_key || 'client_founder'
        const result = await provisionAccount({
          userId: client.id,
          email: client.email || '',
          fullName: client.full_name || null,
          planTierKey,
          role: client.client_type === 'creator' ? 'creator' : 'client',
          specialtyKey: client.primary_specialty || null,
          swarmKey: null,
        })
        return NextResponse.json({ success: true, message: 'Account provisioned', orgId: result.orgId })
      }

      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    // Direct INSERT (backwards compatibility)
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert(body)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, client: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
