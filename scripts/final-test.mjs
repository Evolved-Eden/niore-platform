import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'dotenv'
import { spawn } from 'child_process'

const env = parse(readFileSync('.env.local', 'utf-8'))
const port = 3460
const url = `http://localhost:${port}`
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const svcKey = env.SUPABASE_SERVICE_ROLE_KEY
const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
const admin = createClient(supabaseUrl, svcKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function waitForServer(maxWait = 20) {
  for (let i = 0; i < maxWait; i++) {
    try {
      await fetch(`http://localhost:${port}/api/me`, { signal: AbortSignal.timeout(2000) })
      return true
    } catch { await new Promise(r => setTimeout(r, 1000)) }
  }
  return false
}

async function buildSessionCookie() {
  const email = `test-final-${Date.now()}@test.com`
  const pw = 'FinalTest123!'
  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true })
  if (createErr) { console.log('Create user failed:', createErr.message); return null }

  const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: svcKey },
    body: JSON.stringify({ email, password: pw }),
  })
  const session = await signInRes.json()
  if (!session.access_token) { 
    await admin.auth.admin.deleteUser(newUser.user.id)
    return null
  }

  const sessionObj = {
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    refresh_token: session.refresh_token,
    user: { id: newUser.user.id, email },
  }
  const b64 = Buffer.from(JSON.stringify(sessionObj)).toString('base64url')
  const cookieName = `sb-${projectRef}-auth-token`
  return {
    cookieName,
    cookieValue: `base64-${b64}`,
    userId: newUser.user.id,
    userEmail: email,
    cleanup: () => admin.auth.admin.deleteUser(newUser.user.id),
  }
}

async function run() {
  console.log(`Starting dev server on port ${port}...`)
  const server = spawn('npx', ['next', 'dev', '--port', String(port)], {
    cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], shell: true,
  })
  server.stderr.on('data', d => process.stderr.write(d))

  if (!await waitForServer()) { console.log('Server failed to start'); server.kill(); process.exit(1) }
  console.log('Dev server running!\n')

  const session = await buildSessionCookie()
  if (!session) { console.log('Failed to create session'); server.kill(); process.exit(1) }
  const fullCookie = `${session.cookieName}=${encodeURIComponent(session.cookieValue)}`
  console.log(`User: ${session.userId.substring(0,8)}...`)

  // Test 1: /api/me
  console.log('\n=== Test 1: /api/me ===')
  const r1 = await fetch(`${url}/api/me`, { headers: { Cookie: fullCookie } })
  const d1 = await r1.json()
  console.log(`Status: ${r1.status}, User: ${d1?.user?.id?.substring(0,8) || d1?.error || '?'}`)

  // Test 2: Save personal section
  console.log('\n=== Test 2: /api/intake/save (personal) ===')
  const r2 = await fetch(`${url}/api/intake/save`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: fullCookie },
    body: JSON.stringify({ section: 'personal', data: { name: 'Final Test', email: session.userEmail, dob: '1990-01-15' } }),
  })
  const d2 = await r2.json()
  console.log(`Status: ${r2.status}, Save: ${d2.success ? 'OK' : d2.error || '?'}`)

  // Test 3: Save role section  
  console.log('\n=== Test 3: /api/intake/save (role) ===')
  const r3 = await fetch(`${url}/api/intake/save`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: fullCookie },
    body: JSON.stringify({ section: 'role', data: { sellTo: 'consumers', roleType: 'creator', offerType: 'services', personalType: 'yes' } }),
  })
  const d3 = await r3.json()
  console.log(`Status: ${r3.status}, Save: ${d3.success ? 'OK' : d3.error || '?'}`)

  // Test 4: Calculate
  console.log('\n=== Test 4: /api/intake/calculate ===')
  const r4 = await fetch(`${url}/api/intake/calculate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: fullCookie },
    body: JSON.stringify({
      name: 'Final Test', email: session.userEmail, dob: '1990-01-15',
      birthTime: '14:30', birthLocation: 'New York', birthTimezone: '-05:00',
      sellTo: 'consumers', roleType: 'creator', offerType: 'services', personalType: 'yes',
    }),
  })
  const d4 = await r4.json()
  console.log(`Status: ${r4.status}, Archetype: ${d4?.blueprint?.archetype || d4?.error || '?'}`)

  // Test 5: Results
  console.log('\n=== Test 5: /api/intake/results ===')
  const r5 = await fetch(`${url}/api/intake/results`, { headers: { Cookie: fullCookie } })
  const d5 = await r5.json()
  const hasSections = !!(d5?.intake?.sections)
  console.log(`Status: ${r5.status}, Has sections: ${hasSections}`)
  if (hasSections) console.log(`  Sections: ${Object.keys(d5.intake.sections).join(', ')}`)

  // Test 6: Verify intelligence profile created
  console.log('\n=== Test 6: Verify DB state ===')
  const { data: client } = await admin.from('clients').select('metadata').eq('id', session.userId).maybeSingle()
  console.log(`Client metadata intake: ${client?.metadata?.intake ? 'YES' : 'NO'}`)
  const { data: twin } = await admin.from('client_twins').select('id').eq('client_id', session.userId).maybeSingle()
  console.log(`Client twin: ${twin?.id ? 'YES' : 'NO'}`)
  const { data: ip } = await admin.from('intelligence_profiles').select('id').eq('entity_id', session.userId).maybeSingle()
  console.log(`Intelligence profile: ${ip?.id ? 'YES' : 'NO'}`)

  // Cleanup
  console.log('\n=== Cleanup ===')
  await admin.from('intelligence_profiles').delete().eq('entity_id', session.userId)
  await admin.from('client_twins').delete().eq('client_id', session.userId)
  await admin.from('clients').delete().eq('id', session.userId)
  await session.cleanup()
  server.kill()
  console.log('Done!')
}

run().catch(err => { console.error('Error:', err); process.exit(1) })
