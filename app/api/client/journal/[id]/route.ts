import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'
import type { JournalEntry } from '@/types'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await resolveApiClient(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const update: Partial<JournalEntry> = {}
  if (title !== undefined) update.title = title
  if (content !== undefined) update.content = content
  if (mood !== undefined) update.mood = mood

  // The author of the target client's journal entry -- the entry must
  // belong to the target client (access already verified above).
  const { data: existing, error: fetchError } = await ctx.svc
    .from('journal_entries')
    .select('shared_with, user_id')
    .eq('id', id)
    .eq('user_id', ctx.clientId)
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
    const { data: people } = await ctx.svc
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
    // Confirm the author (target client) is actually a member of the org they're sharing with.
    const { data: membership } = await ctx.svc
      .from('organization_members')
      .select('id')
      .eq('organization_id', shareWithOrg)
      .eq('user_id', ctx.clientId)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: "You're not a member of that organization" }, { status: 403 })
    }
    const { data: members } = await ctx.svc
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', shareWithOrg)
      .eq('status', 'active')
    const orgUserIds = (members || []).map((m) => m.user_id).filter((id) => id !== ctx.clientId)
    sharedWith = Array.from(new Set([...sharedWith, ...orgUserIds]))
    update.shared_with = sharedWith
  }

  if (shareWithRoles) {
    const { data: membership } = await ctx.svc
      .from('organization_members')
      .select('id')
      .eq('organization_id', shareWithRoles.organizationId)
      .eq('user_id', ctx.clientId)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: "You're not a member of that organization" }, { status: 403 })
    }
    const { data: members } = await ctx.svc
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', shareWithRoles.organizationId)
      .eq('status', 'active')
      .in('role', shareWithRoles.roles)
    const roleUserIds = (members || []).map((m) => m.user_id).filter((id) => id !== ctx.clientId)
    sharedWith = Array.from(new Set([...sharedWith, ...roleUserIds]))
    update.shared_with = sharedWith
  }

  if (unshareUserId) {
    update.shared_with = sharedWith.filter((id) => id !== unshareUserId)
  }

  const { data, error } = await ctx.svc
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
  const ctx = await resolveApiClient(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only the target client can delete their own entry.
  const { data: existing } = await ctx.svc
    .from('journal_entries')
    .select('id')
    .eq('id', id)
    .eq('user_id', ctx.clientId)
    .maybeSingle()
  if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  const { error } = await ctx.svc.from('journal_entries').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Deleted' })
}
