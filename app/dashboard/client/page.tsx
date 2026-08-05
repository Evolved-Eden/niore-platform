import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { buildClientKey } from '@/lib/client-dashboard'

export const dynamic = 'force-dynamic'

// /dashboard/client → redirect to the viewer's OWN per-client dashboard URL.
// Each client now has a unique dashboard at /dashboard/client/{name}--{id};
// this bare path is just a convenience redirect for bookmarks/legacy links.
export default async function ClientIndex() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: client } = await svc
    .from('clients')
    .select('id, business_name, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!client) redirect('/dashboard')
  redirect(`/dashboard/client/${buildClientKey(client)}`)
}
