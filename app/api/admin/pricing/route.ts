import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const [tiersRes, entitlementsRes] = await Promise.all([
      supabaseAdmin.from('membership_tiers').select('*').order('created_at', { ascending: true }),
      supabaseAdmin.from('tier_entitlements').select('*').order('plan_key', { ascending: true }),
    ])

    if (tiersRes.error) throw tiersRes.error
    if (entitlementsRes.error) throw entitlementsRes.error

    return NextResponse.json({
      tiers: tiersRes.data || [],
      entitlements: entitlementsRes.data || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const body = await request.json()
    const action = body.action as string

    if (action === 'upsert_tier') {
      const { id, key, name, description, is_organization, is_creator,
              max_specialty_agents, max_custom_agents, max_workflows,
              max_swarm_capacity, max_memory_gbs, price_range, price_sweet_spot, status } = body

      if (id) {
        const { error } = await supabaseAdmin
          .from('membership_tiers')
          .update({
            key, name, description, is_organization, is_creator,
            max_specialty_agents, max_custom_agents, max_workflows,
            max_swarm_capacity, max_memory_gbs, price_range, price_sweet_spot, status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabaseAdmin
          .from('membership_tiers')
          .insert({
            key, name, description, is_organization, is_creator,
            max_specialty_agents, max_custom_agents, max_workflows,
            max_swarm_capacity, max_memory_gbs, price_range, price_sweet_spot,
            status: status || 'active',
          })
        if (error) throw error
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'delete_tier') {
      await supabaseAdmin.from('membership_tiers').delete().eq('id', body.id)
      await supabaseAdmin.from('tier_entitlements').delete().eq('plan_key', body.key)
      return NextResponse.json({ success: true })
    }

    if (action === 'upsert_entitlement') {
      const { id, plan_key, max_specialty_agents, max_custom_agents, max_swarm_capacity,
              max_workflows, max_ai_memory_gbs, can_use_legal_addon, can_use_wealth_addon,
              can_use_luxury_hospitality_addon, can_use_creator_commerce_addon, status } = body

      if (id) {
        const { error } = await supabaseAdmin
          .from('tier_entitlements')
          .update({
            plan_key, max_specialty_agents, max_custom_agents,
            max_swarm_capacity, max_workflows, max_ai_memory_gbs,
            can_use_legal_addon, can_use_wealth_addon,
            can_use_luxury_hospitality_addon, can_use_creator_commerce_addon,
            status, updated_at: new Date().toISOString(),
          })
          .eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabaseAdmin
          .from('tier_entitlements')
          .insert({
            plan_key, max_specialty_agents, max_custom_agents,
            max_swarm_capacity, max_workflows, max_ai_memory_gbs,
            can_use_legal_addon, can_use_wealth_addon,
            can_use_luxury_hospitality_addon, can_use_creator_commerce_addon,
            status: status || 'active',
          })
        if (error) throw error
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'delete_entitlement') {
      await supabaseAdmin.from('tier_entitlements').delete().eq('id', body.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
