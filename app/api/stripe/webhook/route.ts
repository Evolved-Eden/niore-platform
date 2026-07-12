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
      const newlyPurchasedDomains: string[] = []

      for (const pid of products) {
        if (pid === "expanded_blueprint") {
          twinMeta.blueprint_expanded = true
        } else if (pid === "enhanced_blueprint") {
          twinMeta.blueprint_enhanced = true
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
      try {
        const { sendEmail } = await import("@/lib/email")
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        if (products.includes("expanded_blueprint") || products.includes("enhanced_blueprint")) {
          await sendEmail({
            to: email,
            subject: "Your expanded Blueprint tier is unlocked",
            html: `<p>Your Blueprint tier has been unlocked. <a href="${appUrl}/dashboard/client/blueprint">View your full Blueprint</a>.</p>`,
          })
        }
        for (const pid of newlyPurchasedDomains) {
          const domainKey = pid.replace(/^domain_/, "")
          await sendEmail({
            to: email,
            subject: "Your Domain Module is ready",
            html: `<p>Your ${domainKey.replace(/_/g, " ")} Domain Module is ready. <a href="${appUrl}/dashboard/client/blueprint/domain">Start your assessment</a>.</p>`,
          })
        }
      } catch (emailError) {
        console.error("WF-106/107 confirmation email failed:", emailError)
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
