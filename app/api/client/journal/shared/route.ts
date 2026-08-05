import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'

export const dynamic = 'force-dynamic'

// Entries shared with the TARGET client (the journal page renders for
// whoever's dashboard is open; access to that client is enforced by
// resolveApiClient, and entries are filtered to ones explicitly shared
// with that client's user id).
export async function GET(request: NextRequest) {
  const ctx = await resolveApiClient(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await ctx.svc
    .from('journal_entries')
    .select('id, user_id, title, content, mood, created_at, users:user_id(full_name)')
    .contains('shared_with', [ctx.clientId])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data })
}
