import { supabaseAdmin } from '@/lib/supabase/admin'
import ClientsTable from './ClientsTable'

export const dynamic = 'force-dynamic'

export type ClientRow = {
  id: string
  user_email: string | null
  user_name: string | null
  user_role: string | null
  full_name: string | null
  biz_name: string | null
  email: string | null
  phone: string | null
  status: string | null
  plan_tier_key: string | null
  additional_plans: string[] | null
  addons: string[] | null
  onboarding_status: string | null
  client_type: string | null
  primary_vertical: string | null
  vip_level: string | null
  total_spend: string | null
  lifetime_value: string | null
  lifecycle_stage: string | null
  created_at: string
  updated_at: string | null
}

export default async function AdminClientsPage() {
  try {
    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')

    const userMap = new Map((users || []).map(u => [u.id, u]))

    const result: ClientRow[] = (clients || []).map(c => ({
      id: c.id,
      user_email: userMap.get(c.id)?.email || null,
      user_name: userMap.get(c.id)?.full_name || null,
      user_role: userMap.get(c.id)?.role || null,
      full_name: c.full_name,
      biz_name: c.biz_name,
      email: c.email,
      phone: c.phone,
      status: c.status,
      plan_tier_key: c.plan_tier_key,
      additional_plans: c.additional_plans || [],
      addons: c.addons || [],
      onboarding_status: c.onboarding_status,
      client_type: c.client_type,
      primary_vertical: c.primary_vertical,
      vip_level: c.vip_level,
      total_spend: c.total_spend,
      lifetime_value: c.lifetime_value,
      lifecycle_stage: c.lifecycle_stage,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }))

    return <ClientsTable initialClients={result} />
  } catch {
    return <ClientsTable initialClients={[]} />
  }
}
