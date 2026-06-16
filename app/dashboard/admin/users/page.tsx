import { supabaseAdmin } from '@/lib/supabase/admin'
import UsersTable from './UsersTable'

export const dynamic = 'force-dynamic'

export type UserRow = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  created_at: string
  client_status: string | null
  plan_tier: string | null
}

export default async function AdminUsersPage() {
  try {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('id, status, plan_tier_key')

    const clientMap = new Map((clients || []).map(c => [c.id, c]))

    const result: UserRow[] = (users || []).map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      created_at: u.created_at,
      client_status: clientMap.get(u.id)?.status || null,
      plan_tier: clientMap.get(u.id)?.plan_tier_key || null,
    }))

    return <UsersTable initialUsers={result} />
  } catch {
    return <UsersTable initialUsers={[]} />
  }
}
