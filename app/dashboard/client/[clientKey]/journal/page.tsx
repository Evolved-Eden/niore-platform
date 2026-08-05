import { requireClientView } from '@/lib/client-dashboard'
import { createServiceClient } from '@/lib/supabase/server'
import JournalClient from './JournalClient'

export default async function JournalPage({ params }: { params: Promise<{ clientKey: string }> }) {
  const { clientKey } = await params
  const { targetClientId } = await requireClientView(clientKey)
  const svc = createServiceClient()

  const [mineRes, sharedRes, orgsRes] = await Promise.all([
    svc
      .from('journal_entries')
      .select('id, title, content, mood, shared_with, created_at, updated_at')
      .eq('user_id', targetClientId)
      .order('created_at', { ascending: false }),
    svc
      .from('journal_entries')
      .select('id, user_id, title, content, mood, created_at, users:user_id(full_name)')
      .contains('shared_with', [targetClientId])
      .order('created_at', { ascending: false }),
    svc
      .from('organization_members')
      .select('organization_id, organizations(id, name)')
      .eq('user_id', targetClientId)
      .eq('status', 'active'),
  ])

  const myOrgs = (orgsRes.data || []).map((m: any) => ({ id: m.organization_id, name: m.organizations?.name || 'Organization' }))

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Journal</h1>
        <p className="text-white/30 text-sm">Private by default. You choose what — and who — to share, one entry at a time.</p>
      </div>
      <JournalClient initialEntries={mineRes.data || []} sharedWithMe={(sharedRes.data as any) || []} myOrgs={myOrgs} />
    </div>
  )
}
