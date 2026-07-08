import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ── GET /api/memories ─────────────────────────────────────────
// List memories for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const memoryType = searchParams.get('type') // optional filter
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    let query = supabase
      .from('ai_memories')
      .select('id, entity_type, memory_type, content, title, created_at')
      .eq('entity_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    if (memoryType) {
      query = query.eq('memory_type', memoryType)
    }

    const { data: memories, error } = await query
    if (error) throw error

    return NextResponse.json({ memories: memories ?? [] })
  } catch (error: any) {
    console.error('Memories fetch error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch memories' },
      { status: 500 }
    )
  }
}

// ── POST /api/memories ────────────────────────────────────────
// Store a new memory
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, memoryType, title, entityType } = await req.json()
    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ai_memories')
      .insert({
        entity_id: user.id,
        entity_type: entityType || 'user',
        content: content.slice(0, 2000),
        memory_type: memoryType || 'note',
        title: title || `Memory - ${new Date().toISOString().split('T')[0]}`,
      })
      .select('id, memory_type, content, title, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ memory: data })
  } catch (error: any) {
    console.error('Memory store error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to store memory' },
      { status: 500 }
    )
  }
}

// ── DELETE /api/memories ──────────────────────────────────────
// Delete a specific memory by id
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('ai_memories')
      .delete()
      .eq('id', id)
      .eq('entity_id', user.id) // ensure user can only delete their own

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Memory delete error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to delete memory' },
      { status: 500 }
    )
  }
}
