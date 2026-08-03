const { createServerClient } = require('@supabase/ssr')
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TOKEN = process.argv[2]
const sub = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64url').toString()).sub

const expiresAt = Math.floor(Date.now() / 1000) + 3600
const sessionJson = JSON.stringify({
  access_token: TOKEN, refresh_token: 'r', expires_in: 3600,
  expires_at: expiresAt, token_type: 'bearer',
})
const sessCookie = `base64-${Buffer.from(sessionJson).toString('base64url')}`

// candidate cookie names
const b64Base = Buffer.from('https://db.evolvededen.com').toString('base64url')
const b64Auth = Buffer.from('https://db.evolvededen.com/auth/v1').toString('base64url')
const candidates = [
  'supabase.auth.token',
  `sb-${b64Base}-auth-token`,
  `sb-${b64Auth}-auth-token`,
  `sb-${b64Base}-auth-token-code-verifier`,
]

async function test(name) {
  const c = createServerClient(URL, ANON, {
    cookies: { getAll() { return [{ name, value: sessCookie }] }, setAll() {} },
  })
  const { data: s } = await c.auth.getSession()
  if (!s.session) return `${name} -> null`
  const { data } = await c.from('users').select('role').eq('id', sub).single()
  return `${name} -> SESSION + query ${JSON.stringify(data)}`
}

async function main() {
  for (const n of candidates) {
    console.log(await test(n))
  }
}
main().catch(e => { console.error('FATAL', e.message); process.exit(1) })