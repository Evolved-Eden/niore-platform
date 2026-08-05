'use client'

import { useParams } from 'next/navigation'

// ════════════════════════════════════════════════════════════
// Client-side companion to lib/client-dashboard.ts
//
// Server pages use requireClientView() (lib/client-dashboard.ts) which
// needs a service-role client and can only run on the server. Client
// components must instead resolve the target client from the URL alone:
//   const { targetClientId, prefix } = useClientView()
//
//   targetClientId — the authoritative clients.id carried in the URL
//                    (split on '--', last segment). Pass this to every
//                    /api/client/* call as clientId so the API route
//                    scopes its queries (and its own access check) to
//                    the target client rather than the session user.
//   prefix         — `/dashboard/client/{clientKey}`, used to build
//                    keyed internal links instead of hard-coded paths.
//
// Data reads: the browser anon client enforces RLS (self/org only). For
// a self-viewing client this is identical to before. Platform admins /
// org members viewing another client's dashboard get their data through
// the /api/client/* routes (service-role, access-checked server-side);
// direct browser-client queries stay RLS-limited to the viewer.
// ════════════════════════════════════════════════════════════

export function parseClientKey(clientKey: string): { slug: string; clientId: string } | null {
  if (!clientKey || !clientKey.includes('--')) return null
  const parts = clientKey.split('--')
  const clientId = parts[parts.length - 1]
  const slug = parts.slice(0, -1).join('--')
  if (!clientId) return null
  return { slug, clientId }
}

export function useClientView(): {
  clientKey: string
  targetClientId: string
  slug: string
  prefix: string
} {
  const params = useParams<{ clientKey: string | string[] }>()
  const clientKey = Array.isArray(params?.clientKey) ? params.clientKey[0] : (params?.clientKey ?? '')
  const parsed = parseClientKey(clientKey)
  return {
    clientKey,
    targetClientId: parsed?.clientId ?? '',
    slug: parsed?.slug ?? '',
    prefix: clientKey ? `/dashboard/client/${clientKey}` : '',
  }
}
