import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await resolveApiClient(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await ctx.svc
    .from('journal_entries')
    .select('id, title, content, mood, shared_with, created_at, updated_at')
    .eq('user_id', ctx.clientId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data })
}

export async function POST(request: NextRequest) {
  const ctx = await resolveApiClient(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, mood } = (await request.json()) as { title?: string; content?: string; mood?: string }
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

  // New entries are always private -- shared_with is empty until the
  // author explicitly shares via PATCH. No path creates an already-shared entry.
  const { data, error } = await ctx.svc
    .from('journal_entries')
    .insert({ user_id: ctx.clientId, title, content, mood, shared_with: [] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
