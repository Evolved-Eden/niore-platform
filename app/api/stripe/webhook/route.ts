import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id;

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: "My Intelligence",
        owner_id: userId,
      })
      .select()
      .single();

    const { data: intel } = await supabaseAdmin
      .from("intelligences")
      .insert({
        org_id: org.id,
        name: "Core Intelligence",
        type: "personal",
      })
      .select()
      .single();

    await supabaseAdmin.from("agents").insert({
      org_id: org.id,
      name: "Zuri",
      role: "orchestrator",
      is_active: true,
    });
  }

  return NextResponse.json({ received: true });
}