import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Invites a human onto the target client's Organization. This is entirely
// separate from Team (AI Team/Swarm) deployment — see /api/client/swarms/deploy
// for that. An Organization is people; a Team is deployed intelligence.
//
// v1: the invited person must already have an account, found by username,
// email, or phone. Invites for people without an account yet are a
// follow-up — would wire through Resend, which is already connected.
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveApiClient(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, username, phone, role, organizationId, orgName } = body as {
      email?: string
      username?: string
      phone?: string
      role?: string
      organizationId?: string | null
      orgName?: string
    }

    const identifier = email
      ? { field: 'email', value: email }
      : username
      ? { field: 'username', value: username }
      : phone
      ? { field: 'phone', value: phone }
      : null

    if (!identifier) {
      return NextResponse.json({ error: 'Email, username, or phone is required' }, { status: 400 })
    }

    let orgId = organizationId || null
    const now = new Date().toISOString()

    // Create the organization if the current user doesn't have one yet,
    // and make them its owner.
    if (!orgId) {
      if (!orgName) {
        return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
      }
      const newOrgId = crypto.randomUUID()
      const slug = `${orgName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${newOrgId.slice(0, 8)}`
      const { error: orgInsertError } = await ctx.svc.from('organizations').insert({
        id: newOrgId,
        name: orgName,
        owner_id: ctx.clientId,
        slug,
        status: 'active',
        created_at: now,
        updated_at: now,
      } as any)
      if (orgInsertError) throw orgInsertError

      const { error: ownerInsertError } = await ctx.svc.from('organization_members').upsert(
        {
          organization_id: newOrgId,
          user_id: ctx.clientId,
          role: 'owner',
          status: 'active',
          is_paid_member: true,
          joined_at: now,
        } as any,
        { onConflict: 'organization_id,user_id' } as any
      )
      if (ownerInsertError) throw ownerInsertError

      orgId = newOrgId
    }

    // Look up the invited person by whichever identifier was given — v1
    // requires an existing account.
    const { data: foundUsers, error: lookupError } = await ctx.svc
      .from('users')
      .select('id, full_name, email')
      .eq(identifier.field, identifier.value)
      .limit(1)

    if (lookupError) throw lookupError
    const invitedUser = foundUsers?.[0]

    if (!invitedUser) {
      return NextResponse.json(
        { error: `No account found for that ${identifier.field}. They'll need to sign up first, then you can invite them.` },
        { status: 404 }
      )
    }

    // Don't double-invite.
    const { data: existingMembership } = await ctx.svc
      .from('organization_members')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('user_id', invitedUser.id)
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json(
        { error: `${invitedUser.full_name || invitedUser.email} is already ${existingMembership.status === 'active' ? 'a member' : 'invited'}.` },
        { status: 409 }
      )
    }

    const { error: memberInsertError } = await ctx.svc.from('organization_members').upsert(
      {
        organization_id: orgId,
        user_id: invitedUser.id,
        role: role || 'member',
        status: 'invited',
        invited_by: ctx.clientId,
        invited_at: now,
      } as any,
      { onConflict: 'organization_id,user_id' } as any
    )
    if (memberInsertError) throw memberInsertError

    return NextResponse.json({
      message: `Invited ${invitedUser.full_name || invitedUser.email} to your organization.`,
      organizationId: orgId,
    })
  } catch (error: any) {
    console.error('POST /api/client/organization/invite failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
