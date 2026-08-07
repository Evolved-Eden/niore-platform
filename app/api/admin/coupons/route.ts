import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '@/lib/constants'
import { lazy } from '@/lib/lazy-client'

const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))

/**
 * GET /api/admin/coupons
 * List all Stripe promotion codes with their coupon details.
 */
export async function GET() {
  try {
    const [promoCodes, coupons] = await Promise.all([
      stripe.promotionCodes.list({ limit: 100 }),
      stripe.coupons.list({ limit: 100 }),
    ])

    const couponMap = new Map(coupons.data.map(c => [c.id, c]))

    const list = promoCodes.data.map((pc: any) => {
      const couponRef = pc.promotion?.coupon
      const couponId = typeof couponRef === 'string' ? couponRef : couponRef?.id
      const c = couponMap.get(couponId)
      return {
        id: pc.id,
        code: pc.code,
        active: pc.active,
        coupon_id: couponId,
        coupon: c ? {
          id: c.id,
          name: c.name,
          percent_off: c.percent_off,
          amount_off: c.amount_off,
          currency: c.currency,
          duration: c.duration,
          duration_in_months: c.duration_in_months,
          max_redemptions: c.max_redemptions,
          times_redeemed: c.times_redeemed,
          created: c.created,
        } : null,
        expires_at: pc.expires_at,
        max_redemptions: pc.max_redemptions,
        times_redeemed: pc.times_redeemed,
        created: pc.created,
      }
    })

    return NextResponse.json({ coupons: list })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/coupons
 * Create a new promotion code.
 *
 * Body:
 * {
 *   code: string           // The promo code (e.g. "LAUNCH20")
 *   percent_off?: number   // e.g. 20 for 20% off
 *   amount_off?: number    // e.g. 1000 for $10 off (in cents)
 *   duration: 'once' | 'forever' | 'repeating'
 *   duration_in_months?: number // required if duration = 'repeating'
 *   max_redemptions?: number
 *   expires_at?: number    // unix timestamp
 *   name?: string          // coupon name
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, percent_off, amount_off, duration, duration_in_months, max_redemptions, expires_at, name } = body

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Promotion code is required' }, { status: 400 })
    }

    if (!percent_off && !amount_off) {
      return NextResponse.json({ error: 'Either percent_off or amount_off is required' }, { status: 400 })
    }

    // Create the coupon first
    const coupon = await stripe.coupons.create({
      name: name || `Discount ${code}`,
      percent_off: percent_off || undefined,
      amount_off: amount_off || undefined,
      currency: amount_off ? 'usd' : undefined,
      duration: duration || 'once',
      duration_in_months: duration === 'repeating' ? (duration_in_months || 3) : undefined,
      max_redemptions: max_redemptions || undefined,
    })

    // Create the promotion code
    const promoCode = await stripe.promotionCodes.create({
      promotion: { type: 'coupon' as const, coupon: coupon.id },
      code: code.toUpperCase().trim(),
      max_redemptions: max_redemptions || undefined,
      expires_at: expires_at || undefined,
      active: true,
    } as any)

    return NextResponse.json({
      success: true,
      promotion_code: {
        id: promoCode.id,
        code: promoCode.code,
        coupon_id: coupon.id,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        duration: coupon.duration,
        active: promoCode.active,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/coupons?id=promo_xxx
 * Deactivate a promotion code.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Promotion code ID required' }, { status: 400 })

    await stripe.promotionCodes.update(id, { active: false })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
