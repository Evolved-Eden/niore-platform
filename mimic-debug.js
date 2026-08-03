const { createServerClient } = require('@supabase/ssr')

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TOKEN = process.argv[2]

// decode JWT payload (HS256 — signature not needed, just claims)
const sub = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64url').toString()).sub

const COOKIE_NAME = 'sb-aHR0cHM6Ly9kYi5ldm9sdmVkZWRlbi5jb20-auth-token'

async function makeClient(cookieValue) {
  const supabase = createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return [{ name: COOKIE_NAME, value: cookieValue }]
      },
      setAll() {},
    },
  })
  return supabase
}

async function main() {
  console.log('URL:', URL)
  console.log('anon key prefix:', ANON.slice(0, 20))
  console.log('sub:', sub)

  // 1. raw JWT cookie — getSession
  const c1 = await makeClient(TOKEN)
  const { data: s1 } = await c1.auth.getSession()
  console.log('raw-jwt getSession ->', s1.session ? 'SESSION (access_token ' + s1.session.access_token.slice(0, 16) + '...)' : 'null')

  // 2. raw JWT cookie — .single() query
  const { data: singleData, error: singleErr } = await c1
    .from('users').select('role').eq('id', sub).single()
  console.log('raw-jwt .single() ->', JSON.stringify(singleData), '| err:', singleErr && singleErr.message)

  // 3. raw JWT cookie — .maybeSingle()
  const { data: msData, error: msErr } = await c1
    .from('users').select('role').eq('id', sub).maybeSingle()
  console.log('raw-jwt .maybeSingle() ->', JSON.stringify(msData), '| err:', msErr && msErr.message)

  // 4. JSON session cookie
  const json = JSON.stringify({ access_token: TOKEN, refresh_token: 'r', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer' })
  const c2 = await makeClient(json)
  const { data: s2 } = await c2.auth.getSession()
  console.log('json getSession ->', s2.session ? 'SESSION' : 'null')
  const { data: jd, error: je } = await c2.from('users').select('role').eq('id', sub).single()
  console.log('json .single() ->', JSON.stringify(jd), '| err:', je && je.message)
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1) })