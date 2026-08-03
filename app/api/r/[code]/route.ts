import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

const ATTRIBUTION_COOKIE = 'niore_ref'
const ATTRIBUTION_DAYS = 90

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(appUrl)
  }

  try {
    const { data: link } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, code, owner_user_id, owner_organization_id, target_catalog_item_id, target_url, clicks_count')
      .eq('code', code)
      .maybeSingle()

    if (!link) {
      return NextResponse.redirect(appUrl)
    }

    const existingVisitorId = req.cookies.get('niore_visitor_id')?.value
    const visitorId = existingVisitorId || randomUUID()

    await supabaseAdmin.from('affiliate_link_events').insert({
      affiliate_link_id: link.id,
      event_type: 'click',
      visitor_id: visitorId,
      referrer_url: req.headers.get('referer') || null,
    })

    await supabaseAdmin
      .from('affiliate_links')
      .update({ clicks_count: (link.clicks_count ?? 0) + 1 })
      .eq('id', link.id)

    const destination = link.target_url
      || (link.target_catalog_item_id ? `${appUrl}/catalog/${link.target_catalog_item_id}` : appUrl)

    const res = NextResponse.redirect(destination)

    res.cookies.set(ATTRIBUTION_COOKIE, code, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: ATTRIBUTION_DAYS * 24 * 60 * 60,
      path: '/',
    })
    if (!existingVisitorId) {
      res.cookies.set('niore_visitor_id', visitorId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: ATTRIBUTION_DAYS * 24 * 60 * 60,
        path: '/',
      })
    }
    return res
  } catch (err) {
    console.error('Affiliate click-tracking failed:', err)
    return NextResponse.redirect(appUrl)
  }
}
