import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

function mockSupabaseClient(opts: {
  user: { id: string } | null
  role?: string
  authError?: boolean
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.user },
        error: opts.authError ? new Error('auth failed') : null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: opts.role ?? null } }),
          maybeSingle: vi.fn().mockResolvedValue({ data: { role: opts.role ?? null } }),
        }),
      }),
    }),
  }
}

function makeRequest(path: string) {
  return {
    nextUrl: { pathname: path, clone: () => ({ pathname: path, searchParams: new URLSearchParams() }) },
    url: `http://localhost:3000${path}`,
    cookies: { getAll: () => [], set: vi.fn() },
  } as any
}

describe('proxy auth gates', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  })

  it('rejects unauthenticated /api/admin/* with 401', async () => {
    const ssr = await import('@supabase/ssr')
    ;(ssr.createServerClient as any).mockReturnValue(
      mockSupabaseClient({ user: null, authError: true })
    )
    const { proxy } = await import('@/proxy')
    const res = await proxy(makeRequest('/api/admin/users'))
    expect(res.status).toBe(401)
  })

  it('rejects non-admin /api/admin/* with 403', async () => {
    const ssr = await import('@supabase/ssr')
    ;(ssr.createServerClient as any).mockReturnValue(
      mockSupabaseClient({ user: { id: 'u1' }, role: 'client' })
    )
    const { proxy } = await import('@/proxy')
    const res = await proxy(makeRequest('/api/admin/users'))
    expect(res.status).toBe(403)
  })

  it('rejects unauthenticated /api/client/* with 401', async () => {
    const ssr = await import('@supabase/ssr')
    ;(ssr.createServerClient as any).mockReturnValue(
      mockSupabaseClient({ user: null, authError: true })
    )
    const { proxy } = await import('@/proxy')
    const res = await proxy(makeRequest('/api/client/profile'))
    expect(res.status).toBe(401)
  })

  it('allows admin user through /api/admin/*', async () => {
    const ssr = await import('@supabase/ssr')
    ;(ssr.createServerClient as any).mockReturnValue(
      mockSupabaseClient({ user: { id: 'u1' }, role: 'admin' })
    )
    const { proxy } = await import('@/proxy')
    const res = await proxy(makeRequest('/api/admin/users'))
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })
})
