import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Public marketplace browse endpoint. Only returns items the org has explicitly
// opted to list (listed_on_main_marketplace=true) and marked active. No auth
// required to browse -- purchase is a separate, authenticated route.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryKey = searchParams.get('category')
    const audienceKey = searchParams.get('audience')
    const typeKey = searchParams.get('type')
    const search = searchParams.get('q')
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const offset = Number(searchParams.get('offset')) || 0

    let query = supabaseAdmin
      .from('catalog_items')
      .select(
        `
        id, sku, slug, name, description, thumbnail_url, icon,
        pricing_type, base_price, currency, featured, sort_order,
        organization_id, created_by,
        catalog_types ( id, type_key, name ),
        catalog_categories ( id, category_key, name ),
        catalog_audiences ( id, audience_key, name ),
        catalog_pricing ( price, sale_price, currency, billing_type, billing_interval, trial_days, active )
        `,
        { count: 'exact' }
      )
      .eq('listed_on_main_marketplace', true)
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      // Tolerate the table being empty/mid-setup rather than 500ing the page.
      console.error('Marketplace catalog query failed:', error)
      return NextResponse.json({ items: [], total: 0, error: error.message })
    }

    let items = data ?? []

    if (categoryKey) {
      items = items.filter((i: any) => i.catalog_categories?.category_key === categoryKey)
    }
    if (audienceKey) {
      items = items.filter((i: any) => i.catalog_audiences?.audience_key === audienceKey)
    }
    if (typeKey) {
      items = items.filter((i: any) => i.catalog_types?.type_key === typeKey)
    }

    return NextResponse.json({ items, total: count ?? items.length })
  } catch (error: any) {
    console.error('Marketplace catalog error:', error)
    return NextResponse.json({ items: [], total: 0, error: error.message || 'Failed to load catalog' }, { status: 500 })
  }
}
