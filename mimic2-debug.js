const { createServerClient } = require('@supabase/ssr')
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TOKEN = process.argv[2]
const sub = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64url').toString()).sub

// Exactly what the FIXED setSessionCookies writes:
const expiresAt = Math.floor(Date.now() / 1000) + 3600
const sessionJson = JSON.stringify({
  access_token: TOKEN, refresh_token: 'r', expires_in: 3600,
  expires_at: expiresAt, token_type: 'bearer',
})
const sessCookie = `base64-${Buffer.from(sessionJson).toString('base64url')}`
const sbCookie = `sb-aHR0cHM6Ly9kYi5ldm9sdmVkZWRlbi5jb20-auth-token`

async function makeClient(cookies) {
  return createServerClient(URL, ANON, {
    cookies: { getAll() { return cookies }, setAll() {} },
  })
}

async function main() {
  // sign-in user now has BOTH cookies
  const cookies = [
    { name: sbCookie, value: TOKEN },
    { name: 'supabase.auth.token', value: sessCookie },
  ]
  const c = await makeClient(cookies)
  const { data: s } = await c.auth.getSession()
  console.log('getSession ->', s.session ? 'SESSION OK (' + s.session.access_token.slice(0, 16) + '...)' : 'null')
  const { data: d1, error: e1 } = await c.from('users').select('role').eq('id', sub).single()
  console.log('.single() ->', JSON.stringify(d1), '| err:', e1 && e1.message)
  const { data: d2 } = await c.from('users').select('role, full_name').eq('id', sub).single()
  console.log('layout .single() ->', JSON.stringify(d2))
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1) })