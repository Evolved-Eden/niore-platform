import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

// ════════════════════════════════════════════════════════════
// Per-client dashboard identity + access control
// ════════════════════════════════════════════════════════════
// URL scheme:  /dashboard/client/{slug}--{clientId}
//   slug      = slugified business_name || full_name (cosmetic, for readable
//               shareable links; NOT used for resolution)
//   clientId  = the full clients.id UUID (authoritative; split on '--' and
//               take the last segment)
//
// Access model (enforced at the app layer with a service-role client,
// because platform admins are not covered by RLS on `clients`):
//   self  — viewer.id === target client.id
//   admin — viewer users.role === 'admin'            (platform: any client)
//   org   — viewer is an active member of the target
//           client's organization                     (org admin/member: their org)
//   none  — redirect to the viewer's own dashboard / notFound
//
// Read strategy: dashboard pages resolve the target clientId here, then use
// a service-role client (RLS bypass) scoped to that clientId for reads, since
// only the `clients` table has org-scoped SELECT policies — client_twins,
// connector_credentials, ai_memories, etc. do NOT, so an anon/Rls client
// would silently return nothing for cross-client views.
// ════════════════════════════════════════════════════════════

export type ClientAccessLevel = 'self' | 'admin' | 'org' | 'none'

export interface ResolvedClient {
  clientId: string
  client: Record<string, any> | null
  access: ClientAccessLevel
  viewerId: string | null
  viewerRole: string | null
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'client'
}

export function clientNameFor(client: Record<string, any> | null): string {
  return client?.business_name || client?.full_name || client?.display_name || 'Client'
}

export function buildClientKey(client: Record<string, any> | null): string {
  const name = clientNameFor(client)
  const id = client?.id
  if (!id) return ''
  return `${slugify(name)}--${id}`
}

export function parseClientKey(clientKey: string): { slug: string; clientId: string } | null {
  if (!clientKey || !clientKey.includes('--')) return null
  const parts = clientKey.split('--')
  const clientId = parts[parts.length - 1]
  const slug = parts.slice(0, -1).join('--')
  if (!clientId) return null
  return { slug, clientId }
}

/**
 * Resolve the clientKey from the URL against the viewer's identity.
 * - Looks up the target client by id (service-role, so it works for any client).
 * - Computes access: self / platform admin / org member.
 * - Returns the resolved object; callers should use `requireClientView` for
 *   page-level guards (redirect/notFound on no access).
 */
export async function resolveClientAccess(clientKey: string): Promise<ResolvedClient> {
  const parsed = parseClientKey(clientKey)
  if (!parsed) {
    return { clientId: '', client: null, access: 'none', viewerId: null, viewerRole: null }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const viewerId = user?.id ?? null

  const svc = createServiceClient()
  const { data: client } = await svc
    .from('clients')
    .select('id, business_name, full_name, display_name, organization_id, status, plan_tier_key')
    .eq('id', parsed.clientId)
    .maybeSingle()

  if (!client) {
    return { clientId: parsed.clientId, client: null, access: 'none', viewerId, viewerRole: null }
  }

  // self
  if (viewerId && viewerId === parsed.clientId) {
    return { clientId: parsed.clientId, client, access: 'self', viewerId, viewerRole: null }
  }

  // platform admin
  if (viewerId) {
    const { data: viewer } = await svc
      .from('users')
      .select('role')
      .eq('id', viewerId)
      .maybeSingle()
    const viewerRole = viewer?.role ?? null
    if (viewerRole === 'admin') {
      return { clientId: parsed.clientId, client, access: 'admin', viewerId, viewerRole }
    }

    // org member of the target client's org
    if (client.organization_id) {
      const orgId = client.organization_id
      const { data: membership } = await svc
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', viewerId)
        .eq('is_active', true)
        .maybeSingle()
      if (membership) {
        return { clientId: parsed.clientId, client, access: 'org', viewerId, viewerRole }
      }
    }

    return { clientId: parsed.clientId, client, access: 'none', viewerId, viewerRole }
  }

  return { clientId: parsed.clientId, client, access: 'none', viewerId, viewerRole: null }
}

/**
 * Page guard: resolve the clientKey and redirect/notFound when the viewer has
 * no access. Returns the target client id for scoping queries.
 * Uses notFound() when the client doesn't exist, redirects to the viewer's own
 * dashboard when access is denied.
 */
export async function requireClientView(clientKey: string): Promise<{
  targetClientId: string
  client: Record<string, any>
  access: Exclude<ClientAccessLevel, 'none'>
}> {
  const resolved = await resolveClientAccess(clientKey)
  if (!resolved.client) notFound()
  if (resolved.access === 'none') {
    if (resolved.viewerId) {
      // Redirect to the viewer's own dashboard (they must exist as a client,
      // else fall back to /dashboard)
      const svc = createServiceClient()
      const { data: me } = await svc
        .from('clients')
        .select('id, business_name, full_name, display_name')
        .eq('id', resolved.viewerId)
        .maybeSingle()
      redirect(me ? `/dashboard/client/${buildClientKey(me)}` : '/dashboard')
    }
    notFound()
  }
  return {
    targetClientId: resolved.clientId,
    client: resolved.client,
    access: resolved.access,
  }
}
