import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { STRIPE_API_VERSION } from "@/lib/constants";
import { sendEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: STRIPE_API_VERSION,
});

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

async function getOrCreateOrg(userId: string, userName: string) {
  const { data: existingOrg } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (existingOrg) return existingOrg

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .insert({
      name: "My Intelligence",
      owner_id: userId,
    })
    .select()
    .single()

  return org
}

// NOTE: this used to insert into `intelligence_profiles`, a table that
// migration 00021_schema_consolidation.sql explicitly retired ("LEGACY --
// unused. Intelligence data lives in client_twins / agents.") -- but the
// live table was never actually created, so every call here was silently
// failing (supabaseAdmin swallows the error since only `data` is read).
// Removed. upsertClientTwin() + createZuriAgent() below are the real
// Base Twin / Core Agent provisioning steps per the Eden Core System model.

// Activates (or upgrades) an OS package for an organization -- the
// canonical record of "this org/human currently has X active," which
// supports multiple concurrent OS's on one org (personal_os + family_os +
// creator_os all at once) and doubles as the Blueprint Passive/Active/
// Mastered state per system.
async function activateOsPackage(params: {
  organizationId: string
  osPackageKey: string
  tierLevel?: 'standard' | 'prime' | 'elite'
  source?: string
}) {
  const { organizationId, osPackageKey, tierLevel = 'standard', source = 'checkout' } = params
  if (!organizationId || !osPackageKey) return null

  const { data } = await supabaseAdmin
    .from('organization_os_activations')
    .upsert(
      {
        organization_id: organizationId,
        item_type: 'os_package',
        item_key: osPackageKey,
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
    .from('agent_registry')
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
        .select("id, seller_net_amount, currency")
        .single()

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

      for (const pid of products) {
        if (pid === "expanded_blueprint") {
          twinMeta.blueprint_expanded = true
        } else if (pid === "enhanced_blueprint") {
          twinMeta.blueprint_enhanced = true
        } else if (pid.startsWith("domain_")) {
          const domains: string[] = twinMeta.purchased_domains || []
          if (!domains.includes(pid)) domains.push(pid)
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
    }

    // ── 3. Provision org + Base Twin + Zuri (idempotent) ──
    const org = await getOrCreateOrg(userId, userData?.full_name || email.split('@')[0])
    if (org) {
      await upsertClientTwin(userId, org.id)
      await createZuriAgent(userId, org.id)

      // Record the OS activation (supports multiple concurrent OS's per org/human,
      // and is the Blueprint Passive/Active/Mastered state tracker).
      if (tier) {
        await activateOsPackage({ organizationId: org.id, osPackageKey: tier, source: 'checkout' })
      }

      // Addons purchased alongside the base tier (e.g. someone on personal_os
      // also adding family_os + creator_os) each get their own activation row,
      // so one org/human can hold several OS's concurrently.
      for (const addonKey of addons) {
        await activateOsPackage({ organizationId: org.id, osPackageKey: addonKey, source: 'checkout_addon' })
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

  return NextResponse.json({ received: true });
}
