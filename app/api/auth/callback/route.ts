import { NextRequest, NextResponse } from 'next/server'

/**
 * Auth callback — receives the auth code from Supabase (via email link or OAuth)
 * and redirects to the client-side callback page which handles the code exchange.
 *
 * The code exchange MUST happen client-side so that auth cookies are properly
 * set on the browser (server-side redirects lose Supabase auth cookies).
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  // Forward to client-side handler which exchanges code + sets cookies properly
  const params = new URLSearchParams({ code })
  if (type) params.set('type', type)
  if (searchParams.get('next')) params.set('next', searchParams.get('next')!)

  return NextResponse.redirect(`${origin}/auth/callback?${params.toString()}`)
}
