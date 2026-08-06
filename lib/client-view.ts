'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'client'
}

// Build the viewer's OWN client key from a minimal client record. Used on
// cross-surface pages (chat, personal, collective, admin) that link INTO a
// client dashboard but are not themselves inside the [clientKey] route.
export function buildSelfClientKey(client: {
  id?: string | null
  business_name?: string | null
  full_name?: string | null
} | null): string {
  if (!client?.id) return ''
  const name = client.business_name || client.full_name || 'Client'
  return `${slugify(name)}--${client.id}`
}

// Resolve the signed-in user's own client key client-side via /api/client
// (session fallback → the user's own client). Returns prefix='' when the
// viewer has no client row; callers should hide keyed links in that case.
export function useSelfClientKey(): {
  clientKey: string
  prefix: string
  loading: boolean
} {
  const [clientKey, setClientKey] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no client'))))
      .then((data) => {
        if (!cancelled) setClientKey(buildSelfClientKey(data?.client ?? null))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    clientKey,
    prefix: clientKey ? `/dashboard/client/${clientKey}` : '',
    loading,
  }
}
