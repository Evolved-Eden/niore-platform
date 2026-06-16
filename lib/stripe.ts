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