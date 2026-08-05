import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service client bypasses RLS on client_twins, scoped to the target client
    const { data: twin, error } = await ctx.svc
      .from('client_twins')
      .select('id, metadata')
      .eq('client_id', ctx.clientId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ twin })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
