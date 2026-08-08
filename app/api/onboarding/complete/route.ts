import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServiceClient } from '@/lib/supabase/server'
import { getN8nUrl } from '@/lib/config'

/**
 * POST /api/onboarding/complete
 *
 * Onboarding "catch-all" hook. Runs when a user finishes onboarding and
 * guarantees that the organization, client, twin, org membership, and related
 * rows are aligned and connected — even if payment or intake never created or
 * linked them — then fires downstream triggers (n8n webhook + notification).
 *
 * Idempotent: safe to call multiple times.
 *
 * IMPORTANT: createAdminClient() is used ONLY for auth.getUser() (session
 * verification). All DB operations use createServiceClient() — a raw
 * service-role client that never tracks user sessions, so queries bypass RLS.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify identity via cookie-based admin client
    const auth = await createAdminClient()
    const { data: { user } } = await auth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Brand/company payload collected on the onboarding brand step (optional).
    let brandPayload: { logoPath?: string | null; brandColors?: Record<string, string> | null; tagline?: string | null; description?: string | null } = {}
    try {
      brandPayload = await req.json()
    } catch {
      // No body (e.g. completion fired from done step without brand data)
    }

    const svc = createServiceClient()
    const userId = user.id
    const aligned: Record<string, unknown> = {}

    // 2. Load the client record (need full metadata + columns)
    const { data: client } = await svc
      .from('clients')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    const clientMeta = (client?.metadata as Record<string, any>) ?? {}
    const intakeSections = (clientMeta.intake as any)?.sections || {}
    const personal = intakeSections.personal || {}
    const business = intakeSections.business || {}

    const fullName = client?.full_name || personal.name || user.email?.split('@')[0] || 'New Client'
    const businessName = personal.businessName || business.businessName || null
    const firstName = personal.firstName || null
    const lastName = personal.lastName || null
    // `website` exists on the live clients table but not on the generated TS type
    const website = personal.website || (client as any)?.website || null

    // 3. Resolve the REAL organization id
    let orgId: string | null = null

    // a) Intake pattern: org where id = user.id
    const { data: orgById } = await svc
      .from('organizations')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (orgById?.id) {
      orgId = orgById.id
      aligned.organization = 'exists_by_user_id'
    }

    // b) Provision pattern: org where owner_id = user.id
    if (!orgId) {
      const { data: orgByOwner } = await svc
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle()

      if (orgByOwner?.id) {
        orgId = orgByOwner.id
        aligned.organization = 'exists_by_owner'
      }
    }

    // c) Create one
    if (!orgId) {
      try {
        const { data: createdOrg } = await svc
          .from('organizations')
          .insert({
            id: userId,
            name: businessName || fullName,
            owner_id: userId,
            status: 'active',
          } as any)
          .select('id')
          .single()
        if (createdOrg?.id) {
          orgId = createdOrg.id
          aligned.organization = 'created'
        }
      } catch (orgErr) {
        console.error('onboarding/complete: org create failed:', orgErr)
      }
    }

    // 4. Reconcile org → client
    if (orgId) {
      const clientUpdates: Record<string, unknown> = { organization_id: orgId }

      if (client?.onboarding_status && !['completed', 'approved', 'rejected'].includes(client.onboarding_status)) {
        clientUpdates.onboarding_status = 'completed'
      } else if (!client?.onboarding_status) {
        clientUpdates.onboarding_status = 'completed'
      }
      if (client?.status !== 'admin_rejected' && client?.status !== 'rejected') {
        clientUpdates.status = 'active'
      }
      if (firstName && !client?.first_name) clientUpdates.first_name = firstName
      if (lastName && !client?.last_name) clientUpdates.last_name = lastName
      if (businessName && !client?.business_name) clientUpdates.business_name = businessName
      if (website && !(client as any)?.website) clientUpdates.website = website

      try {
        const { error } = await svc.from('clients').update(clientUpdates as any).eq('id', userId)
        if (error) console.error('onboarding/complete: client update failed:', error.message)
        else aligned.client = 'aligned'
      } catch (clientErr) {
        console.error('onboarding/complete: client update error:', clientErr)
      }

      // Copy business info into org settings/metadata (merge, don't clobber)
      try {
        const { data: orgRow } = await svc
          .from('organizations')
          .select('settings, metadata')
          .eq('id', orgId)
          .maybeSingle()
        const orgRowData = orgRow as { settings?: Record<string, any> | null; metadata?: Record<string, any> | null } | null
        const existingSettings = (orgRowData?.settings as Record<string, any>) || {}
        const existingMeta = (orgRowData?.metadata as Record<string, any>) || {}

        const orgUpdates: Record<string, unknown> = {}

        // Intake business section → org metadata.business (merge, keep existing)
        if (Object.keys(business).length > 0) {
          orgUpdates.metadata = {
            ...existingMeta,
            business: {
              stage: business.businessStage || existingMeta.business?.stage,
              industries: business.industries || existingMeta.business?.industries,
              salesStyle: business.salesStyle || existingMeta.business?.salesStyle,
              automationLevel: business.automationLevel || existingMeta.business?.automationLevel,
              growthSpeed: business.growthSpeed || existingMeta.business?.growthSpeed,
              audienceCurrentSize: business.audienceCurrentSize || existingMeta.business?.audienceCurrentSize,
              audienceDesiredSize: business.audienceDesiredSize || existingMeta.business?.audienceDesiredSize,
              teamCurrentSize: business.teamCurrentSize || existingMeta.business?.teamCurrentSize,
              teamDesiredSize: business.teamDesiredSize || existingMeta.business?.teamDesiredSize,
              revenueGoals: business.revenueGoals || existingMeta.business?.revenueGoals,
              vision1Year: business.vision1Year || existingMeta.business?.vision1Year,
              vision3Year: business.vision3Year || existingMeta.business?.vision3Year,
              vision5Year: business.vision5Year || existingMeta.business?.vision5Year,
              vision10Year: business.vision10Year || existingMeta.business?.vision10Year,
              vision25Year: business.vision25Year || existingMeta.business?.vision25Year,
              techComfort: business.techComfort || existingMeta.business?.techComfort,
              purpose: business.purpose || existingMeta.business?.purpose,
              mission: business.mission || existingMeta.business?.mission,
            },
          }
        }

        if (website && !(orgRowData as any)?.website) {
          orgUpdates.website = website
        }

        // Brand/company payload from the onboarding brand step (logo, colors,
        // tagline, description) — persisted into org settings.brand.
        const brandColors =
          brandPayload.brandColors && Object.keys(brandPayload.brandColors).length > 0
            ? brandPayload.brandColors
            : existingSettings.brand?.colors || undefined

        if (brandPayload.logoPath) {
          orgUpdates.logo_url = brandPayload.logoPath
        }

        if (
          brandPayload.brandColors ||
          brandPayload.tagline ||
          brandPayload.description ||
          business.brandDescription ||
          business.brandPersonality ||
          existingSettings.brand
        ) {
          orgUpdates.settings = {
            ...existingSettings,
            brand: {
              personality: business.brandPersonality || existingSettings.brand?.personality,
              description: brandPayload.description || business.brandDescription || existingSettings.brand?.description,
              tagline: brandPayload.tagline || existingSettings.brand?.tagline,
              colors: brandColors,
              logo_path: brandPayload.logoPath || existingSettings.brand?.logo_path,
            },
          }
        }

        if (Object.keys(orgUpdates).length > 0) {
          const { error } = await svc.from('organizations').update(orgUpdates as any).eq('id', orgId)
          if (error) console.error('onboarding/complete: org update failed:', error.message)
          else aligned.org_info = 'aligned'
        }
      } catch (orgInfoErr) {
        console.error('onboarding/complete: org info update error:', orgInfoErr)
      }

      // Re-point knowledge_base rows that were written with organization_id = user.id
      // (organization_id exists on the live table but not the generated TS type)
      try {
        const { data: kbRows } = await svc
          .from('knowledge_base')
          .select('id')
          .eq('organization_id' as any, userId)
          .limit(100)
        if (kbRows && kbRows.length > 0 && orgId !== userId) {
          const { error } = await svc
            .from('knowledge_base')
            .update({ organization_id: orgId } as any)
            .eq('organization_id' as any, userId)
          if (error) console.error('onboarding/complete: knowledge_base repoint failed:', error.message)
          else aligned.knowledge_base = `repointed_${kbRows.length}`
        } else if (kbRows && kbRows.length > 0) {
          aligned.knowledge_base = `already_${orgId === userId ? 'user_id_org' : kbRows.length}`
        }
      } catch (kbErr) {
        console.error('onboarding/complete: knowledge_base repoint error:', kbErr)
      }

      // 5. Reconcile org membership (owner)
      try {
        const { data: member } = await svc
          .from('organization_members')
          .select('id')
          .eq('organization_id', orgId)
          .eq('user_id', userId)
          .maybeSingle()
        if (!member) {
          const { error } = await svc.from('organization_members').insert({
            organization_id: orgId,
            user_id: userId,
            role: 'owner',
            is_active: true,
          } as any)
          if (error) console.error('onboarding/complete: membership insert failed:', error.message)
          else aligned.membership = 'created'
        } else {
          aligned.membership = 'exists'
        }
      } catch (memErr) {
        console.error('onboarding/complete: membership error:', memErr)
      }

      // 6. Update users metadata organization_id (merge)
      try {
        const { data: userRow } = await svc
          .from('users')
          .select('metadata')
          .eq('id', userId)
          .maybeSingle()
        const userMeta = (userRow?.metadata as Record<string, any>) || {}
        const { error } = await svc
          .from('users')
          .update({ metadata: { ...userMeta, organization_id: orgId, onboarding_completed_at: new Date().toISOString() } })
          .eq('id', userId)
        if (error) console.error('onboarding/complete: users update failed:', error.message)
        else aligned.user = 'aligned'
      } catch (usrErr) {
        console.error('onboarding/complete: users update error:', usrErr)
      }

      // 7. Fire triggers (fire-and-forget, never block)
      try {
        const n8nWebhookUrl = `${getN8nUrl()}/webhook/onboarding-complete`
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            email: client?.email || user.email,
            organization_id: orgId,
            business_name: businessName,
            industries: business.industries || [],
            completed_at: new Date().toISOString(),
            source: 'onboarding_complete',
          }),
        }).catch(e => console.error('onboarding/complete: n8n webhook failed:', e))
      } catch (webhookErr) {
        console.error('onboarding/complete: webhook error:', webhookErr)
      }

      try {
        await svc.from('notification_logs').insert({
          client_id: userId,
          notification_type: 'onboarding_complete',
          channel: 'system',
          recipient: userId,
          subject: 'Onboarding Complete',
          message: `Onboarding completed for ${businessName || fullName}`,
          delivery_status: 'sent',
          metadata: {
            event_type: 'onboarding_complete',
            organization_id: orgId,
          },
        } as any)
      } catch (notifErr) {
        console.error('onboarding/complete: notification insert failed:', notifErr)
      }
    }

    return NextResponse.json({
      success: true,
      organization_id: orgId,
      aligned,
    })
  } catch (err) {
    console.error('Onboarding complete error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
