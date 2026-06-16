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

  const path = request.nextUrl.pathname

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // ── Admin API routes: require authenticated admin ─────────
  if (path.startsWith('/api/admin/')) {
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized — authentication required' },
        { status: 401 }
      )
    }
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden — admin role required' },
        { status: 403 }
      )
    }
    return supabaseResponse
  }

  // ── Client API routes: require authentication ────────────
  if (path.startsWith('/api/client/')) {
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized — authentication required' },
        { status: 401 }
      )
    }
    return supabaseResponse
  }

  // Other API routes handle their own auth — skip proxy to avoid response interference
  if (path.startsWith('/api/')) {
    return supabaseResponse
  }

  // Consolidate old /admin/* → /dashboard/admin/*
  if (path === '/admin' || path.startsWith('/admin/')) {
    const newPath = path.replace(/^\/admin/, '/dashboard/admin')
    return NextResponse.redirect(new URL(newPath, request.url))
  }

  // Public routes
  const isPublic = ['/', '/login', '/register', '/demo', '/define-intelligence', '/pricing', '/blueprint', '/intake', '/chat/demo', '/privacy', '/terms', '/contact']
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
    const { data: identity } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = (identity?.role as string) ?? 'client'

    // /dashboard → redirect to role home
    if (path === '/dashboard') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }

    if (role !== 'admin') {
      const { data: clientRecord } = await supabase
        .from('clients')
        .select('plan_tier_key, status, metadata')
        .eq('id', user.id)
        .maybeSingle()

      const status = (clientRecord?.status as string | null) ?? ''
      const approvedByAdmin = ['approved', 'admin_approved'].includes(status)
      const paidAccess = status === 'active' && !!clientRecord?.plan_tier_key

      if (!paidAccess && !approvedByAdmin) {
        const metadata = (clientRecord?.metadata as Record<string, unknown> | null) ?? {}
        const requestedPlan = typeof metadata.requested_plan_tier_key === 'string' ? metadata.requested_plan_tier_key : ''
        const url = request.nextUrl.clone()

        if (requestedPlan && requestedPlan !== 'personal_free') {
          url.pathname = '/onboarding'
          url.searchParams.set('tier', requestedPlan)
          url.searchParams.set('reason', 'payment_required')
        } else {
          url.pathname = '/pricing'
          url.searchParams.set('path', role)
          url.searchParams.set('reason', 'complete_signup')
        }

        return NextResponse.redirect(url)
      }
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
