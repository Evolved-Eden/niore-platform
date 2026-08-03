import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { STRIPE_API_VERSION } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { lazy } from '@/lib/lazy-client'

const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))

async function activatePaidAccess({
  userId,
  email,
  tier,
  path,
  addons = [],
  stripeCustomerId,
  stripeSubscriptionId,
}: {
  userId: string
  email: string
  tier: string
  path: string
  addons?: string[]
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}) {
  if (!userId || !tier) return

  await supabaseAdmin
    .from("clients")
    .upsert({
      id: userId,
      email,
      plan_tier_key: tier,
      client_type: path || "individual",
      status: "active",
      onboarding_status: "payment_confirmed",
      metadata: {
        plan_tier_key: tier,
        path,
        purchased_addons: addons,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        billing_status: "active",
      },
      ...(addons.length > 0 ? { addons: addons.reduce((acc: Record<string, boolean>, a: string) => ({ ...acc, [a]: true }), {}) } : {}),
    }, { onConflict: "id" })

  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("metadata")
    .eq("id", userId)
    .maybeSingle()

  await supabaseAdmin
    .from("users")
    .update({
      metadata: {
        ...((userData?.metadata as Record<string, unknown>) ?? {}),
        plan_tier_key: tier,
        path,
        purchased_addons: addons,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        billing_status: "active",
      },
    })
    .eq("id", userId)
}

async function getOrCreateOrg(userId: string, userName: string, tierKey: string) {
  const { data: existingOrg } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (existingOrg) return existingOrg

  // Only Client-family tiers (Founder/Teams/Enterprise -- membership_tiers.is_organization
  // = true) get an organization. Personal/Affiliate/Creator tiers, and events with no tier
  // at all (pure OS-addon purchases on an existing account), must NOT create one. This used
  // to insert an org unconditionally for every checkout.session.completed event regardless
  // of tier, which is the loophole flagged during the RLS/entitlement audit.
  if (!tierKey) return null

  const { data: tierRow } = await supabaseAdmin
    .from('membership_tiers')
    .select('is_organization')
    .eq('key', tierKey)
    .maybeSingle()

  if (!tierRow?.is_organization) return null

  // Delegate to the canonical provisioning path (handles slug generation, the
  // owner's membership row, default entitlements, and Core OS auto-activation)
  // instead of duplicating that logic here.
  const { data: newOrgId, error } = await supabaseAdmin.rpc('provision_organization_for_tier', {
    p_user_id: userId,
    p_tier_key: tierKey,
  })

  if (error || !newOrgId) {
    console.error('provision_organization_for_tier failed in Stripe webhook:', error)
    return null
  }

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('id', newOrgId)
    .maybeSingle()

  return org
}

// NOTE: this used to insert into `intelligence_profiles`, a table that
// migration 00021_schema_consolidation.sql explicitly retired ("LEGACY --
// unused. Intelligence data lives in client_twins / agents.") -- but the
// live table was never actually created, so every call here was silently
// failing (supabaseAdmin swallows the error since only `data` is read).
// Removed. upsertClientTwin() + createZuriAgent() below are the real
// Base Twin / Core Agent provisioning steps per the Eden Core System model.

async function recordAffiliateConversion({
  userId,
  purchaseId,
  purchaseAmount,
  tierKey,
}: {
  userId: string
  purchaseId: string
  purchaseAmount: number
  tierKey?: string | null
}) {
  try {
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('metadata')
      .eq('id', userId)
      .maybeSingle()

    const linkId = (userRow?.metadata as Record<string, unknown> | null)?.referred_by_affiliate_link_id as string | undefined
    if (!linkId) return

    const { data: link } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, owner_user_id, owner_organization_id, conversions_count')
      .eq('id', linkId)
      .maybeSingle()
    if (!link) return

    const { data: affiliateClient } = await supabaseAdmin
      .from('clients')
      .select('plan_tier_key')
      .eq('id', link.owner_user_id)
      .maybeSingle()

    let commissionRate = 0
    if (affiliateClient?.plan_tier_key) {
      const { data: tier } = await supabaseAdmin
        .from('membership_tiers')
        .select('commission_rate')
        .eq('key', affiliateClient.plan_tier_key)
        .maybeSingle()
      commissionRate = Number(tier?.commission_rate ?? 0)
    }
    if (commissionRate <= 0) return

    const { data: event } = await supabaseAdmin
      .from('affiliate_link_events')
      .insert({
        affiliate_link_id: link.id,
        event_type: 'conversion',
        converted_user_id: userId,
        converted_purchase_id: purchaseId,
      })
      .select('id')
      .single()

    await supabaseAdmin
      .from('affiliate_links')
      .update({ conversions_count: (link.conversions_count ?? 0) + 1 })
      .eq('id', link.id)

    const commissionAmount = Number(purchaseAmount) * commissionRate
    const payoutDelayDays = 30

    await supabaseAdmin.from('affiliate_commission_accruals').insert({
      affiliate_link_event_id: event?.id,
      affiliate_link_id: link.id,
      affiliate_user_id: link.owner_user_id,
      affiliate_organization_id: link.owner_organization_id,
      membership_tier_key: affiliateClient?.plan_tier_key,
      commission_rate_applied: commissionRate,
      purchase_amount: purchaseAmount,
      commission_amount: commissionAmount,
      currency: 'usd',
      status: 'pending',
      payout_delay_days: payoutDelayDays,
      eligible_for_payout_at: new Date(Date.now() + payoutDelayDays * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (err) {
    console.error('recordAffiliateConversion failed (non-fatal):', err)
  }
}

// Activates (or upgrades) an OS package for an organization -- the
// canonical record of "this org/human currently has X active," which
// supports multiple concurrent OS's on one org (personal_os + family_os +
// creator_os all at once) and doubles as the Blueprint Passive/Active/
// Mastered state per system.
async function activateEssintelligence(params: {
  organizationId: string
  essintelligenceKey: string
  tierLevel?: 'standard' | 'prime' | 'elite'
  source?: string
}) {
  const { organizationId, essintelligenceKey, tierLevel = 'standard', source = 'checkout' } = params
  if (!organizationId || !essintelligenceKey) return null

  // NOTE: this used to query `organization_os_activations`, a table that
  // never existed -- the real table has always been `os_activations`
  // (renamed to `organization_essintelligence_activations`). Because the
  // old code only destructured `data` and never checked `error`, every
  // checkout silently failed to activate anything and nothing surfaced.
  // Fixed here: correct table name, and errors now throw instead of being
  // swallowed, so a real failure is visible in logs/monitoring again.
  const { data, error } = await supabaseAdmin
    .from('organization_essintelligence_activations')
    .upsert(
      {
        organization_id: organizationId,
        item_type: 'essintelligence',
        item_key: essintelligenceKey,
        tier_level: tierLevel,
        state: 'active',
        source,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,item_type,item_key' }
    )
    .select()
    .single()

  if (error) {
    console.error('activateEssintelligence failed:', error)
    throw error
  }

  return data
}

// Best-effort audit trail for provisioning events -- audit_logs is the
// canonical consolidated log (replaces the old empty _deprecated_entity_audit_log stub).
async function logProvisioningEvent(params: {
  organizationId?: string | null
  userId?: string | null
  action: string
  resourceType?: string
  afterState?: Record<string, unknown>
}) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      organization_id: params.organizationId ?? null,
      user_id: params.userId ?? null,
      action: params.action,
      resource_type: params.resourceType ?? 'organization',
      after_state: params.afterState ?? {},
    })
  } catch (err) {
    // Non-fatal -- never let audit logging break provisioning.
    console.error('audit_logs insert failed:', err)
  }
}

async function upsertClientTwin(userId: string, orgId: string | null) {
  await supabaseAdmin
    .from("client_twins")
    .upsert({
      client_id: userId,
      organization_id: orgId,
      twin_status: "active",
      version: 1,
      confidence_score: 0.5,
    }, { onConflict: "client_id" })
}

async function createZuriAgent(userId: string, orgId: string) {
  const { data: existing } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('client_id', userId)
    .eq('agent_name', 'Zuri')
    .maybeSingle()

  if (existing) return existing

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .insert({
      client_id: userId,
      organization_id: orgId,
      agent_name: "Zuri",
      role_type: "CORE",
      is_system_agent: true,
      status: "active",
      health_status: "ACTIVE",
      decision_mode: "ADVISORY",
      autonomy_level: 8,
      authority_level: 9,
      risk_level: 3,
      capabilities: ["orchestration", "analysis", "recommendation", "monitoring"],
    })
    .select()
    .single()

  return agent
}

async function lookupAgentRegistry(agentIds: string[]) {
  const { data: agents } = await supabaseAdmin
    .from('agent_catalog')
    .select('*')
    .in('agent_id', agentIds)

  const map: Record<string, any> = {}
  for (const a of (agents || [])) {
    map[a.agent_id] = a
  }
  return map
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const meta = paymentIntent.metadata || {}
    const userId = meta.supabase_user_id || meta.user_id || ""
    const tier = meta.raw_tier || meta.tier || ""
    const path = tier.split("_")[0] || meta.path || ""
    const email = meta.email || ""

    if (userId && tier) {
      await activatePaidAccess({
        userId,
        email,
        tier,
        path,
        stripeCustomerId: typeof paymentIntent.customer === "string" ? paymentIntent.customer : null,
        stripeSubscriptionId: null,
      })
    }

    // ── Marketplace catalog item purchase (creator marketplace) ──
    // Distinct metadata shape from the deposit flow above -- set by
    // app/api/marketplace/checkout, not the tier-deposit checkout.
    if (meta.purchase_type === "marketplace_catalog_item") {
      const catalogItemId = meta.catalog_item_id || ""
      const sellerOrgId = meta.seller_organization_id || ""

      const { data: purchase } = await supabaseAdmin
        .from("catalog_purchases")
        .update({ status: "succeeded", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .select("id, seller_net_amount, currency, buyer_user_id")
        .single()

      if (purchase?.buyer_user_id) {
        await recordAffiliateConversion({
          userId: purchase.buyer_user_id,
          purchaseId: paymentIntent.id,
          purchaseAmount: Number(paymentIntent.amount) / 100,
        })
      }

      if (purchase && sellerOrgId) {
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("id, balance")
          .eq("organization_id", sellerOrgId)
          .maybeSingle()

        let walletId = wallet?.id
        if (!walletId) {
          const { data: newWallet } = await supabaseAdmin
            .from("wallets")
            .insert({ organization_id: sellerOrgId, balance: 0, currency: purchase.currency || "USD" })
            .select("id")
            .single()
          walletId = newWallet?.id
        }

        if (walletId) {
          await supabaseAdmin.from("wallet_transactions").insert({
            wallet_id: walletId,
            transaction_type: "marketplace_sale",
            amount: purchase.seller_net_amount,
            metadata: { catalog_item_id: catalogItemId, stripe_payment_intent_id: paymentIntent.id },
          })

          await supabaseAdmin
            .from("wallets")
            .update({ balance: Number(wallet?.balance ?? 0) + Number(purchase.seller_net_amount ?? 0) })
            .eq("id", walletId)
        }
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const meta = paymentIntent.metadata || {}
    if (meta.purchase_type === "marketplace_catalog_item") {
      await supabaseAdmin
        .from("catalog_purchases")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id)
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};

    const email = session.customer_details?.email || session.customer_email || meta.email || ""
    if (!email) {
      return NextResponse.json({ received: true, note: "no email" })
    }

    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id, full_name")
      .eq("email", email)
      .single()

    const userId = meta.user_id || userData?.id || ""
    if (!userId) {
      return NextResponse.json({ received: true, note: "no user found" })
    }

    const tier = meta.tier || ""
    const path = meta.path || ""
    let addons: string[] = []
    try { addons = JSON.parse(meta.addons || "[]") } catch {}

    // ── 1. Activate paid access (updates clients + users) ──
    if (tier) {
      await activatePaidAccess({
        userId,
        email,
        tier,
        path,
        addons,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
        stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
      })

      await recordAffiliateConversion({
        userId,
        purchaseId: session.id,
        purchaseAmount: (session.amount_total ?? 0) / 100,
        tierKey: tier,
      })

      // Save Stripe customer/subscription reference
      if (session.customer) {
        await supabaseAdmin
          .from("memberships")
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: (session.subscription || "") as string,
            status: "active",
          }, { onConflict: "user_id" })
      }
    }

    // ── 2. Handle standalone product purchases (expanded blueprint, domains) ──
    let products: string[] = []
    try { products = JSON.parse(meta.products || "[]") } catch {}

    if (products.length > 0) {
      const { data: twin } = await supabaseAdmin
        .from("client_twins")
        .select("id, metadata")
        .eq("client_id", userId)
        .single()

      const twinMeta: Record<string, any> = (twin as any)?.metadata || {}
      const newlyPurchasedDomains: string[] = []

      for (const pid of products) {
        if (pid === "expanded_blueprint") {
          twinMeta.essence_assessment_expanded = true
        } else if (pid === "enhanced_blueprint") {
          twinMeta.essence_assessment_enhanced = true
        } else if (pid.startsWith("domain_")) {
          const domains: string[] = twinMeta.purchased_domains || []
          if (!domains.includes(pid)) {
            domains.push(pid)
            newlyPurchasedDomains.push(pid)
          }
          twinMeta.purchased_domains = domains
        }
      }

      if (twin) {
        await supabaseAdmin
          .from("client_twins")
          .update({ metadata: twinMeta })
          .eq("id", twin.id)
      } else {
        await supabaseAdmin
          .from("client_twins")
          .insert({
            client_id: userId,
            twin_status: "active",
            version: 1,
            metadata: twinMeta,
          } as any)
      }

      // WF-106/107: the metadata unlock above already ran (and already did,
      // before this pass) -- the one real gap was no confirmation email ever
      // went out. Send one now for whichever products were purchased.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      if (appUrl) {
        try {
          const { sendEmail } = await import("@/lib/email")
          if (products.includes("expanded_blueprint") || products.includes("enhanced_blueprint")) {
            await sendEmail({
              to: email,
              subject: "Your expanded Blueprint tier is unlocked",
              html: `<p>Your Blueprint tier has been unlocked. <a href="${appUrl}/dashboard/client/essence-profile">View your full Blueprint</a>.</p>`,
            })
          }
          for (const pid of newlyPurchasedDomains) {
            const domainKey = pid.replace(/^domain_/, "")
            await sendEmail({
              to: email,
              subject: "Your Domain Module is ready",
              html: `<p>Your ${domainKey.replace(/_/g, " ")} Domain Module is ready. <a href="${appUrl}/dashboard/client/essence-profile/domain">Start your assessment</a>.</p>`,
            })
          }
        } catch (emailError) {
          console.error("WF-106/107 confirmation email failed:", emailError)
        }
      }
    }

    // ── Twin transfer: departing org member paid to keep their Twin's
    // current capability level. Only NOW (payment confirmed) does the twin
    // actually detach from the org — org_entitlements become permanently
    // theirs, relabeled as personal. Org-scoped work was never touched;
    // it stayed with the org the moment they were removed.
    if (meta.twin_transfer === "true" && meta.user_id) {
      const { data: transferringTwin } = await supabaseAdmin
        .from("client_twins")
        .select("id, metadata")
        .eq("client_id", meta.user_id)
        .eq("organization_id", meta.previous_org_id || "")
        .maybeSingle()

      if (transferringTwin) {
        const twinMeta = { ...(transferringTwin.metadata || {}) } as Record<string, any>
        const orgEntitlements = twinMeta.org_entitlements
        delete twinMeta.org_entitlements
        if (orgEntitlements) twinMeta.personal_entitlements = orgEntitlements
        twinMeta.transferred_from_org = meta.previous_org_id
        twinMeta.transferred_at = new Date().toISOString()

        await supabaseAdmin
          .from("client_twins")
          .update({ organization_id: null, metadata: twinMeta })
          .eq("id", transferringTwin.id)
      }

      try {
        const { data: transferredUser } = await supabaseAdmin
          .from("users")
          .select("email, full_name")
          .eq("id", meta.user_id)
          .maybeSingle()
        if (transferredUser?.email) {
          const { sendEmail } = await import("@/lib/email")
          await sendEmail({
            to: transferredUser.email,
            subject: "Your Twin is now yours, personally",
            html: `<p>Hi${transferredUser.full_name ? ` ${transferredUser.full_name}` : ""},</p><p>Your Twin has transferred to your personal account and keeps everything it had. It's no longer tied to your former organization.</p>`,
          })
        }
      } catch (emailError) {
        console.error("Twin transfer confirmation email failed:", emailError)
      }
    }

    // ── 3. Provision org + Base Twin + Zuri (idempotent) ──
    const org = await getOrCreateOrg(userId, userData?.full_name || email.split('@')[0], tier)
    if (org) {
      await upsertClientTwin(userId, org.id)
      await createZuriAgent(userId, org.id)

      // Core Essintelligence build: buying a membership tier means the
      // corresponding system build gets activated -- this is the mechanism
      // for "membership tier purchase = core system build". Wrapped in
      // try/catch (not left to throw uncaught) so a failure here is now
      // loud (logged, unlike before) without blocking the rest of
      // provisioning -- Twin/Zuri are already created above regardless.
      if (tier) {
        try {
          await activateEssintelligence({ organizationId: org.id, essintelligenceKey: tier, source: 'checkout' })
        } catch (err) {
          console.error(`Essintelligence activation failed for tier ${tier}, org ${org.id}:`, err)
        }
      }

      // Essintelligence Modules purchased alongside the base tier (optional
      // deeper-build layers on top of the core build -- formerly sold as
      // standalone "OS Packages") each get their own activation row, so one
      // org/human can hold several concurrently.
      for (const addonKey of addons) {
        try {
          await activateEssintelligence({ organizationId: org.id, essintelligenceKey: addonKey, source: 'checkout_addon' })
        } catch (err) {
          console.error(`Essintelligence module activation failed for ${addonKey}, org ${org.id}:`, err)
        }
      }

      // Connector Pack is a stackable usage pack (+100 DMs / +200 emails per
      // purchase), not an Essintelligence Module -- tracked as a plain
      // incrementing counter on the client row
      // (clients.connector_pack_quantity), read by
      // check_and_increment_connector_usage() at send time. Kept separate
      // from activateEssintelligence on purpose -- Connector Pack applies
      // uniformly across tiers, not as a per-tier build layer.
      const connectorPackCount = addons.filter((a: string) => a === 'connector_pack' || a === 'connector-pack').length
      if (connectorPackCount > 0) {
        await supabaseAdmin.rpc('increment', {
          table_name: 'clients',
          row_id: userId,
          column_name: 'connector_pack_quantity',
          amount: connectorPackCount,
        }).then(async (res: any) => {
          // Fallback if a generic increment() RPC doesn't exist in this
          // project -- do it as a plain read-then-write instead. Less safe
          // under concurrency than an atomic RPC, acceptable for a
          // low-frequency purchase event.
          if (res.error) {
            const { data: current } = await supabaseAdmin
              .from('clients')
              .select('connector_pack_quantity')
              .eq('id', userId)
              .single()
            await supabaseAdmin
              .from('clients')
              .update({ connector_pack_quantity: (current?.connector_pack_quantity ?? 0) + connectorPackCount })
              .eq('id', userId)
          }
        })
      }

      // additional_intelligence: was priced (see ADDON_AMOUNTS) but never
      // actually fulfilled anything. This is that fulfillment -- creates a
      // second, independent Twin (organization_id always null) the person
      // builds and can list in the Twin Registry entirely on their own,
      // without touching their org-governed Twin at all.
      if (addons.includes('additional_intelligence')) {
        await supabaseAdmin.from('client_twins').insert({
          client_id: userId,
          organization_id: null,
          is_independent: true,
          twin_status: 'active',
          version: 1,
        } as any)
      }

      await logProvisioningEvent({
        organizationId: org.id,
        userId,
        action: 'checkout_provisioned',
        resourceType: 'organization',
        afterState: { tier, path, addons },
      })
    }

    // ── 4. Provision selected agents from checkout ──
    let agentIds: string[] = [];
    try { agentIds = JSON.parse(meta.agent_ids || "[]"); } catch {}

    if (agentIds.length > 0 && org) {
      const registryMap = await lookupAgentRegistry(agentIds)
      const vertical = meta.vertical || ""

      const agentRecords = agentIds
        .map((agentId: string) => {
          const reg = registryMap[agentId]
          if (!reg) return null
          return {
            organization_id: org.id,
            client_id: userId,
            agent_name: reg.name,
            agent_id: agentId,
            role_type: "VERTICAL",
            vertical,
            is_active: true,
            status: "active",
            health_status: "ACTIVE" as const,
            decision_mode: "ADVISORY" as const,
            autonomy_level: 6,
            authority_level: 5,
            risk_level: 2,
            capabilities: reg.capabilities || [],
            metadata: {
              source: "checkout",
              vertical,
              agent_id_ref: agentId,
            },
          }
        })
        .filter(Boolean)

      if (agentRecords.length > 0) {
        const { data: insertedAgents } = await supabaseAdmin
          .from("agents")
          .insert(agentRecords as any)
          .select()

        // ── 4a. Insert into client_deployed_agents ──
        if (insertedAgents && insertedAgents.length > 0) {
          const deployRecords = insertedAgents.map((a: any) => ({
            client_id: userId,
            agent_id: a.id,
            agent_name: a.agent_name,
            role_type: a.role_type,
            vertical: a.vertical,
            deployment_status: "active",
            metadata: a.metadata,
          }))
          await supabaseAdmin
            .from("client_deployed_agents")
            .insert(deployRecords as any)
        }
      }
    }

    // ── 5. Assign swarm if specified ──
    const swarmKey = meta.swarm_key || ""
    if (swarmKey && org) {
      const { data: swarm } = await supabaseAdmin
        .from("swarm_templates")
        .select("*")
        .eq("key", swarmKey)
        .maybeSingle()

      if (swarm) {
        const members: any[] = (swarm as any).member_agents || []
        await supabaseAdmin
          .from("swarm_templates")
          .update({
            member_agents: members,
            metadata: {
              ...((swarm as any).metadata || {}),
              assigned_to: userId,
              organization_id: org.id,
            },
          })
          .eq("key", swarmKey)
      }
    }

    // ── 6. Tag org with vertical ──
    const checkoutVertical = meta.vertical || ""
    if (checkoutVertical && org) {
      const { data: orgRow } = await supabaseAdmin
        .from("organizations")
        .select("metadata")
        .eq("id", org.id)
        .maybeSingle()

      await supabaseAdmin
        .from("organizations")
        .update({ metadata: { ...((orgRow?.metadata as Record<string, unknown>) ?? {}), vertical: checkoutVertical } })
        .eq("id", org.id)
    }

    // ── 7. Send purchase confirmation email ──
    if (tier && email) {
      try {
        await sendEmail({
          to: email,
          subject: `You're in — ${tier.replace(/_/g, ' ')} is now active`,
          html: `<p>Hi${userData?.full_name ? ` ${userData.full_name}` : ''},</p><p>Your <strong>${tier.replace(/_/g, ' ')}</strong> system is now active${addons.length ? `, along with: ${addons.map((a) => a.replace(/_/g, ' ')).join(', ')}` : ''}.</p><p>Your dashboard is ready — log in to get started.</p>`,
        })
      } catch (err) {
        console.error('Purchase confirmation email failed:', err)
      }
    }
  }

  // ── WF-110: Client Offboarding & Cancellation ──
  // Confirmed earlier this session there was no real offboarding flow at
  // all (client settings just said "contact support"). This is the first
  // real implementation: subscription cancelled -> mark the client
  // cancelled, downgrade to the free tier, send an exit email (offering a
  // data export on request -- there's no automated export mechanism yet,
  // so this doesn't overclaim one), and log to workflow_run_logs for the
  // internal retention review (no Discord/Slack connector is configured
  // yet, so that notification leg is a no-op until one exists).
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id

    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("user_id")
      .or(`stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${stripeCustomerId}`)
      .maybeSingle()

    const userId = membership?.user_id

    if (userId) {
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("email")
        .eq("id", userId)
        .maybeSingle()

      await supabaseAdmin
        .from("clients")
        .update({ status: "cancelled", plan_tier_key: "service_free" })
        .eq("id", userId)

      await supabaseAdmin
        .from("memberships")
        .update({ status: "cancelled" })
        .eq("user_id", userId)

      if (client?.email) {
        try {
          const { sendEmail } = await import("@/lib/email")
          await sendEmail({
            to: client.email,
            subject: "Your Niore subscription has ended",
            html: `<p>Your subscription has been cancelled and your account moved to the free tier. If you'd like an export of your data, reply to this email and we'll prepare one.</p>`,
          })
        } catch (emailError) {
          console.error("WF-110 exit email failed:", emailError)
        }
      }

      await supabaseAdmin.from("workflow_run_logs").insert({
        workflow_id: "750e60c3-7728-4f1c-95e7-d798b3f21267", // WF-110
        client_id: userId,
        status: "completed",
        triggered_by: "stripe_webhook",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
    } else {
      console.error("WF-110: could not find a client for subscription", subscription.id)
    }
  }

  // ── WF-302: Invoice Payment Failure Handler ──
  // Dunning email, tone escalating with Stripe's own attempt_count -- no
  // access changes on failure alone (access restriction, if wanted, should
  // follow Stripe's own subscription.status transition to 'past_due'/
  // 'unpaid', not be done independently here).
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice
    const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
    const attemptCount = invoice.attempt_count || 1

    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId || "")
      .maybeSingle()

    if (membership?.user_id) {
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("email")
        .eq("id", membership.user_id)
        .maybeSingle()

      if (client?.email) {
        const firmer = attemptCount >= 3
        try {
          const { sendEmail } = await import("@/lib/email")
          await sendEmail({
            to: client.email,
            subject: firmer ? "Action needed: your payment is still failing" : "We couldn't process your payment",
            html: firmer
              ? `<p>We've tried a few times now and your payment method still isn't working. Please update it soon to avoid losing access.</p>`
              : `<p>We couldn't process your latest payment. No action needed yet -- we'll try again automatically, but you're welcome to update your payment method any time.</p>`,
          })
        } catch (emailError) {
          console.error("WF-302 dunning email failed:", emailError)
        }
      }
    } else {
      console.error("WF-302: could not find a client for customer", stripeCustomerId)
    }
  }

  // ── WF-109: Tier / Entitlement Change Sync (partial) ──
  // Syncs clients.status from Stripe's own subscription.status/
  // cancel_at_period_end so the account reflects reality (past_due,
  // pending cancellation, reactivated). Deliberately does NOT attempt to
  // remap plan_tier_key on a plan change -- that requires a real Stripe
  // price ID -> membership tier key mapping that doesn't exist in this
  // codebase, and guessing one would risk silently mis-tiering a paying
  // customer. Build that mapping first, then extend this.
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription
    const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id

    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("user_id")
      .or(`stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${stripeCustomerId}`)
      .maybeSingle()

    if (membership?.user_id) {
      let status = "active"
      if (subscription.cancel_at_period_end) status = "pending_cancellation"
      else if (subscription.status === "past_due") status = "past_due"
      else if (subscription.status === "unpaid") status = "unpaid"
      else if (subscription.status === "canceled") status = "cancelled"

      await supabaseAdmin
        .from("clients")
        .update({ status })
        .eq("id", membership.user_id)
    }
  }

  return NextResponse.json({ received: true });
}
