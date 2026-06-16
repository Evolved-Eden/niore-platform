import { supabaseAdmin } from '@/lib/supabase/admin'
import PricingManager from './PricingManager'

export const dynamic = 'force-dynamic'

export default async function AdminPricingPage() {
  try {
    const [{ data: tiers }, { data: ents }] = await Promise.all([
      supabaseAdmin.from('membership_tiers').select('*').order('created_at', { ascending: true }),
      supabaseAdmin.from('tier_entitlements').select('*').order('plan_key', { ascending: true }),
    ])

    return <PricingManager initialTiers={tiers || []} initialEntitlements={ents || []} />
  } catch {
    return <PricingManager initialTiers={[]} initialEntitlements={[]} />
  }
}
