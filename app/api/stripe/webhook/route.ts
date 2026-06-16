import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { STRIPE_API_VERSION } from "@/lib/constants";

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

async function createIntelligenceProfile(orgId: string) {
  const { data: existing } = await supabaseAdmin
    .from('intelligence_profiles')
    .select('id')
    .eq('entity_id', orgId)
    .eq('entity_type', 'organization')
    .maybeSingle()

  if (existing) return existing

  const { data: intel } = await supabaseAdmin
    .from("intelligence_profiles")
    .insert({
      entity_type: "organization",
      entity_id: orgId,
      organization_id: orgId,
      profile_kind: "business_intelligence",
      identity_summary: "Business intelligence",
      profile_type: "checkout_derived",
      confidence_score: 0.5,
      version: 1,
    })
    .select()
    .single()

  return intel
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
            name: "Primary Intelligence",
            status: "active",
            metadata: twinMeta,
          })
      }
    }

    // ── 3. Provision org + intelligence + Zuri (idempotent) ──
    const org = await getOrCreateOrg(userId, userData?.full_name || email.split('@')[0])
    if (org) {
      await createIntelligenceProfile(org.id)
      await upsertClientTwin(userId, org.id)
      await createZuriAgent(userId, org.id)
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
      await supabaseAdmin
        .from("organizations")
        .update({ metadata: { vertical: checkoutVertical } })
        .eq("id", org.id)
    }
  }

  return NextResponse.json({ received: true });
}
