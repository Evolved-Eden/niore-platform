import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Public routes
  const isPublic = ['/', '/login', '/register', '/chat/demo', '/privacy', '/terms', '/contact']
    .some(r => path === r || path.startsWith(r))
  if (isPublic) return supabaseResponse

  // Protected routes — no user → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', path)
    return NextResponse.redirect(url)
  }

  // Role-based dashboard guards
  if (path.startsWith('/dashboard')) {
    const { data: citizen } = await supabase
      .from('ris_citizens')
      .select('role')
      .eq('supabase_user_id', user.id)
      .maybeSingle() // won't error if no row found

    const role = citizen?.role ?? 'client'

    // /dashboard → redirect to role home
    if (path === '/dashboard') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }

    // Admin-only
    if (path.startsWith('/dashboard/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }

    // Creator+
    if (path.startsWith('/dashboard/creator') && !['creator', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard/client', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}