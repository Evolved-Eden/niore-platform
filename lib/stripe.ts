import Stripe from "stripe";
import { STRIPE_API_VERSION } from "@/lib/constants";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: STRIPE_API_VERSION,
});

export async function createCheckoutSession({
  priceId,
  userId,
}: {
  priceId: string;
  userId: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
    metadata: {
      userId,
    },
  });

  return session;
}

/**
 * Resolve a user-entered coupon to a Stripe promotion code ID.
 *
 * Accepts either a raw code (e.g. "LAUNCH20") or an already-resolved
 * promotion code ID ("promo_xxx"). Raw codes are looked up via the
 * PromotionCodes API (case-insensitive, active only).
 *
 * Returns null when the code doesn't map to an active promotion code.
 */
export async function resolvePromotionCode(
  input: string,
): Promise<string | null> {
  const code = input.trim();
  if (!code) return null;
  if (code.startsWith("promo_")) return code;

  const promoCodes = await stripe.promotionCodes.list({
    code: code.toUpperCase(),
    active: true,
    limit: 1,
  });

  return promoCodes.data[0]?.id ?? null;
}