import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/blueprint/templates?vertical_key=beauty
 * Returns available blueprint templates, optionally filtered by vertical.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const vertical_key = req.nextUrl.searchParams.get('vertical_key')

    let query = supabase
      .from('blueprint_templates')
      .select('*', { count: 'exact', head: false })
      .eq('is_active', true)
      .order('name')

    if (vertical_key) {
      query = query.eq('vertical_key', vertical_key)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
