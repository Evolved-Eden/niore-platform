import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '@/lib/constants'
import { lazy } from '@/lib/lazy-client'

const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))

/**
 * POST /api/stripe/validate-coupon
 * Body: { code: string }
 * Returns: { valid, discount, name, duration, duration_in_months }
 *
 * Checks if a promotion code exists, is active, and not expired/used up.
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, error: 'Enter a coupon code' })
    }

    // Search for the promotion code
    const promoCodes = await stripe.promotionCodes.list({
      code: code.trim().toUpperCase(),
      active: true,
      limit: 1,
    })

    if (promoCodes.data.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code' })
    }

    const promo = promoCodes.data[0]

    // Check expiration
    if (promo.expires_at && promo.expires_at < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired' })
    }

    // Check max redemptions
    if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) {
      return NextResponse.json({ valid: false, error: 'This coupon has been fully redeemed' })
    }

    // Get the coupon details
    const couponId = typeof (promo as any).coupon === 'string' ? (promo as any).coupon : (promo as any).coupon.id
    const coupon = await stripe.coupons.retrieve(couponId)

    if (!coupon.valid) {
      return NextResponse.json({ valid: false, error: 'This coupon is no longer valid' })
    }

    return NextResponse.json({
      valid: true,
      promotion_code: promo.id,
      coupon_id: coupon.id,
      discount: coupon.percent_off
        ? `${coupon.percent_off}% off`
        : coupon.amount_off
          ? `$${(coupon.amount_off / 100).toFixed(2)} off`
          : 'Discount',
      percent_off: coupon.percent_off,
      amount_off: coupon.amount_off,
      name: coupon.name,
      duration: coupon.duration,
      duration_in_months: coupon.duration_in_months,
    })
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: 'Could not validate coupon' })
  }
}
