import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { user_id, email, role = 'client', display_name } = await req.json()

    if (!user_id || !email) {
      return NextResponse.json({ error: 'Missing user_id or email' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Check if citizen row already exists
    const { data: existing } = await supabase
      .from('ris_citizens')
      .select('id')
      .eq('supabase_user_id', user_id)
      .single()

    if (existing) {
      return NextResponse.json({ ok: true, message: 'Citizen already exists' })
    }

    // Create new citizen row
    const { error } = await supabase
      .from('ris_citizens')
      .insert({
        supabase_user_id: user_id,
        registered_name: display_name ?? email.split('@')[0],
        display_name: display_name ?? email.split('@')[0],
        role,
        status: 'active',
        tier: 'studio',
        access: 'standard',
        omni_score: 0,
        axis_balance: 0,
        intelligence_type: 'human',
        learning: true,
        evolution: true,
      })

    if (error) {
      console.error('ris_citizens insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('onSignup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}