import type { AffiliateLinkRow } from '@/types'

/**
 * Ensure every user has a personal affiliate/referral link. If one already
 * exists for this user, it is returned untouched. Otherwise a unique code is
 * generated and an `affiliate_links` row is created — no approval or role
 * required, so every signed-up user can share their link immediately.
 *
 * The caller passes its own supabase client: route handlers use the
 * service-role client, server components use the SSR client.
 */
export async function ensureAffiliateLink({
  userId,
  orgId = null,
  name = null,
  client,
}: {
  userId: string
  orgId?: string | null
  name?: string | null
  client: any
}): Promise<AffiliateLinkRow | null> {
  if (!userId) return null

  // Existing link? Return it.
  const { data: existing } = await client
    .from('affiliate_links')
    .select('*')
    .eq('owner_user_id', userId)
    .maybeSingle()

  if (existing) return existing as AffiliateLinkRow

  // Generate a unique code: slugified name + short random suffix.
  const base = (name || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 12) || 'user'

  const rand = () => Math.random().toString(36).slice(2, 6)

  let code = `${base}-${rand()}`
  let attempts = 0
  while (attempts < 5) {
    const { data: clash } = await client
      .from('affiliate_links')
      .select('id')
      .eq('code', code)
      .maybeSingle()
    if (!clash) break
    code = `${base}-${rand()}`
    attempts += 1
  }

  const { data: inserted, error } = await client
    .from('affiliate_links')
    .insert({
      code,
      owner_user_id: userId,
      owner_organization_id: orgId ?? null,
      target_url: null,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    console.error('ensureAffiliateLink: insert failed:', error.message)
    return null
  }

  return (inserted as AffiliateLinkRow) || { id: '', code }
}

/** Full public URL for a referral code, e.g. https://dashboard.evolvededen.com/r/johndoe-7k2p */
export function affiliateLinkUrl(code?: string | null): string {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://dashboard.evolvededen.com'
  return `${origin}/r/${code || ''}`
}
