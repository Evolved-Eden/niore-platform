import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const path = url.pathname

  // ── Public / static routes (no check needed) ──
  const isPublic =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/auth/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon') ||
    path.startsWith('/images/') ||
    path.startsWith('/api/webhooks/') ||
    path === '/pricing' ||
    path === '/api/prices' ||
    path.startsWith('/api/stripe/webhook')

  // ── Create supabase client (handles cookie refresh) ──
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session / get user (SSR handles token refresh via cookie setAll)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Public routes ──
  if (isPublic) {
    // Still return the response so cookie refresh can propagate
    return supabaseResponse
  }

  // ── Authenticated routes (require user) ──
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin routes (require admin role) ──
  if (path.startsWith('/dashboard/admin') || path.startsWith('/api/admin')) {
    // Fetch user role — RLS allows reading own row
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (!isAdmin) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all routes except truly public static assets
    '/((?!_next/static|_next/image|favicon.ico|images|logo\\.JPG).*)',
  ],
}
