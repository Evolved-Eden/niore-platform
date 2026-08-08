import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ClientAccessLevel } from '@/lib/client-dashboard'

// ════════════════════════════════════════════════════════════
// Shared authorization for /api/client/* routes in the per-client
// dashboard world.
//
// These routes historically scoped every query to the SESSION user
// (`user.id`). Now a client page can be rendered for a DIFFERENT target
// client (platform admin / org member viewing another client's dashboard),
// so each route accepts an optional target:
//   - GET:  ?clientId=<uuid>
//   - POST/DELETE:  body.clientId (or ?clientId=)
// When clientId is omitted, it falls back to the session user (self), which
// keeps every existing caller working unchanged.
//
// Access rule (mirrors lib/client-dashboard.ts): self / platform admin /
// active member of the target client's org. Anything else → 403.
// ════════════════════════════════════════════════════════════

export interface ApiClientContext {
  /** Resolved target client id — scope ALL queries to this */
  clientId: string
  /** Access level for the viewer relative to the target client */
  access: ClientAccessLevel
  /** The viewer's own id (session) */
  viewerId: string | null
  /** RLS-bypassing client for the target's data (use for cross-client views) */
  svc: ReturnType<typeof createServiceClient>
  isAdmin: boolean
}

async function getViewer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

async function computeAccess(viewerId: string | null, targetClientId: string): Promise<{ access: ClientAccessLevel; viewerRole: string | null }> {
  if (!viewerId) return { access: 'none', viewerRole: null }
  if (viewerId === targetClientId) return { access: 'self', viewerRole: null }

  const svc = createServiceClient()
  const { data: viewer } = await svc
    .from('users')
    .select('role')
    .eq('id', viewerId)
    .maybeSingle()
  const viewerRole = viewer?.role ?? null
  if (viewerRole === 'admin') return { access: 'admin', viewerRole }

  const { data: client } = await svc
    .from('clients')
    .select('organization_id')
    .eq('id', targetClientId)
    .maybeSingle()

  if (client?.organization_id) {
    const { data: membership } = await svc
      .from('organization_members')
      .select('id')
      .eq('organization_id', client.organization_id)
      .eq('user_id', viewerId)
      .eq('is_active', true)
      .maybeSingle()
    if (membership) return { access: 'org', viewerRole }
  }
  return { access: 'none', viewerRole }
}

function extractClientId(req: NextRequest): string | null {
  const fromQuery = req.nextUrl?.searchParams?.get('clientId')
  if (fromQuery) return fromQuery
  return null
}

async function extractClientIdFromBody(req: NextRequest): Promise<string | null> {
  try {
    const body = await req.clone().json()
    if (typeof body?.clientId === 'string' && body.clientId) return body.clientId
  } catch {
    // body not JSON or empty — fine, caller relies on session/query
  }
  return null
}

/**
 * Resolve the effective target client id for an API route:
 * explicit clientId (query/body) → session user, with access control.
 * Returns null when the caller has no access (route should 401/403).
 */
export async function resolveApiClient(
  req: NextRequest,
  opts?: { allowAnon?: boolean }
): Promise<ApiClientContext | null> {
  const viewerId = await getViewer()
  if (!viewerId && !opts?.allowAnon) return null

  const explicit = extractClientId(req) ?? (await extractClientIdFromBody(req))
  const targetClientId = explicit ?? viewerId
  if (!targetClientId) return null

  const { access, viewerRole } = await computeAccess(viewerId, targetClientId)
  if (access === 'none') return null

  const isAdmin = viewerRole === 'admin'

  return {
    clientId: targetClientId,
    access,
    viewerId,
    svc: createServiceClient(),
    isAdmin,
  }
}

/** Convenience for pages: does the current viewer have access to target? */
export async function canViewClient(targetClientId: string): Promise<boolean> {
  const viewerId = await getViewer()
  if (!viewerId) return false
  if (viewerId === targetClientId) return true
  const { access } = await computeAccess(viewerId, targetClientId)
  return access !== 'none'
}
