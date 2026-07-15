import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    title, content, mood,
    shareWithEmail, shareWithUsername, shareWithPhone, unshareUserId,
    shareWithOrg, shareWithRoles,
  } = body as {
    title?: string
    content?: string
    mood?: string
    shareWithEmail?: string     // looks up by email
    shareWithUsername?: string  // looks up by username
    shareWithPhone?: string     // looks up by phone
    unshareUserId?: string      // removes one person from shared_with
    shareWithOrg?: string       // organizationId — adds every member
    shareWithRoles?: { organizationId: string; roles: string[] } // adds members matching any of these roles
  }

  const update: Record<string, unknown> = {}
  if (title !== undefined) update.title = title
  if (content !== undefined) update.content = content
  if (mood !== undefined) update.mood = mood

  // RLS already restricts this whole route to the author, but we still
  // look up the current row via the authenticated client (not admin) so
  // that guarantee holds even if this code changes later.
  const { data: existing, error: fetchError } = await supabase
    .from('journal_entries')
    .select('shared_with')
    .eq('id', id)
    .single()
  if (fetchError || !existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  let sharedWith: string[] = existing.shared_with || []

  const personLookup = shareWithEmail
    ? { field: 'email', value: shareWithEmail }
    : shareWithUsername
    ? { field: 'username', value: shareWithUsername }
    : shareWithPhone
    ? { field: 'phone', value: shareWithPhone }
    : null

  if (personLookup) {
    const { data: people } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq(personLookup.field, personLookup.value)
      .limit(1)
    const person = people?.[0]
    if (!person) {
      return NextResponse.json({ error: `No account found for that ${personLookup.field}` }, { status: 404 })
    }
    if (!sharedWith.includes(person.id)) sharedWith = [...sharedWith, person.id]
    update.shared_with = sharedWith
  }

  if (shareWithOrg) {
    // Confirm the author is actually a member of the org they're sharing with.
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', shareWithOrg)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: "You're not a member of that organization" }, { status: 403 })
    }
    const { data: members } = await supabaseAdmin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', shareWithOrg)
      .eq('status', 'active')
    const orgUserIds = (members || []).map((m) => m.user_id).filter((id) => id !== user.id)
    sharedWith = Array.from(new Set([...sharedWith, ...orgUserIds]))
    update.shared_with = sharedWith
  }

  if (shareWithRoles) {
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', shareWithRoles.organizationId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: "You're not a member of that organization" }, { status: 403 })
    }
    const { data: members } = await supabaseAdmin
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', shareWithRoles.organizationId)
      .eq('status', 'active')
      .in('role', shareWithRoles.roles)
    const roleUserIds = (members || []).map((m) => m.user_id).filter((id) => id !== user.id)
    sharedWith = Array.from(new Set([...sharedWith, ...roleUserIds]))
    update.shared_with = sharedWith
  }

  if (unshareUserId) {
    update.shared_with = sharedWith.filter((id) => id !== unshareUserId)
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('journal_entries').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Deleted' })
}
